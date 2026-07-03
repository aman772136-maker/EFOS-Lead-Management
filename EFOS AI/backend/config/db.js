const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../database/leads.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err);
  } else {
    console.log('SQLite database connected successfully.');
    initializeDatabase();
  }
});

function initializeDatabase() {
  const schema = [
    `CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      city TEXT DEFAULT NULL,
      qualification TEXT DEFAULT NULL,
      source TEXT DEFAULT 'website',
      course_interest TEXT DEFAULT NULL,
      status TEXT DEFAULT 'New',
      lead_score INTEGER DEFAULT 0,
      score_category TEXT DEFAULT NULL,
      website_visits INTEGER DEFAULT 0,
      brochure_downloaded BOOLEAN DEFAULT 0,
      age INTEGER DEFAULT NULL,
      last_message TEXT DEFAULT NULL,
      last_message_channel TEXT DEFAULT NULL,
      last_message_at TEXT DEFAULT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS counselors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      status TEXT DEFAULT 'active'
    )`,
    `CREATE TABLE IF NOT EXISTS counselor_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER,
      counselor_id INTEGER,
      counselor_name TEXT,
      assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
      notified BOOLEAN DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS counselor_config (
      id INTEGER PRIMARY KEY,
      assignmentMode TEXT,
      counselors TEXT,
      roundRobin TEXT
    )`
  ];

  db.serialize(() => {
    schema.forEach((query) => {
      db.run(query, (err) => {
        if (err) console.error('Error creating table:', err);
      });
    });

    db.get('SELECT COUNT(*) as count FROM counselors', (err, row) => {
      if (row && row.count === 0) {
        console.log('Seeding default counselors into database...');
        db.run("INSERT INTO counselors (id, name, email) VALUES (1, 'Alex Johnson', 'alex@efos.ai')");
        db.run("INSERT INTO counselors (id, name, email) VALUES (2, 'Sarah Martinez', 'sarah@efos.ai')");
        db.run("INSERT INTO counselors (id, name, email) VALUES (3, 'Mike Chen', 'mike@efos.ai')");
      }
    });
  });
}

function runQuery(sql, params = []) {
  let sqliteSql = sql;
  
  // Replace NOW() with local timestamp
  sqliteSql = sqliteSql.replace(/\bNOW\(\)/gi, "datetime('now', 'localtime')");

  return new Promise((resolve, reject) => {
    const isSelect = sqliteSql.trim().toUpperCase().startsWith('SELECT');
    if (isSelect) {
      db.all(sqliteSql, params, (err, rows) => {
        if (err) {
          console.error('SQLite query error:', err, 'SQL:', sqliteSql);
          return reject(err);
        }
        resolve([rows, []]);
      });
    } else {
      db.run(sqliteSql, params, function (err) {
        if (err) {
          console.error('SQLite execute error:', err, 'SQL:', sqliteSql);
          return reject(err);
        }
        resolve([{ insertId: this.lastID, affectedRows: this.changes }, []]);
      });
    }
  });
}

const pool = {
  query: (sql, params) => runQuery(sql, params),
  getConnection: async () => {
    return {
      beginTransaction: () => runQuery('BEGIN TRANSACTION'),
      query: (sql, params) => runQuery(sql, params),
      commit: () => runQuery('COMMIT'),
      rollback: () => runQuery('ROLLBACK'),
      release: () => {}
    };
  }
};

module.exports = pool;
