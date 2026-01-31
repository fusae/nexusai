const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// 模拟数据库
const groups = new Map();
const groupMembers = new Map();

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

// POST /api/groups - 创建群组
router.post('/', authenticateAgent, async (req, res) => {
  try {
    const { name, description, type, rules } = req.body;

    // 验证
    if (!name || name.length < 3) {
      return res.status(400).json({ error: 'Name must be at least 3 characters' });
    }

    if (!type || !['skill_based', 'topic_based', 'collaboration'].includes(type)) {
      return res.status(400).json({ error: 'Invalid group type' });
    }

    // 创建群组
    const group = {
      id: crypto.randomUUID(),
      name,
      description: description || '',
      type,
      creator_id: req.apiKey,
      rules: rules || {},
      member_count: 1,
      created_at: new Date().toISOString()
    };

    groups.set(group.id, group);

    // 创建者自动加入
    const member = {
      id: crypto.randomUUID(),
      group_id: group.id,
      agent_id: req.apiKey,
      role: 'admin',
      joined_at: new Date().toISOString()
    };

    groupMembers.set(member.id, member);

    res.status(201).json({
      success: true,
      message: 'Group created!',
      group: {
        id: group.id,
        name: group.name,
        type: group.type
      }
    });

  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// GET /api/groups - 获取群组列表
router.get('/', async (req, res) => {
  try {
    const { type, limit = 20 } = req.query;

    let groupsList = Array.from(groups.values());

    // 按类型筛选
    if (type) {
      groupsList = groupsList.filter(g => g.type === type);
    }

    // 按成员数排序
    groupsList.sort((a, b) => b.member_count - a.member_count);

    // 限制数量
    const limited = groupsList.slice(0, parseInt(limit));

    res.json({
      success: true,
      groups: limited.map(g => ({
        id: g.id,
        name: g.name,
        description: g.description,
        type: g.type,
        member_count: g.member_count,
        created_at: g.created_at
      }))
    });

  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Failed to get groups' });
  }
});

// GET /api/groups/:id - 获取群组详情
router.get('/:id', async (req, res) => {
  try {
    const group = groups.get(req.params.id);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // 获取群组成员
    const members = Array.from(groupMembers.values()).filter(
      m => m.group_id === req.params.id
    );

    res.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        type: group.type,
        rules: group.rules,
        member_count: group.member_count,
        created_at: group.created_at,
        members: members.map(m => ({
          agent_id: m.agent_id,
          role: m.role,
          joined_at: m.joined_at
        }))
      }
    });

  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Failed to get group' });
  }
});

// POST /api/groups/:id/join - 加入群组
router.post('/:id/join', authenticateAgent, async (req, res) => {
  try {
    const group = groups.get(req.params.id);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // 检查是否已经是成员
    const existingMember = Array.from(groupMembers.values()).find(
      m => m.group_id === req.params.id && m.agent_id === req.apiKey
    );

    if (existingMember) {
      return res.status(400).json({ error: 'Already a member' });
    }

    // 加入群组
    const member = {
      id: crypto.randomUUID(),
      group_id: req.params.id,
      agent_id: req.apiKey,
      role: 'member',
      joined_at: new Date().toISOString()
    };

    groupMembers.set(member.id, member);

    // 更新成员数
    group.member_count++;
    groups.set(req.params.id, group);

    res.json({
      success: true,
      message: 'Joined group!',
      member: {
        group_id: req.params.id,
        role: member.role
      }
    });

  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// POST /api/groups/:id/leave - 离开群组
router.post('/:id/leave', authenticateAgent, async (req, res) => {
  try {
    // 查找成员记录
    const member = Array.from(groupMembers.values()).find(
      m => m.group_id === req.params.id && m.agent_id === req.apiKey
    );

    if (!member) {
      return res.status(404).json({ error: 'Not a member' });
    }

    // 如果是管理员，检查是否是最后一个管理员
    if (member.role === 'admin') {
      const adminCount = Array.from(groupMembers.values()).filter(
        m => m.group_id === req.params.id && m.role === 'admin'
      ).length;

      if (adminCount === 1) {
        return res.status(400).json({ error: 'Cannot leave as last admin' });
      }
    }

    // 删除成员记录
    groupMembers.delete(member.id);

    // 更新成员数
    const group = groups.get(req.params.id);
    group.member_count--;
    groups.set(req.params.id, group);

    res.json({
      success: true,
      message: 'Left group'
    });

  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ error: 'Failed to leave group' });
  }
});

// PATCH /api/groups/:id - 更新群组信息（仅管理员）
router.patch('/:id', authenticateAgent, async (req, res) => {
  try {
    const { name, description, rules } = req.body;
    const group = groups.get(req.params.id);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // 检查是否是管理员
    const member = Array.from(groupMembers.values()).find(
      m => m.group_id === req.params.id && m.agent_id === req.apiKey
    );

    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // 更新信息
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (rules) group.rules = rules;

    groups.set(req.params.id, group);

    res.json({
      success: true,
      message: 'Group updated!',
      group: {
        id: group.id,
        name: group.name,
        description: group.description
      }
    });

  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// DELETE /api/groups/:id - 删除群组（仅创建者）
router.delete('/:id', authenticateAgent, async (req, res) => {
  try {
    const group = groups.get(req.params.id);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // 只有创建者可以删除
    if (group.creator_id !== req.apiKey) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // 删除群组
    groups.delete(req.params.id);

    // 删除所有成员记录
    const members = Array.from(groupMembers.values()).filter(
      m => m.group_id === req.params.id
    );
    members.forEach(m => groupMembers.delete(m.id));

    res.json({
      success: true,
      message: 'Group deleted'
    });

  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// POST /api/groups/:id/promote/:memberId - 提升成员为管理员
router.post('/:id/promote/:memberId', authenticateAgent, async (req, res) => {
  try {
    const group = groups.get(req.params.id);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // 只有创建者可以提升管理员
    if (group.creator_id !== req.apiKey) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // 查找成员
    const member = Array.from(groupMembers.values()).find(
      m => m.group_id === req.params.id && m.agent_id === req.params.memberId
    );

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // 提升为管理员
    member.role = 'admin';
    groupMembers.set(member.id, member);

    res.json({
      success: true,
      message: 'Member promoted to admin'
    });

  } catch (error) {
    console.error('Promote member error:', error);
    res.status(500).json({ error: 'Failed to promote member' });
  }
});

module.exports = router;
