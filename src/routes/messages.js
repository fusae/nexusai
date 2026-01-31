const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// 模拟数据库
const messages = new Map();

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

// POST /api/messages - 发送消息
router.post('/', authenticateAgent, async (req, res) => {
  try {
    const { to_agent, content } = req.body;

    // 验证
    if (!to_agent) {
      return res.status(400).json({ error: 'Recipient required' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content required' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: 'Content too long (max 5000 chars)' });
    }

    // 不能发消息给自己
    if (to_agent === req.apiKey) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    // 创建消息
    const message = {
      id: crypto.randomUUID(),
      from_agent: req.apiKey,
      to_agent: to_agent,
      content: content.trim(),
      read: false,
      created_at: new Date().toISOString()
    };

    messages.set(message.id, message);

    res.status(201).json({
      success: true,
      message: 'Message sent!',
      data: {
        id: message.id,
        to: to_agent,
        created_at: message.created_at
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /api/messages/conversations - 获取会话列表
router.get('/conversations', authenticateAgent, async (req, res) => {
  try {
    // 获取所有相关的消息（发送的或接收的）
    const allMessages = Array.from(messages.values()).filter(
      m => m.from_agent === req.apiKey || m.to_agent === req.apiKey
    );

    // 按对话对象分组
    const conversations = {};

    allMessages.forEach(msg => {
      const otherAgent = msg.from_agent === req.apiKey ? msg.to_agent : msg.from_agent;

      if (!conversations[otherAgent]) {
        conversations[otherAgent] = {
          agent_id: otherAgent,
          last_message: msg,
          unread_count: 0,
          message_count: 0
        };
      }

      conversations[otherAgent].last_message = msg;
      conversations[otherAgent].message_count++;

      // 计算未读消息（发给当前用户且未读的）
      if (msg.to_agent === req.apiKey && !msg.read) {
        conversations[otherAgent].unread_count++;
      }
    });

    // 转换为数组并按最后消息时间排序
    const conversationList = Object.values(conversations).sort((a, b) =>
      new Date(b.last_message.created_at) - new Date(a.last_message.created_at)
    );

    res.json({
      success: true,
      conversations: conversationList
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// GET /api/messages/:userId - 获取与某AI的聊天记录
router.get('/:userId', authenticateAgent, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, before } = req.query;

    // 获取这两个AI之间的所有消息
    let chatMessages = Array.from(messages.values()).filter(
      m => (m.from_agent === req.apiKey && m.to_agent === userId) ||
           (m.from_agent === userId && m.to_agent === req.apiKey)
    );

    // 如果指定了before参数，只获取该时间之前的消息
    if (before) {
      chatMessages = chatMessages.filter(m => new Date(m.created_at) < new Date(before));
    }

    // 按时间排序（最新的在后面）
    chatMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // 限制数量（取最新的N条）
    const limited = chatMessages.slice(-parseInt(limit));

    // 标记发给当前用户的消息为已读
    const unreadMessages = limited.filter(m => m.to_agent === req.apiKey && !m.read);
    unreadMessages.forEach(m => {
      m.read = true;
      messages.set(m.id, m);
    });

    res.json({
      success: true,
      messages: limited,
      total: chatMessages.length,
      unread_marked: unreadMessages.length
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// PATCH /api/messages/:id/read - 标记消息为已读
router.patch('/:id/read', authenticateAgent, async (req, res) => {
  try {
    const { id } = req.params;
    const message = messages.get(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // 只能标记发给自己的消息
    if (message.to_agent !== req.apiKey) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    message.read = true;
    messages.set(id, message);

    res.json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// GET /api/messages/unread - 获取未读消息数
router.get('/unread/count', authenticateAgent, async (req, res) => {
  try {
    const unread = Array.from(messages.values()).filter(
      m => m.to_agent === req.apiKey && !m.read
    ).length;

    res.json({
      success: true,
      unread_count: unread
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// DELETE /api/messages/:id - 删除消息
router.delete('/:id', authenticateAgent, async (req, res) => {
  try {
    const { id } = req.params;
    const message = messages.get(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // 只能删除自己发送的消息
    if (message.from_agent !== req.apiKey) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    messages.delete(id);

    res.json({
      success: true,
      message: 'Message deleted'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// POST /api/messages/:userId/typing - 发送正在输入状态（预留）
router.post('/:userId/typing', authenticateAgent, async (req, res) => {
  // 这个功能需要WebSocket支持
  res.json({
    success: true,
    message: 'Typing indicator (WebSocket needed)'
  });
});

module.exports = router;
