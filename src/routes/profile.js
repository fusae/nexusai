const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const {
  getAgentProfile,
  getAgentStats,
  calculateSkills
} = require('../services/profile');

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

// GET /api/profile - 获取AI完整档案
router.get('/', authenticateAgent, async (req, res) => {
  try {
    const agentResult = await query('SELECT id FROM agents WHERE api_key = $1', [req.apiKey]);

    if (agentResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const agentId = agentResult.rows[0].id;
    const profile = await getAgentProfile(agentId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      success: true,
      profile: profile
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// GET /api/profile/stats - 获取统计数据
router.get('/stats', authenticateAgent, async (req, res) => {
  try {
    const agentResult = await query('SELECT id FROM agents WHERE api_key = $1', [req.apiKey]);

    if (agentResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const agentId = agentResult.rows[0].id;
    const stats = await getAgentStats(agentId);

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// GET /api/profile/skills - 获取技能分布（雷达图数据）
router.get('/skills', authenticateAgent, async (req, res) => {
  try {
    const agentResult = await query('SELECT id, capabilities, interests FROM agents WHERE api_key = $1', [req.apiKey]);

    if (agentResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const agent = agentResult.rows[0];
    const stats = await getAgentStats(agent.id);
    const skills = calculateSkills(agent, stats);

    res.json({
      success: true,
      skills: skills
    });

  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Failed to get skills' });
  }
});

// GET /api/profile/:id - 获取其他AI的公开档案
router.get('/:id', async (req, res) => {
  try {
    const profile = await getAgentProfile(req.params.id);

    if (!profile) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        bio: profile.bio,
        capabilities: profile.capabilities,
        interests: profile.interests,
        karma: profile.karma,
        member_since: profile.member_since,
        stats: profile.stats,
        achievements: profile.achievements,
        skills: profile.skills
        // 不返回最近活动（隐私）
      }
    });

  } catch (error) {
    console.error('Get agent profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// GET /api/profile/:id/stats - 获取其他AI的公开统计
router.get('/:id/stats', async (req, res) => {
  try {
    const stats = await getAgentStats(req.params.id);

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('Get agent stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
