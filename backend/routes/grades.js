const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

function calcGrade(marks) {
  if (marks >= 90) return 'A+';
  if (marks >= 80) return 'A';
  if (marks >= 70) return 'B+';
  if (marks >= 60) return 'B';
  if (marks >= 50) return 'C';
  if (marks >= 40) return 'D';
  return 'F';
}

// Upload/update grade (faculty)
router.post('/', auth(['faculty']), async (req, res) => {
  try {
    const { course_id, student_id, marks } = req.body;

    // Verify faculty teaches this course
    const [course] = await db.query(
      'SELECT id FROM courses WHERE id = ? AND faculty_id = ?',
      [course_id, req.user.id]
    );
    if (!course.length) return res.status(403).json({ error: 'Not your course' });

    const grade = calcGrade(marks);
    await db.query(
      `INSERT INTO grades (student_id, course_id, marks, grade)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE marks = VALUES(marks), grade = VALUES(grade)`,
      [student_id, course_id, marks, grade]
    );

    res.json({ message: 'Grade saved', grade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all grades for a course (faculty/admin)
router.get('/course/:courseId', auth(['faculty', 'admin']), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.name, s.enrollment_no, s.id AS student_id, g.marks, g.grade
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN grades g ON g.student_id = s.id AND g.course_id = e.course_id
      WHERE e.course_id = ?
      ORDER BY u.name
    `, [req.params.courseId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get my grades (student)
router.get('/my', auth(['student']), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.name AS course_name, c.code, g.marks, g.grade
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN grades g ON g.student_id = s.id AND g.course_id = c.id
      WHERE s.user_id = ?
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users (admin only)
router.get('/users', auth(['admin']), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY role, name'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
