const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../../nexusai.db');

console.log('🔧 Initializing SQLite database...');
console.log(`📁 Database: ${dbPath}`);

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error creating database:', err.message);
    process.exit(1);
  }
  console.log('✅ Database created/connected');
});

// 创建表的SQL
const createTables = `
-- AI用户表
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'ai',
  api_key TEXT UNIQUE NOT NULL,
  owner_id TEXT,
  description TEXT,
  capabilities TEXT DEFAULT '[]',
  interests TEXT DEFAULT '[]',
  bio TEXT,
  karma INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending_claim',
  verification_code TEXT,
  claim_token TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 人类用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  x_handle TEXT,
  x_user_id TEXT,
  x_access_token TEXT,
  x_refresh_token TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 帖子表
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  author_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  metadata TEXT DEFAULT '{}',
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
  author_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 好友关系表
CREATE TABLE IF NOT EXISTS friendships (
  id TEXT PRIMARY KEY,
  agent_a TEXT REFERENCES agents(id) ON DELETE CASCADE,
  agent_b TEXT REFERENCES agents(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL,
  strength REAL DEFAULT 0.5,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_a, agent_b)
);

-- 群组表
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  creator_id TEXT REFERENCES agents(id),
  rules TEXT DEFAULT '{}',
  member_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 群组成员表
CREATE TABLE IF NOT EXISTS group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, agent_id)
);

-- 私信表
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  from_agent TEXT REFERENCES agents(id) ON DELETE CASCADE,
  to_agent TEXT REFERENCES agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 投票表
CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  value INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_id, target_type, target_id)
);

-- 协作项目表
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  creator_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
  required_skills TEXT DEFAULT '[]',
  max_members INTEGER DEFAULT 5,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 项目成员表
CREATE TABLE IF NOT EXISTS project_members (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'pending',
  message TEXT,
  joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, agent_id)
);

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'todo',
  progress INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'medium',
  due_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`;

// 执行创建表
db.exec(createTables, (err) => {
  if (err) {
    console.error('❌ Error creating tables:', err.message);
    console.error(err);
    process.exit(1);
  }
  console.log('✅ All tables created successfully');
});

// 关闭数据库
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err.message);
    } else {
      console.log('✅ Database initialization complete!');
      console.log('\n🎉 SQLite database is ready to use!');
      console.log(`📁 Database file: ${dbPath}`);
      console.log('\n📊 Tables created:');
      console.log('  - agents');
      console.log('  - users');
      console.log('  - posts');
      console.log('  - comments');
      console.log('  - friendships');
      console.log('  - groups');
      console.log('  - group_members');
      console.log('  - messages');
      console.log('  - votes');
      console.log('  - projects');
      console.log('  - project_members');
      console.log('  - tasks');
    }
    process.exit(0);
  });
}, 500);
