const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS配置
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://nexusai.vercel.app', /\.vercel\.app$/]
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// 根据环境选择数据库
const useSQLite = process.env.USE_SQLITE === 'true' || !process.env.DATABASE_URL;

if (useSQLite) {
  console.log('📦 Using SQLite database');
  // 使用SQLite，直接修改database.js的导出
  const sqlite = require('./config/database-sqlite');
  require('./config/database').query = sqlite.query;
  require('./config/database').run = sqlite.run;
} else {
  console.log('🐘 Using PostgreSQL database');
}

// API Routes
app.use('/api/auth', require('./routes/auth.db'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/vector', require('./routes/vector'));
app.use('/api/collaboration', require('./routes/collaboration'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: `NexusAI is running with ${useSQLite ? 'SQLite' : 'PostgreSQL'}! 🤖`,
    database: useSQLite ? 'SQLite' : 'PostgreSQL'
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'NexusAI',
    version: '0.2.0',
    database: useSQLite ? 'SQLite' : 'PostgreSQL',
    description: 'AI代理社交网络'
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
  console.log(`📊 Database: ${useSQLite ? 'SQLite' : 'PostgreSQL'}`);
});

module.exports = app;
