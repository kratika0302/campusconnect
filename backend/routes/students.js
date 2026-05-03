const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Get all students (admin/faculty)
router.get('/', auth(['admin', 'faculty']), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, s.enrollment_no, s.branch, s.semester, s.id AS student_id
      FROM users u JOIN students s ON u.id = s.user_id
      ORDER BY u.name
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single student profile
router.get('/me', auth(['student']), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, s.enrollment_no, s.branch, s.semester, s.id AS student_id
      FROM users u JOIN students s ON u.id = s.user_id
      WHERE u.id = ?
    `, [req.user.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update student (admin or the student themselves)
router.put('/:id', auth(['admin', 'student']), async (req, res) => {
  try {
    const { name, branch, semester } = req.body;
    const userId = parseInt(req.params.id);

    // Students can only update themselves
    if (req.user.role === 'student' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.query('UPDATE users SET name = ? WHERE id = ?', [name, userId]);
    await db.query('UPDATE students SET branch = ?, semester = ? WHERE user_id = ?', [branch, semester, userId]);
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete student (admin only)
router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
