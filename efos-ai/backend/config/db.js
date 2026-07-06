const path = require('path');
const fs = require('fs');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const DATABASE_URL = process.env.DATABASE_URL;

function convertPlaceholders(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

function convertSqlToPostgres(sql) {
  let pg = sql;
  pg = pg.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY');
  pg = pg.replace(/BOOLEAN DEFAULT 0/g, 'BOOLEAN DEFAULT FALSE');
  pg = pg.replace(/BOOLEAN DEFAULT 1/g, 'BOOLEAN DEFAULT TRUE');
  pg = pg.replace(/\bNOW\(\)/gi, 'NOW()');
  pg = pg.replace(/REPLACE INTO/g, 'INSERT INTO');
  pg = convertPlaceholders(pg);
  return pg;
}

if (isProduction && DATABASE_URL) {
  const { Pool } = require('pg');

  const pgPool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const runQuery = async (sql, params = []) => {
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
    const isReplace = sql.trim().toUpperCase().startsWith('REPLACE INTO');

    if (isReplace) {
      // REPLACE INTO -> INSERT ... ON CONFLICT ... DO UPDATE
      const pgSql = convertSqlToPostgres(sql).replace(
        /INSERT INTO (\w+) \(([^)]+)\)/,
        (match, table, cols) => {
          const colList = cols.split(',').map(c => c.trim());
          const placeholders = colList.map((_, i) => `$${i + 1}`);
          const updateClause = colList.map((c, i) => `${c} = $${i + 1}`).join(', ');
          return `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${updateClause}`;
        }
      );
      const result = await pgPool.query(pgSql, params);
      return [{ insertId: result.rows[0]?.id || null, affectedRows: result.rowCount }, []];
    }

    if (isSelect) {
      const pgSql = convertSqlToPostgres(sql);
      const result = await pgPool.query(pgSql, params);
      return [result.rows, []];
    } else {
      const pgSql = convertSqlToPostgres(sql);
      const result = await pgPool.query(pgSql, params);
      return [{ insertId: result.rows[0]?.id || null, affectedRows: result.rowCount }, []];
    }
  };

  const pool = {
    query: (sql, params) => runQuery(sql, params),
    getConnection: async () => ({
      beginTransaction: () => runQuery('BEGIN'),
      query: (sql, params) => runQuery(sql, params),
      commit: () => runQuery('COMMIT'),
      rollback: () => runQuery('ROLLBACK'),
      release: () => {},
    }),
  };

  async function initializePostgresDatabase() {
    try {
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id SERIAL PRIMARY KEY,
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
          brochure_downloaded BOOLEAN DEFAULT FALSE,
          age INTEGER DEFAULT NULL,
          last_message TEXT DEFAULT NULL,
          last_message_channel TEXT DEFAULT NULL,
          last_message_at TEXT DEFAULT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS counselors (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          status TEXT DEFAULT 'active'
        )
      `);
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS counselor_assignments (
          id SERIAL PRIMARY KEY,
          lead_id INTEGER,
          counselor_id INTEGER,
          counselor_name TEXT,
          assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
          notified BOOLEAN DEFAULT FALSE
        )
      `);
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS counselor_config (
          id INTEGER PRIMARY KEY,
          assignmentMode TEXT,
          counselors TEXT,
          roundRobin TEXT
        )
      `);

      const { rows } = await pgPool.query('SELECT COUNT(*) as count FROM counselors');
      if (parseInt(rows[0].count) === 0) {
        console.log('Seeding default counselors into PostgreSQL...');
        await pgPool.query("INSERT INTO counselors (id, name, email) VALUES (1, 'Alex Johnson', 'alex@efos.ai')");
        await pgPool.query("INSERT INTO counselors (id, name, email) VALUES (2, 'Sarah Martinez', 'sarah@efos.ai')");
        await pgPool.query("INSERT INTO counselors (id, name, email) VALUES (3, 'Mike Chen', 'mike@efos.ai')");
      }
      console.log('PostgreSQL database initialized successfully.');
    } catch (err) {
      console.error('Error initializing PostgreSQL database:', err);
    }
  }

  initializePostgresDatabase();
  module.exports = pool;

} else {
  const sqlite3 = require('sqlite3').verbose();

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
}
