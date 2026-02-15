require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY || "mysecret";
const PORT = process.env.PORT || 5000;

/* ================= DATABASE ================= */

const db = new Database("database.db");

db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  title TEXT,
  amount REAL,
  category TEXT,
  date TEXT,
  notes TEXT
)
`).run();

/* ================= REGISTER ================= */
app.post("/register", async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    email = email.trim().toLowerCase();

    const existingUser = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email);

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.prepare(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)"
    ).run(name, email, hashedPassword);

    res.json({ message: "User registered successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= LOGIN ================= */
app.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    email = email.trim().toLowerCase();

    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email);

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user.id },
      SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.json({ token });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= AUTH MIDDLEWARE ================= */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Access Denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const user = jwt.verify(token, SECRET_KEY);
    req.user = user;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid Token" });
  }
}

/* ================= ADD TRANSACTION ================= */
app.post("/transactions", authenticateToken, (req, res) => {
  try {
    const { title, amount, category, date, notes } = req.body;

    db.prepare(`
      INSERT INTO transactions 
      (userId, title, amount, category, date, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, title, amount, category, date, notes);

    res.json({ message: "Transaction added" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= GET TRANSACTIONS ================= */
app.get("/transactions", authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM transactions
      WHERE userId = ?
      ORDER BY date DESC
    `).all(req.user.id);

    res.json(rows);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= UPDATE TRANSACTION ================= */
app.put("/transactions/:id", authenticateToken, (req, res) => {
  try {
    const { title, amount, category, date, notes } = req.body;

    db.prepare(`
      UPDATE transactions
      SET title = ?, amount = ?, category = ?, date = ?, notes = ?
      WHERE id = ? AND userId = ?
    `).run(
      title,
      amount,
      category,
      date,
      notes,
      req.params.id,
      req.user.id
    );

    res.json({ message: "Updated successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Update failed" });
  }
});

/* ================= DELETE TRANSACTION ================= */
app.delete("/transactions/:id", authenticateToken, (req, res) => {
  try {
    db.prepare(`
      DELETE FROM transactions 
      WHERE id = ? AND userId = ?
    `).run(req.params.id, req.user.id);

    res.json({ message: "Deleted successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Delete failed" });
  }
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
