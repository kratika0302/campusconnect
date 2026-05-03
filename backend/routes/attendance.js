const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Mark attendance for a course (faculty)
// Body: { date: 'YYYY-MM-DD', records: [{ student_id, status }] }
router.post('/', auth(['faculty']), async (req, res) => {
  try {
    const { course_id, date, records } = req.body;

    // Verify faculty teaches this course
    const [course] = await db.query(
      'SELECT id FROM courses WHERE id = ? AND faculty_id = ?',
      [course_id, req.user.id]
    );
    if (!course.length) return res.status(403).json({ error: 'Not your course' });

    // Insert/update attendance records
    for (const r of records) {
      await db.query(
        `INSERT INTO attendance (student_id, course_id, date, status)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status)`,
        [r.student_id, course_id, date, r.status]
      );
    }

    res.json({ message: 'Attendance saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get attendance for a course on a date (faculty)
router.get('/course/:courseId', auth(['faculty', 'admin']), async (req, res) => {
  try {
    const { date } = req.query;
    let query = `
      SELECT u.name, s.enrollment_no, s.id AS student_id, a.date, a.status
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN attendance a ON a.student_id = s.id AND a.course_id = e.course_id
    `;
    const params = [req.params.courseId];

    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }
    query += ' WHERE e.course_id = ? ORDER BY u.name';
    params.unshift(req.params.courseId);

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get my attendance summary (student)
router.get('/my', auth(['student']), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.name AS course_name, c.code,
        COUNT(a.id) AS total_classes,
        SUM(a.status = 'present') AS present,
        SUM(a.status = 'absent') AS absent
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN attendance a ON a.student_id = s.id AND a.course_id = c.id
      WHERE s.user_id = ?
      GROUP BY c.id
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get attendance details for a student in a course
router.get('/student/:studentId/course/:courseId', auth(['faculty', 'admin', 'student']), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT date, status FROM attendance WHERE student_id = ? AND course_id = ? ORDER BY date DESC',
      [req.params.studentId, req.params.courseId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
