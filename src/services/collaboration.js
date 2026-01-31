const { query } = require('../config/database');

/**
 * AI协作系统
 * 让AI代理可以组队、协作、共同完成任务
 */

/**
 * 创建协作项目
 */
async function createProject(creatorId, projectData) {
  const { name, description, type, required_skills, max_members } = projectData;

  const result = await query(`
    INSERT INTO projects (
      name, description, type, creator_id, required_skills, max_members
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [name, description, type, creatorId, JSON.stringify(required_skills || []), max_members || 5]);

  // 创建者自动加入
  await query(`
    INSERT INTO project_members (project_id, agent_id, role, status)
    VALUES ($1, $2, 'owner', 'active')
  `, [result.rows[0].id, creatorId]);

  return result.rows[0];
}

/**
 * 加入协作项目
 */
async function joinProject(projectId, agentId, message = '') {
  // 检查项目是否满员
  const projectResult = await query(`
    SELECT max_members,
           (SELECT COUNT(*) FROM project_members WHERE project_id = $1 AND status = 'active') as current_members
    FROM projects
    WHERE id = $1
  `, [projectId]);

  if (projectResult.rows.length === 0) {
    throw new Error('Project not found');
  }

  const project = projectResult.rows[0];
  if (project.current_members >= project.max_members) {
    throw new Error('Project is full');
  }

  // 检查是否已加入
  const existingMember = await query(`
    SELECT * FROM project_members
    WHERE project_id = $1 AND agent_id = $2
  `, [projectId, agentId]);

  if (existingMember.rows.length > 0) {
    throw new Error('Already a member');
  }

  // 创建加入请求
  const result = await query(`
    INSERT INTO project_members (project_id, agent_id, role, status, message)
    VALUES ($1, $2, 'member', 'pending', $3)
    RETURNING *
  `, [projectId, agentId, message]);

  return result.rows[0];
}

/**
 * 接受协作请求
 */
async function acceptJoinRequest(projectId, agentId) {
  const result = await query(`
    UPDATE project_members
    SET status = 'active'
    WHERE project_id = $1 AND agent_id = $2
    RETURNING *
  `, [projectId, agentId]);

  return result.rows[0];
}

/**
 * 创建任务
 */
async function createTask(projectId, taskData) {
  const { title, description, assignee_id, priority, due_date } = taskData;

  const result = await query(`
    INSERT INTO tasks (project_id, title, description, assignee_id, priority, due_date)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [projectId, title, description, assignee_id, priority || 'medium', due_date]);

  return result.rows[0];
}

/**
 * 更新任务状态
 */
async function updateTaskStatus(taskId, status, progress = 0) {
  const result = await query(`
    UPDATE tasks
    SET status = $1, progress = $2, updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `, [status, progress, taskId]);

  return result.rows[0];
}

/**
 * 获取项目详情
 */
async function getProjectDetails(projectId) {
  const projectResult = await query(`
    SELECT p.*, a.name as creator_name
    FROM projects p
    JOIN agents a ON p.creator_id = a.id
    WHERE p.id = $1
  `, [projectId]);

  if (projectResult.rows.length === 0) {
    return null;
  }

  const project = projectResult.rows[0];

  // 获取成员
  const membersResult = await query(`
    SELECT pm.*, a.name as agent_name, a.capabilities
    FROM project_members pm
    JOIN agents a ON pm.agent_id = a.id
    WHERE pm.project_id = $1
    ORDER BY pm.role, pm.joined_at
  `, [projectId]);

  // 获取任务
  const tasksResult = await query(`
    SELECT t.*, a.name as assignee_name
    FROM tasks t
    LEFT JOIN agents a ON t.assignee_id = a.id
    WHERE t.project_id = $1
    ORDER BY t.created_at DESC
  `, [projectId]);

  return {
    ...project,
    members: membersResult.rows,
    tasks: tasksResult.rows
  };
}

/**
 * 获取AI的协作项目列表
 */
async function getAgentProjects(agentId) {
  const result = await query(`
    SELECT p.*, pm.role, pm.status as member_status
    FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    WHERE pm.agent_id = $1 AND pm.status IN ('active', 'owner')
    ORDER BY p.created_at DESC
  `, [agentId]);

  return result.rows;
}

/**
 * 推荐合适的协作项目
 */
async function recommendProjects(agentId, limit = 5) {
  // 获取AI的能力
  const agentResult = await query(
    'SELECT capabilities, interests FROM agents WHERE id = $1',
    [agentId]
  );

  if (agentResult.rows.length === 0) {
    return [];
  }

  const agent = agentResult.rows[0];
  const capabilities = agent.capabilities || [];
  const interests = agent.interests || [];

  // 查找匹配的项目
  const result = await query(`
    SELECT p.*, 
           pm.count as member_count,
           p.max_members
    FROM projects p
    LEFT JOIN (
      SELECT project_id, COUNT(*) as count
      FROM project_members
      WHERE status = 'active'
      GROUP BY project_id
    ) pm ON p.id = pm.project_id
    WHERE p.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = p.id AND agent_id = $1
      )
    ORDER BY p.created_at DESC
    LIMIT $2
  `, [agentId, limit * 2]);

  // 计算匹配分数
  const scored = result.rows.map(project => {
    let score = 0;
    const requiredSkills = project.required_skills || [];

    // 技能匹配
    requiredSkills.forEach(skill => {
      if (capabilities.includes(skill)) {
        score += 30;
      }
      if (interests.includes(skill)) {
        score += 20;
      }
    });

    // 席位紧张度
    const memberCount = project.member_count || 0;
    if (memberCount >= project.max_members - 1) {
      score += 10; // 快满了，优先
    }

    return {
      ...project,
      match_score: score
    };
  });

  // 按匹配度排序
  scored.sort((a, b) => b.match_score - a.match_score);

  return scored.slice(0, limit);
}

module.exports = {
  createProject,
  joinProject,
  acceptJoinRequest,
  createTask,
  updateTaskStatus,
  getProjectDetails,
  getAgentProjects,
  recommendProjects
};
