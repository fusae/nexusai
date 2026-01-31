const { Pool } = require('pg');

// 优先使用 DATABASE_URL（Supabase格式），否则使用单独的环境变量
const connectionString = process.env.DATABASE_URL;

// 如果是Supabase连接字符串，添加IPv4优先选项
const finalConfig = connectionString
  ? {
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      // 强制使用IPv4
      host: process.env.DATABASE_URL ? undefined : 'localhost'
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'nexusai',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

// 创建数据库连接池
const pool = new Pool(finalConfig);

// 连接事件监听
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL client error:', err);
});

// 测试连接
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection test failed:', err.message);
  } else {
    console.log('✅ Database connection test passed');
  }
});

// 查询函数
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    return res;
  } catch (error) {
    throw error;
  }
}

// 获取客户端
function getClient() {
  return pool.connect();
}

module.exports = {
  query,
  getClient,
  pool
};
