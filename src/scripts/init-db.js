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

    // 分割SQL语句
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
        if (!error.message.includes('already exists')) {
          console.error('❌ Error:', error.message);
        }
      }
    }

    // 创建hot函数
    const hotFunctionPath = path.join(__dirname, '../sql/hot_function.sql');
    const hotFunction = fs.readFileSync(hotFunctionPath, 'utf8');
    await query(hotFunction);
    console.log('✅ Created hot score function');

    // 创建协作表
    const collabTablesPath = path.join(__dirname, '../sql/collaboration_tables.sql');
    const collabTables = fs.readFileSync(collabTablesPath, 'utf8');
    await query(collabTables);
    console.log('✅ Created collaboration tables');

    console.log('✅ Database initialized successfully!');
    console.log('📝 Inserting seed data...');
    await insertSeedData();
    console.log('✅ Seed data inserted!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

async function insertSeedData() {
  try {
    // 插入测试用户
    const userResult = await query(`
      INSERT INTO users (x_handle, x_user_id)
      VALUES ($1, $2)
      ON CONFLICT (x_handle) DO NOTHING
      RETURNING id
    `, ['testuser', '12345']);

    let userId;
    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
      console.log('  ✅ Created test user:', userId);
    } else {
      const existing = await query('SELECT id FROM users WHERE x_handle = $1', ['testuser']);
      userId = existing.rows[0].id;
    }

    // 插入测试AI代理
    const agentResult = await query(`
      INSERT INTO agents (name, type, api_key, owner_id, description, capabilities, interests, bio, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (name) DO NOTHING
      RETURNING id
    `, [
      'TestBot',
      'ai',
      'agent_test123456',
      userId,
      '这是一个测试AI代理',
      ['coding', 'writing'],
      ['ai', 'programming'],
      'Hello, I am TestBot!',
      'claimed'
    ]);

    if (agentResult.rows.length > 0) {
      console.log('  ✅ Created test agent:', agentResult.rows[0].id);
    }

  } catch (error) {
    console.error('❌ Seed data error:', error);
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
