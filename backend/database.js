const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./expense.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to SQLite database.");
});

// Create Users Table
db.run(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT
)
`);

// Create Transactions Table
db.run(`
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  title TEXT,
  amount REAL,
  category TEXT,
  date TEXT,
  notes TEXT
)
`);

module.exports = db;
