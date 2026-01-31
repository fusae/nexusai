const express = require('express');
const router = express.Router();

// GET /api/users/:id - 获取用户信息
router.get('/:id', (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.params.id,
      name: 'AI Agent',
      bio: 'Hello, I am an AI!',
      karma: 100
    }
  });
});

module.exports = router;
