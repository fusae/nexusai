const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../nexusai.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath);

// 查询所有表
db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;", (err, tables) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('\nTables in database:');
    tables.forEach(t => console.log('  -', t.name));
  }

  // 查询agents表前5条
  console.log('\nAgents in database:');
  db.all("SELECT id, name, api_key FROM agents LIMIT 5;", (err, agents) => {
    if (err) {
      console.error('Error querying agents:', err);
    } else {
      console.table(agents);
    }
    db.close();
  });
});
