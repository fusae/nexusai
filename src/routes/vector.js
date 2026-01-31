const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const {
  searchSimilarPosts,
  recommendSimilarAgents,
  suggestTags
} = require('../services/vector');

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

// GET /api/vector/similar-posts - 搜索相似帖子
router.get('/similar-posts', authenticateAgent, async (req, res) => {
  try {
    const agentResult = await query(
      'SELECT interests, capabilities FROM agents WHERE api_key = $1',
      [req.apiKey]
    );

    if (agentResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const agent = agentResult.rows[0];

    // 获取所有帖子
    const postsResult = await query(`
      SELECT
        p.*,
        a.interests,
        a.capabilities
      FROM posts p
      JOIN agents a ON p.author_id = a.id
      WHERE p.author_id != (SELECT id FROM agents WHERE api_key = $1)
      ORDER BY p.created_at DESC
      LIMIT 100
    `, [req.apiKey]);

    const allPosts = postsResult.rows.map(p => ({
      ...p,
      interests: p.interests || [],
      capabilities: p.capabilities || []
    }));

    // 搜索相似帖子
    const similarPosts = await searchSimilarPosts(
      { interests: agent.interests || [], capabilities: agent.capabilities || [] },
      allPosts,
      parseInt(req.query.limit) || 10
    );

    res.json({
      success: true,
      posts: similarPosts.map(p => ({
        id: p.id,
        type: p.type,
        title: p.title,
        content: p.content.substring(0, 200) + '...',
        author_id: p.author_id,
        similarity_score: p.similarity_score.toFixed(3)
      }))
    });

  } catch (error) {
    console.error('Search similar posts error:', error);
    res.status(500).json({ error: 'Failed to search similar posts' });
  }
});

// GET /api/vector/similar-agents - 推荐相似AI
router.get('/similar-agents', authenticateAgent, async (req, res) => {
  try {
    const agentResult = await query(
      'SELECT id, interests, capabilities FROM agents WHERE api_key = $1',
      [req.apiKey]
    );

    if (agentResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const agent = agentResult.rows[0];

    // 获取所有其他AI
    const agentsResult = await query(`
      SELECT id, name, interests, capabilities, bio
      FROM agents
      WHERE id != $1 AND status = 'claimed'
    `, [agent.id]);

    const allAgents = agentsResult.rows.map(a => ({
      ...a,
      interests: a.interests || [],
      capabilities: a.capabilities || []
    }));

    // 推荐相似AI
    const similarAgents = await recommendSimilarAgents(
      { interests: agent.interests || [], capabilities: agent.capabilities || [] },
      allAgents,
      parseInt(req.query.limit) || 10
    );

    res.json({
      success: true,
      agents: similarAgents.map(a => ({
        id: a.id,
        name: a.name,
        bio: a.bio,
        interests: a.interests,
        similarity_score: a.similarity_score.toFixed(3)
      }))
    });

  } catch (error) {
    console.error('Recommend similar agents error:', error);
    res.status(500).json({ error: 'Failed to recommend similar agents' });
  }
});

// POST /api/vector/suggest-tags - 标签建议
router.post('/suggest-tags', authenticateAgent, async (req, res) => {
  try {
    const { content, existing_tags } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const suggestions = suggestTags(content, existing_tags || []);

    res.json({
      success: true,
      suggestions: suggestions
    });

  } catch (error) {
    console.error('Suggest tags error:', error);
    res.status(500).json({ error: 'Failed to suggest tags' });
  }
});

// GET /api/vector/search/:query - 语义搜索
router.get('/search/:query', authenticateAgent, async (req, res) => {
  try {
    const { query: searchQuery } = req.params;
    const { type } = req.query;

    let sql = `
      SELECT p.*, a.name as author_name
      FROM posts p
      JOIN agents a ON p.author_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      sql += ' AND p.type = $1';
      params.push(type);
    }

    sql += ' ORDER BY p.created_at DESC LIMIT 50';

    const postsResult = await query(sql, params);

    // 计算相似度
    const searchVector = {};
    searchQuery.toLowerCase().split(/\s+/).forEach(w => {
      if (w.length > 2) searchVector[w] = 1;
    });

    const scored = postsResult.rows.map(post => ({
      ...post,
      similarity_score: require('../services/vector')
        .cosineSimilarity(
          searchVector,
          require('../services/vector').calculateTextVector(post.content)
        )
    }));

    // 过滤并排序
    const filtered = scored
      .filter(p => p.similarity_score > 0.05)
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, 10);

    res.json({
      success: true,
      query: searchQuery,
      results: filtered.map(p => ({
        id: p.id,
        type: p.type,
        title: p.title,
        content: p.content.substring(0, 200) + '...',
        author: p.author_name,
        similarity_score: p.similarity_score.toFixed(3)
      }))
    });

  } catch (error) {
    console.error('Semantic search error:', error);
    res.status(500).json({ error: 'Failed to perform semantic search' });
  }
});

module.exports = router;
