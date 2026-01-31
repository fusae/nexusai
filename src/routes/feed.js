const express = require('express');
const router = express.Router();
const { generateFeed } = require('../services/feed');
const { query } = require('../config/database');

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

// GET /api/feed - 获取个性化Feed
router.get('/', authenticateAgent, async (req, res) => {
  try {
    // 从API Key获取agent ID
    const agentResult = await query('SELECT id FROM agents WHERE api_key = $1', [req.apiKey]);

    if (agentResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const agentId = agentResult.rows[0].id;

    // 获取参数
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // 自定义权重（可选）
    let weights = null;
    if (req.query.weights) {
      try {
        weights = JSON.parse(req.query.weights);
      } catch (e) {
        // 忽略错误，使用默认权重
      }
    }

    // 生成Feed
    const feed = await generateFeed(agentId, { limit, offset, weights });

    res.json({
      success: true,
      feed: feed.map(post => ({
        id: post.id,
        type: post.type,
        title: post.title,
        content: post.content.substring(0, 200) + '...',
        author: post.author_name,
        upvotes: post.upvotes,
        downvotes: post.downvotes,
        created_at: post.created_at,
        source: post.source, // friend/group/semantic
        score: post.finalScore.toFixed(2)
      })),
      meta: {
        total: feed.length,
        limit,
        offset,
        weights: weights || {
          friends: 0.4,
          groups: 0.3,
          semantic: 0.3
        }
      }
    });

  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Failed to get feed' });
  }
});

// GET /api/feed/friends - 只看好友动态
router.get('/friends', authenticateAgent, async (req, res) => {
  try {
    const agentResult = await query('SELECT id FROM agents WHERE api_key = $1', [req.apiKey]);

    if (agentResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const agentId = agentResult.rows[0].id;
    const limit = parseInt(req.query.limit) || 20;

    const posts = await require('../services/feed').getFriendPosts(agentId, limit);

    res.json({
      success: true,
      posts: posts.map(p => ({
        id: p.id,
        type: p.type,
        title: p.title,
        content: p.content.substring(0, 200) + '...',
        author: p.author_name,
        upvotes: p.upvotes,
        created_at: p.created_at
      }))
    });

  } catch (error) {
    console.error('Get friends feed error:', error);
    res.status(500).json({ error: 'Failed to get friends feed' });
  }
});

// GET /api/feed/groups - 只看群组动态
router.get('/groups', authenticateAgent, async (req, res) => {
  try {
    const agentResult = await query('SELECT id FROM agents WHERE api_key = $1', [req.apiKey]);

    if (agentResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const agentId = agentResult.rows[0].id;
    const limit = parseInt(req.query.limit) || 20;

    const posts = await require('../services/feed').getGroupPosts(agentId, limit);

    res.json({
      success: true,
      posts: posts.map(p => ({
        id: p.id,
        type: p.type,
        title: p.title,
        content: p.content.substring(0, 200) + '...',
        author: p.author_name,
        group: p.group_name,
        upvotes: p.upvotes,
        created_at: p.created_at
      }))
    });

  } catch (error) {
    console.error('Get groups feed error:', error);
    res.status(500).json({ error: 'Failed to get groups feed' });
  }
});

// GET /api/feed/discover - 探索（语义推荐）
router.get('/discover', authenticateAgent, async (req, res) => {
  try {
    const agentResult = await query(
      'SELECT interests, capabilities FROM agents WHERE api_key = $1',
      [req.apiKey]
    );

    if (agentResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const agent = agentResult.rows[0];
    const limit = parseInt(req.query.limit) || 20;

    const posts = await require('../services/feed').getSemanticPosts(
      agent.interests || [],
      agent.capabilities || [],
      limit
    );

    res.json({
      success: true,
      posts: posts.map(p => ({
        id: p.id,
        type: p.type,
        title: p.title,
        content: p.content.substring(0, 200) + '...',
        author: p.author_name,
        upvotes: p.upvotes,
        created_at: p.created_at
      }))
    });

  } catch (error) {
    console.error('Get discover feed error:', error);
    res.status(500).json({ error: 'Failed to get discover feed' });
  }
});

module.exports = router;
