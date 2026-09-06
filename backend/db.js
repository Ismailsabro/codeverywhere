const { Pool, types } = require('pg');
require('dotenv').config();

// Without this, node-pg parses DATE columns into JS Date objects, which
// JSON.stringify then turns into full timestamps (e.g. "1999-08-20T00:00:00.000Z")
// instead of the plain "1999-08-20" every date field in this app expects.
types.setTypeParser(1082, (val) => val);

// Render fournit automatiquement DATABASE_URL quand tu connectes une base Postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Création automatique des tables si elles n'existent pas encore
const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'employee',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      position VARCHAR(255),
      department VARCHAR(255),
      salary NUMERIC(10,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'active',
      hire_date DATE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER REFERENCES users(id),
      sender_name VARCHAR(255),
      sender_role VARCHAR(50),
      content TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Attachments are stored in Postgres rather than on disk, since Render's
  // filesystem is ephemeral and wiped on every deploy/restart.
  await pool.query('ALTER TABLE messages ALTER COLUMN content DROP NOT NULL');
  await pool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_data BYTEA');
  await pool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name VARCHAR(255)');
  await pool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type VARCHAR(100)');
  await pool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size INTEGER');

  // One-time backfill: old messages stored the generic "employee" role
  // label instead of the sender's actual HR job title.
  await pool.query(`
    UPDATE messages
    SET sender_role = employees.position
    FROM users
    JOIN employees ON employees.email = users.email
    WHERE messages.sender_id = users.id
      AND messages.sender_role = 'employee'
      AND employees.position IS NOT NULL
      AND employees.position != ''
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      status VARCHAR(50) DEFAULT 'pending',
      due_date DATE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Grants a specific employee (e.g. the CEO) access to manage the
  // separate Team Uzbekistan roster below, without making them a full admin.
  await pool.query('ALTER TABLE employees ADD COLUMN IF NOT EXISTS can_manage_uzbek_team BOOLEAN DEFAULT false');

  // Team Uzbekistan: a standalone roster, deliberately not linked to
  // users/employees - these people have no login and never appear in
  // Chat or Tasks.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS uzbek_team_members (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      photo_data BYTEA,
      photo_type VARCHAR(100),
      birth_date DATE,
      start_date DATE,
      salary NUMERIC(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log('✅ Tables prêtes');
};

module.exports = { pool, initDb };
