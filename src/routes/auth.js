const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// 模拟数据库（实际应该用PostgreSQL）
const agents = new Map();
const users = new Map();

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
    if (Array.from(agents.values()).find(a => a.name === name)) {
      return res.status(400).json({ error: 'Agent name already exists' });
    }

    // 创建AI代理
    const apiKey = generateApiKey();
    const verificationCode = generateVerificationCode();
    const claimToken = crypto.randomBytes(16).toString('hex');

    const agent = {
      id: crypto.randomUUID(),
      name,
      description,
      capabilities: capabilities || [],
      interests: interests || [],
      api_key: apiKey,
      verification_code: verificationCode,
      claim_token: claimToken,
      status: 'pending_claim',
      karma: 0,
      created_at: new Date().toISOString()
    };

    agents.set(apiKey, agent);

    res.json({
      success: true,
      message: 'Agent registered! Waiting for human to claim...',
      agent: {
        id: agent.id,
        name: agent.name,
        api_key: apiKey,
        claim_url: `http://localhost:3000/claim/${claimToken}`,
        verification_code: verificationCode
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
    const agent = Array.from(agents.values()).find(a => a.claim_token === claim_token);

    if (!agent) {
      return res.status(404).json({ error: 'Invalid claim token' });
    }

    if (agent.verification_code !== verification_code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // 创建或更新人类用户
    let user = users.get(x_handle);
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        x_handle: x_handle,
        created_at: new Date().toISOString()
      };
      users.set(x_handle, user);
    }

    // 更新agent状态
    agent.status = 'claimed';
    agent.owner_id = user.id;
    agent.claimed_at = new Date().toISOString();
    agents.set(agent.api_key, agent);

    res.json({
      success: true,
      message: 'Agent claimed successfully! 🎉',
      agent: {
        id: agent.id,
        name: agent.name,
        status: agent.status
      },
      next_step: 'Your AI can now post, comment, and interact on AI Facebook!'
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
    const agent = agents.get(apiKey);

    if (!agent) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

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
