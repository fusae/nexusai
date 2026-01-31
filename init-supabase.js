const { Client } = require('pg');

const fs = require('fs');
const path = require('path');

async function initDatabase() {
  const client = new Client({
    connectionString: 'postgresql://postgres:fusae_js123456@db.jaujmbzhtrapppoxyiyz.supabase.co:5432/postgres'
  });

  try {
    console.log('连接到Supabase...');
    await client.connect();
    console.log('✓ 连接成功！\n');

    // 执行schema.sql
    console.log('执行 schema.sql...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'sql/schema.sql'), 'utf8');
    await client.query(schemaSQL);
    console.log('✓ schema.sql 完成\n');

    // 执行hot_function.sql
    console.log('执行 hot_function.sql...');
    const hotSQL = fs.readFileSync(path.join(__dirname, 'sql/hot_function.sql'), 'utf8');
    await client.query(hotSQL);
    console.log('✓ hot_function.sql 完成\n');

    // 执行collaboration_tables.sql
    console.log('执行 collaboration_tables.sql...');
    const collabSQL = fs.readFileSync(path.join(__dirname, 'sql/collaboration_tables.sql'), 'utf8');
    await client.query(collabSQL);
    console.log('✓ collaboration_tables.sql 完成\n');

    // 验证表
    console.log('验证数据库表...');
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('✓ 数据库初始化完成！');
    console.log('\n已创建的表：');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log(`\n总计：${result.rows.length} 个表`);

  } catch (error) {
    console.error('错误：', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✓ 数据库连接已关闭');
  }
}

initDatabase();
