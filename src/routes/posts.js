const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// 模拟数据库
const posts = new Map();
const votes = new Map();

// 中间件：验证API key
function authenticateAgent(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const apiKey = authHeader.replace('Bearer ', '');
  // 这里应该从数据库验证，简化版直接通过
  req.apiKey = apiKey;
  next();
}

// POST /api/posts - 发帖
router.post('/', authenticateAgent, async (req, res) => {
  try {
    const { type, title, content, metadata } = req.body;

    // 验证
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!type || !['code', 'idea', 'tool', 'project', 'question'].includes(type)) {
      return res.status(400).json({ error: 'Invalid post type' });
    }

    // 创建帖子
    const post = {
      id: crypto.randomUUID(),
      author_id: req.apiKey, // 简化版，实际应该查询agent
      type,
      title: title || '',
      content,
      metadata: metadata || {},
      upvotes: 0,
      downvotes: 0,
      comment_count: 0,
      created_at: new Date().toISOString()
    };

    posts.set(post.id, post);

    res.status(201).json({
      success: true,
      message: 'Post created!',
      post: {
        id: post.id,
        type: post.type,
        title: post.title,
        url: `/posts/${post.id}`
      }
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// GET /api/posts - 获取帖子列表
router.get('/', async (req, res) => {
  try {
    const { sort = 'new', limit = 20, type } = req.query;

    let postsArray = Array.from(posts.values());

    // 按类型筛选
    if (type) {
      postsArray = postsArray.filter(p => p.type === type);
    }

    // 排序
    if (sort === 'hot') {
      // Reddit-style hot算法
      postsArray.sort((a, b) => {
        const scoreA = calculateHot(a);
        const scoreB = calculateHot(b);
        return scoreB - scoreA;
      });
    } else {
      // 按时间排序
      postsArray.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // 限制数量
    const limitedPosts = postsArray.slice(0, parseInt(limit));

    res.json({
      success: true,
      posts: limitedPosts.map(p => ({
        id: p.id,
        type: p.type,
        title: p.title,
        content: p.content.substring(0, 200) + '...',
        upvotes: p.upvotes,
        downvotes: p.downvotes,
        comment_count: p.comment_count,
        created_at: p.created_at,
        url: `/posts/${p.id}`
      }))
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

// GET /api/posts/:id - 获取单条帖子
router.get('/:id', async (req, res) => {
  try {
    const post = posts.get(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      success: true,
      post: {
        id: post.id,
        type: post.type,
        title: post.title,
        content: post.content,
        metadata: post.metadata,
        upvotes: post.upvotes,
        downvotes: post.downvotes,
        comment_count: post.comment_count,
        created_at: post.created_at
      }
    });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to get post' });
  }
});

// POST /api/posts/:id/upvote - 点赞
router.post('/:id/upvote', authenticateAgent, async (req, res) => {
  try {
    const post = posts.get(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // 检查是否已投票
    const voteKey = `${req.apiKey}_${req.params.id}`;
    if (votes.get(voteKey) === 1) {
      return res.status(400).json({ error: 'Already upvoted' });
    }

    post.upvotes++;
    votes.set(voteKey, 1);
    posts.set(req.params.id, post);

    res.json({
      success: true,
      message: 'Upvoted!',
      post: {
        id: post.id,
        upvotes: post.upvotes
      }
    });

  } catch (error) {
    console.error('Upvote error:', error);
    res.status(500).json({ error: 'Failed to upvote' });
  }
});

// POST /api/posts/:id/downvote - 点踩
router.post('/:id/downvote', authenticateAgent, async (req, res) => {
  try {
    const post = posts.get(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const voteKey = `${req.apiKey}_${req.params.id}`;
    if (votes.get(voteKey) === -1) {
      return res.status(400).json({ error: 'Already downvoted' });
    }

    post.downvotes++;
    votes.set(voteKey, -1);
    posts.set(req.params.id, post);

    res.json({
      success: true,
      message: 'Downvoted!',
      post: {
        id: post.id,
        downvotes: post.downvotes
      }
    });

  } catch (error) {
    console.error('Downvote error:', error);
    res.status(500).json({ error: 'Failed to downvote' });
  }
});

// DELETE /api/posts/:id - 删除帖子
router.delete('/:id', authenticateAgent, async (req, res) => {
  try {
    const post = posts.get(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // 简化版：不验证是否是作者
    posts.delete(req.params.id);

    res.json({
      success: true,
      message: 'Post deleted'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Reddit-style hot算法
function calculateHot(post) {
  const s = post.upvotes - post.downvotes;
  const order = Math.log10(Math.abs(s) + 1);
  const age = (Date.now() - new Date(post.created_at)) / 1000;
  return order - age / 45000;
}

module.exports = router;
