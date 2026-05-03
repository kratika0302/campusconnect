const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Get all courses
router.get('/', auth(['admin', 'faculty', 'student']), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.id, c.name, c.code, u.name AS faculty_name
      FROM courses c LEFT JOIN users u ON c.faculty_id = u.id
      ORDER BY c.name
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get courses for a specific student (their enrollments)
router.get('/my', auth(['student']), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.id, c.name, c.code, u.name AS faculty_name
      FROM courses c
      JOIN enrollments e ON c.id = e.course_id
      JOIN students s ON e.student_id = s.id
      LEFT JOIN users u ON c.faculty_id = u.id
      WHERE s.user_id = ?
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get courses taught by faculty
router.get('/teaching', auth(['faculty']), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, code FROM courses WHERE faculty_id = ?',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create course (admin)
router.post('/', auth(['admin']), async (req, res) => {
  try {
    const { name, code, faculty_id } = req.body;
    const [result] = await db.query(
      'INSERT INTO courses (name, code, faculty_id) VALUES (?, ?, ?)',
      [name, code, faculty_id || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Course created' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Course code already exists' });
    res.status(500).json({ error: err.message });
  }
});

// Update course (admin)
router.put('/:id', auth(['admin']), async (req, res) => {
  try {
    const { name, code, faculty_id } = req.body;
    await db.query(
      'UPDATE courses SET name = ?, code = ?, faculty_id = ? WHERE id = ?',
      [name, code, faculty_id || null, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete course (admin)
router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    await db.query('DELETE FROM courses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Enroll student (admin)
router.post('/:id/enroll', auth(['admin']), async (req, res) => {
  try {
    const { student_id } = req.body;
    await db.query(
      'INSERT IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)',
      [student_id, req.params.id]
    );
    res.json({ message: 'Enrolled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get enrolled students for a course
router.get('/:id/students', auth(['admin', 'faculty']), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.name, u.email, s.enrollment_no, s.id AS student_id
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE e.course_id = ?
      ORDER BY u.name
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
