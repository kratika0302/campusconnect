import { useState, useEffect } from 'react';
import { api } from '../api';

export default function FacultyDashboard() {
  const [tab, setTab] = useState('attendance');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [gradesList, setGradesList] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.getTeachingCourses().then(setCourses).catch(e => setError(e.message));
  }, []);

  function flash(m, isErr = false) {
    isErr ? setError(m) : setMsg(m);
    setTimeout(() => { setMsg(''); setError(''); }, 3000);
  }

  async function loadAttendance() {
    if (!selectedCourse) return;
    try {
      const rows = await api.getCourseAttendance(selectedCourse, date);
      setAttendanceList(rows.map(r => ({ ...r, status: r.status || 'present' })));
    } catch (err) { flash(err.message, true); }
  }

  async function loadGrades() {
    if (!selectedCourse) return;
    try {
      const rows = await api.getCourseGrades(selectedCourse);
      setGradesList(rows.map(r => ({ ...r, marks: r.marks ?? '' })));
    } catch (err) { flash(err.message, true); }
  }

  useEffect(() => {
    if (tab === 'attendance') loadAttendance();
    if (tab === 'grades') loadGrades();
  }, [selectedCourse, date, tab]);

  async function saveAttendance() {
    if (!selectedCourse) return flash('Select a course', true);
    try {
      await api.markAttendance({
        course_id: selectedCourse,
        date,
        records: attendanceList.map(r => ({ student_id: r.student_id, status: r.status }))
      });
      flash('Attendance saved!');
    } catch (err) { flash(err.message, true); }
  }

  async function saveGrade(row) {
    if (!selectedCourse || row.marks === '') return;
    try {
      const res = await api.saveGrade({ course_id: parseInt(selectedCourse), student_id: row.student_id, marks: parseFloat(row.marks) });
      flash(`Grade saved: ${res.grade}`);
      loadGrades();
    } catch (err) { flash(err.message, true); }
  }

  function toggleStatus(idx) {
    setAttendanceList(prev => prev.map((r, i) => i === idx ? { ...r, status: r.status === 'present' ? 'absent' : 'present' } : r));
  }

  return (
    <div className="container">
      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-row" style={{ marginBottom: '16px' }}>
        <div className="form-group">
          <label>Select Course</label>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
            <option value="">— Select Course —</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'attendance' ? 'active' : ''}`} onClick={() => setTab('attendance')}>Mark Attendance</button>
        <button className={`tab ${tab === 'grades' ? 'active' : ''}`} onClick={() => setTab('grades')}>Grades</button>
      </div>

      {tab === 'attendance' && (
        <div className="card">
          <h2>Mark Attendance</h2>
          <div className="form-row" style={{ marginBottom: '16px' }}>
            <div className="form-group" style={{ maxWidth: '200px' }}>
              <label>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          {attendanceList.length > 0 ? (
            <>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Enrollment No</th><th>Status</th></tr></thead>
                  <tbody>
                    {attendanceList.map((r, i) => (
                      <tr key={r.student_id}>
                        <td>{r.name}</td>
                        <td>{r.enrollment_no}</td>
                        <td>
                          <button
                            className={`btn btn-sm ${r.status === 'present' ? 'btn-success' : 'btn-danger'}`}
                            onClick={() => toggleStatus(i)}
                          >
                            {r.status === 'present' ? '✓ Present' : '✗ Absent'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '16px' }}>
                <button className="btn btn-primary" onClick={saveAttendance}>Save Attendance</button>
              </div>
            </>
          ) : (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              {selectedCourse ? 'No students enrolled in this course.' : 'Select a course to mark attendance.'}
            </p>
          )}
        </div>
      )}

      {tab === 'grades' && (
        <div className="card">
          <h2>Upload Grades</h2>
          {gradesList.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Enrollment No</th><th>Marks (0-100)</th><th>Grade</th><th>Action</th></tr></thead>
                <tbody>
                  {gradesList.map((r, i) => (
                    <tr key={r.student_id}>
                      <td>{r.name}</td>
                      <td>{r.enrollment_no}</td>
                      <td>
                        <input
                          type="number" min="0" max="100" step="0.5"
                          value={r.marks}
                          onChange={e => setGradesList(prev => prev.map((g, j) => j === i ? { ...g, marks: e.target.value } : g))}
                          style={{ width: '80px' }}
                        />
                      </td>
                      <td>
                        {r.grade ? (
                          <span className={`grade grade-${r.grade[0]}`}>{r.grade}</span>
                        ) : '—'}
                      </td>
                      <td><button className="btn btn-success btn-sm" onClick={() => saveGrade(r)}>Save</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              {selectedCourse ? 'No students enrolled.' : 'Select a course to manage grades.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
