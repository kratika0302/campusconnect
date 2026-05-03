const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register (admin only)
router.post('/register', auth(['admin']), async (req, res) => {
  try {
    const { name, email, password, role, enrollment_no, branch, semester } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashed, role]
    );

    // If student, add student record
    if (role === 'student') {
      await db.query(
        'INSERT INTO students (user_id, enrollment_no, branch, semester) VALUES (?, ?, ?, ?)',
        [result.insertId, enrollment_no, branch, semester]
      );
    }

    res.status(201).json({ message: 'User created', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email or enrollment already exists' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
