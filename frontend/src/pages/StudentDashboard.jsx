import { useState, useEffect } from 'react';
import { api } from '../api';

export default function StudentDashboard() {
  const [tab, setTab] = useState('grades');
  const [profile, setProfile] = useState(null);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getMyProfile(), api.getMyGrades(), api.getMyAttendance()])
      .then(([p, g, a]) => { setProfile(p); setGrades(g); setAttendance(a); })
      .catch(e => setError(e.message));
  }, []);

  function getAttendancePct(row) {
    if (!row.total_classes) return null;
    return Math.round((row.present / row.total_classes) * 100);
  }

  function getGPA() {
    const graded = grades.filter(g => g.marks != null);
    if (!graded.length) return null;
    const avg = graded.reduce((sum, g) => sum + parseFloat(g.marks), 0) / graded.length;
    return avg.toFixed(1);
  }

  return (
    <div className="container">
      {error && <div className="alert alert-error">{error}</div>}

      {profile && (
        <div className="stats">
          <div className="stat-card">
            <div className="number">{grades.length}</div>
            <div className="label">Courses</div>
          </div>
          <div className="stat-card">
            <div className="number">{getGPA() || '—'}</div>
            <div className="label">Avg Marks</div>
          </div>
          <div className="stat-card">
            <div className="number" style={{ fontSize: '1rem', color: '#555', marginTop: '4px' }}>{profile.enrollment_no}</div>
            <div className="label">Enrollment No</div>
          </div>
          <div className="stat-card">
            <div className="number" style={{ fontSize: '1rem', color: '#555', marginTop: '4px' }}>{profile.branch || '—'}</div>
            <div className="label">Branch / Sem {profile.semester}</div>
          </div>
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${tab === 'grades' ? 'active' : ''}`} onClick={() => setTab('grades')}>My Grades</button>
        <button className={`tab ${tab === 'attendance' ? 'active' : ''}`} onClick={() => setTab('attendance')}>My Attendance</button>
      </div>

      {tab === 'grades' && (
        <div className="card">
          <h2>Academic Performance</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Course</th><th>Code</th><th>Marks</th><th>Grade</th></tr></thead>
              <tbody>
                {grades.map((g, i) => (
                  <tr key={i}>
                    <td>{g.course_name}</td>
                    <td>{g.code}</td>
                    <td>{g.marks != null ? `${g.marks}/100` : <span style={{ color: '#999' }}>Not graded</span>}</td>
                    <td>
                      {g.grade
                        ? <span className={`grade grade-${g.grade[0]}`}>{g.grade}</span>
                        : '—'}
                    </td>
                  </tr>
                ))}
                {!grades.length && <tr><td colSpan="4" style={{ textAlign: 'center', color: '#999' }}>No courses enrolled</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="card">
          <h2>Attendance Summary</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Course</th><th>Code</th><th>Present</th><th>Absent</th><th>Total</th><th>%</th></tr></thead>
              <tbody>
                {attendance.map((a, i) => {
                  const pct = getAttendancePct(a);
                  return (
                    <tr key={i}>
                      <td>{a.course_name}</td>
                      <td>{a.code}</td>
                      <td style={{ color: '#2e7d32' }}>{a.present}</td>
                      <td style={{ color: '#c62828' }}>{a.absent}</td>
                      <td>{a.total_classes}</td>
                      <td>
                        {pct !== null ? (
                          <span style={{
                            fontWeight: 600,
                            color: pct >= 75 ? '#2e7d32' : pct >= 60 ? '#f57f17' : '#c62828'
                          }}>
                            {pct}%
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
                {!attendance.length && <tr><td colSpan="6" style={{ textAlign: 'center', color: '#999' }}>No courses enrolled</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
