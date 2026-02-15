const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// USERS TABLE
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
)
`).run();

// TRANSACTIONS TABLE
db.prepare(`
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  title TEXT,
  amount REAL,
  category TEXT,
  date TEXT,
  notes TEXT,
  FOREIGN KEY(userId) REFERENCES users(id)
)
`).run();

module.exports = db;
