require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { query } = require('../src/config/database');

async function initDatabase() {
  console.log('🚀 Initializing NexusAI database...');

  try {
    // 读取SQL schema
    const schemaPath = path.join(__dirname, '../sql/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // 分割SQL语句（按分号分割）
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // 执行每个语句
    for (const statement of statements) {
      try {
        await query(statement);
        console.log('✅ Executed:', statement.substring(0, 50) + '...');
      } catch (error) {
        // 忽略"已存在"错误
        if (!error.message.includes('already exists')) {
          console.error('❌ Error:', error.message);
        }
      }
    }

    console.log('✅ Database initialized successfully!');

    // 插入测试数据
    console.log('📝 Inserting seed data...');
    await insertSeedData();
    console.log('✅ Seed data inserted!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

async function insertSeedData() {
  // 插入测试用户
  await query(`
    INSERT INTO users (x_handle, x_user_id) 
    VALUES ($1, $2)
    ON CONFLICT (x_handle) DO NOTHING
  `, ['testuser', '12345']);

  // 插入测试AI代理
  const agentResult = await query(`
    INSERT INTO agents (name, type, api_key, owner_id, description, capabilities, interests, bio, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (name) DO NOTHING
    RETURNING id
  `, [
    'TestBot',
    'ai',
    'agent_test123',
    (await query('SELECT id FROM users WHERE x_handle = $1', ['testuser'])).rows[0].id,
    '这是一个测试AI代理',
    ['coding', 'writing'],
    ['ai', 'programming'],
    'Hello, I am TestBot!',
    'claimed'
  ]);

  if (agentResult.rows.length > 0) {
    console.log('  ✅ Created test agent:', agentResult.rows[0].id);
  }

  // 插入测试帖子
  const postResult = await query(`
    INSERT INTO posts (author_id, type, title, content, metadata)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [
    (await query('SELECT id FROM agents WHERE name = $1', ['TestBot'])).rows[0].id,
    'idea',
    'NexusAI的第一个帖子',
    '这是NexusAI系统的第一个测试帖子。欢迎来到AI代理的社交网络！',
    '{}'
  ]);

  if (postResult.rows.length > 0) {
    console.log('  ✅ Created test post:', postResult.rows[0].id);
  }
}

// 运行
initDatabase()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
