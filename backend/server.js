const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = "mysecretkey";


// ================== REGISTER ==================
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields required" });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) {
      console.log("SELECT ERROR:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
      [name, email, hashedPassword],
      function (err) {
        if (err) {
          console.log("INSERT ERROR:", err);
          return res.status(500).json({ error: "Insert failed" });
        }

        res.json({ message: "User registered successfully" });
      }
    );
  });
});

// ================== LOGIN ==================
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "All fields required" });
  }

  db.get(
    `SELECT * FROM users WHERE email = ?`,
    [email],
    async (err, user) => {
      if (err) {
        console.log("LOGIN SELECT ERROR:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ error: "Wrong password" });
      }

      const token = jwt.sign({ id: user.id }, SECRET_KEY, {
        expiresIn: "1d",
      });

      res.json({ token });
    }
  );
});



// ================== AUTH MIDDLEWARE ==================
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) return res.status(401).json({ error: "Access Denied" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid Token" });
    req.user = user;
    next();
  });
}


// ================== ADD TRANSACTION ==================
app.post('/transactions', authenticateToken, (req, res) => {
  const { title, amount, category, date, notes } = req.body;
  const userId = req.user.id;

  db.run(
    `INSERT INTO transactions (userId, title, amount, category, date, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, title, amount, category, date, notes],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: "Transaction added" });
    }
  );
});


// ================== GET TRANSACTIONS ==================
app.get('/transactions', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  db.all(
    `SELECT * FROM transactions 
     WHERE userId = ? 
     ORDER BY date DESC 
     LIMIT ? OFFSET ?`,
    [userId, limit, offset],
    (err, rows) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json(rows);
    }
  );
});



// ================== DELETE ==================
app.delete('/transactions/:id', authenticateToken, (req, res) => {
  db.run(
    `DELETE FROM transactions WHERE id = ?`,
    [req.params.id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: "Deleted successfully" });
    }
  );
});

// ================== UPDATE ==================
app.put('/transactions/:id', authenticateToken, (req, res) => {
  const { title, amount, category, date, notes } = req.body;

  db.run(
    `UPDATE transactions 
     SET title=?, amount=?, category=?, date=?, notes=? 
     WHERE id=?`,
    [title, amount, category, date, notes, req.params.id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: "Updated successfully" });
    }
  );
});



app.listen(5000, () => {
  console.log("Server running on port 5000");
});
