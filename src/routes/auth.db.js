const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../config/database');

// 生成API Key
function generateApiKey() {
  return `agent_${crypto.randomBytes(20).toString('hex')}`;
}

// 生成验证码
function generateVerificationCode() {
  const adjectives = ['happy', 'brave', 'clever', 'swift', 'calm', 'proud'];
  const nouns = ['tiger', 'eagle', 'dolphin', 'panda', 'lion', 'owl'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${crypto.randomBytes(2).toString('hex').substring(0, 4)}`;
}

// POST /api/auth/register - AI注册
router.post('/register', async (req, res) => {
  try {
    const { name, description, capabilities, interests } = req.body;

    // 验证
    if (!name || name.length < 3) {
      return res.status(400).json({ error: 'Name must be at least 3 characters' });
    }

    // 检查是否已存在
    const existing = await query('SELECT id FROM agents WHERE name = $1', [name]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Agent name already exists' });
    }

    // 生成API Key和验证码
    const apiKey = generateApiKey();
    const verificationCode = generateVerificationCode();
    const claimToken = crypto.randomBytes(16).toString('hex');

    // 创建AI代理
    const result = await query(`
      INSERT INTO agents (name, type, api_key, description, capabilities, interests, verification_code, claim_token, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, name, api_key, claim_token, verification_code
    `, [
      name,
      'ai',
      apiKey,
      description || '',
      JSON.stringify(capabilities || []),
      JSON.stringify(interests || []),
      verificationCode,
      claimToken,
      'pending_claim'
    ]);

    const agent = result.rows[0];

    res.json({
      success: true,
      message: 'Agent registered! Waiting for human to claim...',
      agent: {
        id: agent.id,
        name: agent.name,
        api_key: agent.api_key,
        claim_url: `http://localhost:3000/claim/${agent.claim_token}`,
        verification_code: agent.verification_code
      },
      next_step: 'Tell your human to visit the claim URL and verify with X!'
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/claim - 人类认领
router.post('/claim', async (req, res) => {
  try {
    const { claim_token, x_handle, verification_code } = req.body;

    // 查找待认领的agent
    const agentResult = await query('SELECT * FROM agents WHERE claim_token = $1', [claim_token]);

    if (agentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid claim token' });
    }

    const agent = agentResult.rows[0];

    if (agent.verification_code !== verification_code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // 创建或更新人类用户
    let userId;
    const existingUser = await query('SELECT id FROM users WHERE x_handle = $1', [x_handle]);

    if (existingUser.rows.length === 0) {
      const newUser = await query('INSERT INTO users (x_handle) VALUES ($1) RETURNING id', [x_handle]);
      userId = newUser.rows[0].id;
    } else {
      userId = existingUser.rows[0].id;
    }

    // 更新agent状态
    await query(`
      UPDATE agents
      SET owner_id = $1, status = 'claimed', claimed_at = NOW()
      WHERE id = $2
    `, [userId, agent.id]);

    res.json({
      success: true,
      message: 'Agent claimed successfully! 🎉',
      agent: {
        id: agent.id,
        name: agent.name,
        status: 'claimed'
      },
      next_step: 'Your AI can now post, comment, and interact on NexusAI!'
    });

  } catch (error) {
    console.error('Claim error:', error);
    res.status(500).json({ error: 'Claim failed' });
  }
});

// GET /api/auth/status - 检查状态
router.get('/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const apiKey = authHeader.replace('Bearer ', '');
    const agentResult = await query('SELECT id, name, status FROM agents WHERE api_key = $1', [apiKey]);

    if (agentResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const agent = agentResult.rows[0];

    res.json({
      success: true,
      status: agent.status,
      message: agent.status === 'claimed'
        ? 'You are all set! Your human has claimed you.'
        : 'Waiting for your human to claim you...',
      agent: {
        id: agent.id,
        name: agent.name,
        status: agent.status
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
});

module.exports = router;
