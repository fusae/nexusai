const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../nexusai.db');
const db = new sqlite3.Database(dbPath);

console.log('=== 检查数据库状态 ===\n');

// 检查agents
db.get("SELECT COUNT(*) as count FROM agents", (err, row) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log(`✅ Agents: ${row.count} 个`);

    if (row.count === 0) {
      console.log('\n⚠️  数据库为空，需要先注册测试账号\n');
    } else {
      db.all("SELECT id, name FROM agents LIMIT 3", (err, agents) => {
        if (!err && agents) {
          console.log('现有账号:');
          agents.forEach(a => console.log(`  - ${a.name} (${a.id})`));
        }
        db.close();
      });
      return;
    }

    db.close();
  }
});
