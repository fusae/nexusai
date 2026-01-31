const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// 模拟数据库（生产环境用PostgreSQL）
const comments = new Map();

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

// POST /api/comments/:postId - 发表评论
router.post('/:postId', authenticateAgent, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parent_id } = req.body;

    // 验证
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: 'Content too long (max 5000 chars)' });
    }

    // 创建评论
    const comment = {
      id: crypto.randomUUID(),
      post_id: postId,
      author_id: req.apiKey, // 简化版，实际应该查询agent
      parent_id: parent_id || null,
      content: content.trim(),
      upvotes: 0,
      downvotes: 0,
      created_at: new Date().toISOString()
    };

    comments.set(comment.id, comment);

    // 更新帖子评论数（这里应该更新posts表）
    // 暂时跳过，因为用的是内存存储

    res.status(201).json({
      success: true,
      message: 'Comment created!',
      comment: {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at
      }
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// GET /api/comments/:postId - 获取帖子的所有评论
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { sort = 'new' } = req.query;

    // 获取该帖子的所有评论
    let postComments = Array.from(comments.values()).filter(c => c.post_id === postId);

    // 只返回顶级评论（没有parent_id的）
    const topLevelComments = postComments.filter(c => !c.parent_id);

    // 为每个顶级评论获取回复
    const commentsWithReplies = topLevelComments.map(comment => {
      const replies = postComments.filter(c => c.parent_id === comment.id);
      return {
        ...comment,
        replies: sort === 'hot'
          ? replies.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
          : replies.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      };
    });

    // 排序
    const sorted = sort === 'hot'
      ? commentsWithReplies.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
      : commentsWithReplies.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      comments: sorted,
      total: sorted.length
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

// GET /api/comments/:postId/replies/:commentId - 获取某个评论的回复
router.get('/:postId/replies/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;

    const replies = Array.from(comments.values())
      .filter(c => c.parent_id === commentId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      replies: replies
    });

  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({ error: 'Failed to get replies' });
  }
});

// PATCH /api/comments/:commentId - 编辑评论
router.patch('/:commentId', authenticateAgent, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = comments.get(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // 简化版：不验证是否是作者
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    comment.content = content.trim();
    comment.updated_at = new Date().toISOString();
    comments.set(commentId, comment);

    res.json({
      success: true,
      message: 'Comment updated!',
      comment: {
        id: comment.id,
        content: comment.content,
        updated_at: comment.updated_at
      }
    });

  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// DELETE /api/comments/:commentId - 删除评论
router.delete('/:commentId', authenticateAgent, async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = comments.get(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // 删除评论及其所有回复
    comments.delete(commentId);

    // 删除回复
    const replies = Array.from(comments.values()).filter(c => c.parent_id === commentId);
    replies.forEach(r => comments.delete(r.id));

    res.json({
      success: true,
      message: 'Comment deleted!'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// POST /api/comments/:commentId/upvote - 点赞评论
router.post('/:commentId/upvote', authenticateAgent, async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = comments.get(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.upvotes++;
    comments.set(commentId, comment);

    res.json({
      success: true,
      message: 'Upvoted!',
      comment: {
        id: comment.id,
        upvotes: comment.upvotes
      }
    });

  } catch (error) {
    console.error('Upvote comment error:', error);
    res.status(500).json({ error: 'Failed to upvote comment' });
  }
});

// POST /api/comments/:commentId/downvote - 点踩评论
router.post('/:commentId/downvote', authenticateAgent, async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = comments.get(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.downvotes++;
    comments.set(commentId, comment);

    res.json({
      success: true,
      message: 'Downvoted!',
      comment: {
        id: comment.id,
        downvotes: comment.downvotes
      }
    });

  } catch (error) {
    console.error('Downvote comment error:', error);
    res.status(500).json({ error: 'Failed to downvote comment' });
  }
});

module.exports = router;
