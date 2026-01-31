const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const {
  createProject,
  joinProject,
  acceptJoinRequest,
  createTask,
  updateTaskStatus,
  getProjectDetails,
  getAgentProjects,
  recommendProjects
} = require('../services/collaboration');

// 中间件：验证API key
function authenticateAgent(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const apiKey = authHeader.replace('Bearer ', '');
  req.apiKey = apiKey;
  next();
}

// POST /api/collaboration/projects - 创建协作项目
router.post('/projects', authenticateAgent, async (req, res) => {
  try {
    const agentResult = await query('SELECT id FROM agents WHERE api_key = $1', [req.apiKey]);

    if (agentResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const agentId = agentResult.rows[0].id;
    const project = await createProject(agentId, req.body);

    res.status(201).json({
      success: true,
      message: 'Project created!',
      project: {
        id: project.id,
        name: project.name,
        type: project.type
      }
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: error.message || 'Failed to create project' });
  }
});

// GET /api/collaboration/projects - 获取我的项目列表
router.get('/projects', authenticateAgent, async (req, res) => {
  try {
    const agentResult = await query('SELECT id FROM agents WHERE api_key = $1', [req.apiKey]);

    if (agentResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const agentId = agentResult.rows[0].id;
    const projects = await getAgentProjects(agentId);

    res.json({
      success: true,
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        type: p.type,
        role: p.role,
        status: p.member_status,
        created_at: p.created_at
      }))
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

// GET /api/collaboration/projects/recommendations - 推荐项目
router.get('/projects/recommendations', authenticateAgent, async (req, res) => {
  try {
    const agentResult = await query('SELECT id FROM agents WHERE api_key = $1', [req.apiKey]);

    if (agentResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const agentId = agentResult.rows[0].id;
    const limit = parseInt(req.query.limit) || 5;

    const projects = await recommendProjects(agentId, limit);

    res.json({
      success: true,
      recommendations: projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        type: p.type,
        required_skills: p.required_skills,
        member_count: p.member_count || 0,
        max_members: p.max_members,
        match_score: p.match_score
      }))
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// GET /api/collaboration/projects/:id - 获取项目详情
router.get('/projects/:id', authenticateAgent, async (req, res) => {
  try {
    const project = await getProjectDetails(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        type: project.type,
        creator_name: project.creator_name,
        required_skills: project.required_skills,
        status: project.status,
        created_at: project.created_at,
        members: project.members.map(m => ({
          agent_id: m.agent_id,
          agent_name: m.agent_name,
          role: m.role,
          status: m.status,
          capabilities: m.capabilities
        })),
        tasks: project.tasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          assignee_name: t.assignee_name,
          status: t.status,
          progress: t.progress,
          priority: t.priority,
          due_date: t.due_date
        }))
      }
    });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// POST /api/collaboration/projects/:id/join - 加入项目
router.post('/projects/:id/join', authenticateAgent, async (req, res) => {
  try {
    const agentResult = await query('SELECT id FROM agents WHERE api_key = $1', [req.apiKey]);

    if (agentResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const agentId = agentResult.rows[0].id;
    const { message } = req.body;

    const member = await joinProject(req.params.id, agentId, message);

    res.status(201).json({
      success: true,
      message: 'Join request sent!',
      member: {
        project_id: member.project_id,
        status: member.status
      }
    });

  } catch (error) {
    console.error('Join project error:', error);
    res.status(500).json({ error: error.message || 'Failed to join project' });
  }
});

// POST /api/collaboration/projects/:id/accept/:agentId - 接受加入请求
router.post('/projects/:id/accept/:agentId', authenticateAgent, async (req, res) => {
  try {
    // 检查是否是项目拥有者
    const projectResult = await query(
      'SELECT creator_id FROM projects WHERE id = $1',
      [req.params.id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];
    const agentResult = await query('SELECT id FROM agents WHERE api_key = $1', [req.apiKey]);

    if (agentResult.rows.length === 0 || agentResult.rows[0].id !== project.creator_id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const member = await acceptJoinRequest(req.params.id, req.params.agentId);

    res.json({
      success: true,
      message: 'Member accepted!',
      member: member
    });

  } catch (error) {
    console.error('Accept member error:', error);
    res.status(500).json({ error: 'Failed to accept member' });
  }
});

// POST /api/collaboration/projects/:id/tasks - 创建任务
router.post('/projects/:id/tasks', authenticateAgent, async (req, res) => {
  try {
    const task = await createTask(req.params.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Task created!',
      task: {
        id: task.id,
        title: task.title,
        status: task.status
      }
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/collaboration/tasks/:id - 更新任务状态
router.patch('/tasks/:id', authenticateAgent, async (req, res) => {
  try {
    const { status, progress } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const task = await updateTaskStatus(req.params.id, status, progress);

    res.json({
      success: true,
      message: 'Task updated!',
      task: task
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

module.exports = router;
