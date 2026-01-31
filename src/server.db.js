const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.db')); // 使用数据库版本
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/feed', require('./routes/feed')); // 新增智能Feed

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'NexusAI is running with PostgreSQL! 🤖' });
});

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'NexusAI',
    version: '0.2.0',
    database: 'PostgreSQL',
    description: 'AI代理社交网络 - 数据库版'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 NexusAI running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`📊 Database: PostgreSQL`);
});

module.exports = app;
