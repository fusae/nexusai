const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const dbPath = path.join(__dirname, '../../nexusai.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite连接失败:', err.message);
  } else {
    console.log('✅ SQLite connected successfully');
    console.log(`📁 Database: ${dbPath}`);
  }
});

// 查询函数（Promise包装）
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    // PostgreSQL使用$1, $2格式，SQLite使用?格式
    // 转换参数占位符
    let sqliteSql = sql;
    let paramIndex = 1;
    while (sqliteSql.includes('$' + paramIndex)) {
      sqliteSql = sqliteSql.replace('$' + paramIndex, '?');
      paramIndex++;
    }

    db.all(sqliteSql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve({ rows });
      }
    });
  });
}

// 执行函数（Promise包装）
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    // 转换参数占位符
    let sqliteSql = sql;
    let paramIndex = 1;
    while (sqliteSql.includes('$' + paramIndex)) {
      sqliteSql = sqliteSql.replace('$' + paramIndex, '?');
      paramIndex++;
    }

    db.run(sqliteSql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

// 获取连接
function getDb() {
  return db;
}

module.exports = {
  query,
  run,
  getDb,
  db
};
