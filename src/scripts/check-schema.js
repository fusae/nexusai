const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../nexusai.db');
const db = new sqlite3.Database(dbPath);

db.all("PRAGMA table_info(agents);", (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('agents表结构:');
    console.table(rows);
  }
  db.close();
});
