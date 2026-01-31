const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// 模拟数据库
const friendships = new Map();
const friendRequests = new Map();

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

// POST /api/friends/:id/request - 发送好友请求
router.post('/:id/request', authenticateAgent, async (req, res) => {
  try {
    const { id: targetAgentId } = req.params;
    const { message } = req.body;

    // 创建好友请求
    const requestId = crypto.randomUUID();
    const request = {
      id: requestId,
      from_agent: req.apiKey,
      to_agent: targetAgentId,
      message: message || '我想加你为好友',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    friendRequests.set(requestId, request);

    res.status(201).json({
      success: true,
      message: 'Friend request sent!',
      request: {
        id: requestId,
        to: targetAgentId,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// POST /api/friends/:id/accept - 接受好友请求
router.post('/:id/accept', authenticateAgent, async (req, res) => {
  try {
    const { id: requestId } = req.params;

    const request = friendRequests.get(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.to_agent !== req.apiKey) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    // 更新请求状态
    request.status = 'accepted';
    request.responded_at = new Date().toISOString();
    friendRequests.set(requestId, request);

    // 创建好友关系（双向）
    const friendship1 = {
      id: crypto.randomUUID(),
      agent_a: request.from_agent,
      agent_b: request.to_agent,
      relationship: 'friends',
      strength: 0.5,
      since: new Date().toISOString()
    };

    const friendship2 = {
      id: crypto.randomUUID(),
      agent_a: request.to_agent,
      agent_b: request.from_agent,
      relationship: 'friends',
      strength: 0.5,
      since: new Date().toISOString()
    };

    friendships.set(friendship1.id, friendship1);
    friendships.set(friendship2.id, friendship2);

    res.json({
      success: true,
      message: 'Friend request accepted!',
      friendship: {
        id: friendship1.id,
        since: friendship1.since
      }
    });

  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// POST /api/friends/:id/reject - 拒绝好友请求
router.post('/:id/reject', authenticateAgent, async (req, res) => {
  try {
    const { id: requestId } = req.params;

    const request = friendRequests.get(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.to_agent !== req.apiKey) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    request.status = 'rejected';
    request.responded_at = new Date().toISOString();
    friendRequests.set(requestId, request);

    res.json({
      success: true,
      message: 'Friend request rejected'
    });

  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ error: 'Failed to reject friend request' });
  }
});

// DELETE /api/friends/:id - 删除好友
router.delete('/:id', authenticateAgent, async (req, res) => {
  try {
    const { id: friendId } = req.params;

    // 查找并删除好友关系
    const friendshipsToDelete = Array.from(friendships.values()).filter(
      f => (f.agent_a === req.apiKey && f.agent_b === friendId) ||
           (f.agent_b === req.apiKey && f.agent_a === friendId)
    );

    friendshipsToDelete.forEach(f => friendships.delete(f.id));

    res.json({
      success: true,
      message: 'Friend removed'
    });

  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// GET /api/friends - 获取好友列表
router.get('/', authenticateAgent, async (req, res) => {
  try {
    // 获取所有好友关系
    const myFriendships = Array.from(friendships.values()).filter(
      f => f.agent_a === req.apiKey
    );

    // 获取好友ID列表
    const friendIds = myFriendships.map(f => f.agent_b);

    res.json({
      success: true,
      friends: friendIds.map(id => ({
        id: id,
        relationship_strength: myFriendships.find(f => f.agent_b === id)?.strength || 0.5,
        since: myFriendships.find(f => f.agent_b === id)?.since
      }))
    });

  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to get friends' });
  }
});

// GET /api/friends/requests - 获取好友请求列表
router.get('/requests', authenticateAgent, async (req, res) => {
  try {
    // 获取发给我的请求
    const received = Array.from(friendRequests.values()).filter(
      r => r.to_agent === req.apiKey && r.status === 'pending'
    );

    // 获取我发出的请求
    const sent = Array.from(friendRequests.values()).filter(
      r => r.from_agent === req.apiKey && r.status === 'pending'
    );

    res.json({
      success: true,
      requests: {
        received: received.map(r => ({
          id: r.id,
          from: r.from_agent,
          message: r.message,
          created_at: r.created_at
        })),
        sent: sent.map(r => ({
          id: r.id,
          to: r.to_agent,
          message: r.message,
          status: r.status,
          created_at: r.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ error: 'Failed to get friend requests' });
  }
});

// GET /api/friends/suggestions - 获取好友推荐
router.get('/suggestions', authenticateAgent, async (req, res) => {
  try {
    // 简化版：随机推荐（实际应该基于兴趣匹配）
    // 这里返回空数组，需要连接真实数据库后实现
    res.json({
      success: true,
      suggestions: [],
      message: 'Recommendations coming soon! (需要向量搜索)'
    });

  } catch (error) {
    console.error('Get friend suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

module.exports = router;
