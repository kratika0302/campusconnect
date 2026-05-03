import { useState, useEffect } from 'react';
import { api } from '../api';

export default function AdminDashboard({ user }) {
  const [tab, setTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // New user form
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student', enrollment_no: '', branch: '', semester: '' });
  // New course form
  const [newCourse, setNewCourse] = useState({ name: '', code: '', faculty_id: '' });
  // Enroll form
  const [enroll, setEnroll] = useState({ course_id: '', student_id: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [s, c, u] = await Promise.all([api.getStudents(), api.getCourses(), api.getAllUsers()]);
      setStudents(s);
      setCourses(c);
      setAllUsers(u);
    } catch (err) { setError(err.message); }
  }

  function flash(m, isErr = false) {
    isErr ? setError(m) : setMsg(m);
    setTimeout(() => { setMsg(''); setError(''); }, 3000);
  }

  async function handleAddUser(e) {
    e.preventDefault();
    try {
      await api.register(newUser);
      flash('User created successfully!');
      setNewUser({ name: '', email: '', password: '', role: 'student', enrollment_no: '', branch: '', semester: '' });
      loadData();
    } catch (err) { flash(err.message, true); }
  }

  async function handleDeleteStudent(id) {
    if (!window.confirm('Delete this student?')) return;
    try {
      await api.deleteStudent(id);
      flash('Deleted');
      loadData();
    } catch (err) { flash(err.message, true); }
  }

  async function handleAddCourse(e) {
    e.preventDefault();
    try {
      await api.createCourse(newCourse);
      flash('Course created!');
      setNewCourse({ name: '', code: '', faculty_id: '' });
      loadData();
    } catch (err) { flash(err.message, true); }
  }

  async function handleDeleteCourse(id) {
    if (!window.confirm('Delete this course?')) return;
    try {
      await api.deleteCourse(id);
      flash('Deleted');
      loadData();
    } catch (err) { flash(err.message, true); }
  }

  async function handleEnroll(e) {
    e.preventDefault();
    try {
      await api.enrollStudent(enroll.course_id, enroll.student_id);
      flash('Student enrolled!');
      setEnroll({ course_id: '', student_id: '' });
    } catch (err) { flash(err.message, true); }
  }

  const facultyList = allUsers.filter(u => u.role === 'faculty');
  const stats = { students: students.length, courses: courses.length, faculty: facultyList.length };

  return (
    <div className="container">
      <div className="stats">
        {[['Students', stats.students], ['Courses', stats.courses], ['Faculty', stats.faculty]].map(([label, n]) => (
          <div className="stat-card" key={label}>
            <div className="number">{n}</div>
            <div className="label">{label}</div>
          </div>
        ))}
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        {['students', 'courses', 'add-user', 'add-course', 'enroll'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {tab === 'students' && (
        <div className="card">
          <h2>All Students</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Enrollment No</th><th>Branch</th><th>Semester</th><th>Action</th></tr></thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td>{s.name}</td><td>{s.email}</td><td>{s.enrollment_no}</td>
                    <td>{s.branch}</td><td>{s.semester}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteStudent(s.id)}>Delete</button></td>
                  </tr>
                ))}
                {!students.length && <tr><td colSpan="6" style={{ textAlign: 'center', color: '#999' }}>No students yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'courses' && (
        <div className="card">
          <h2>All Courses</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Course Name</th><th>Code</th><th>Faculty</th><th>Action</th></tr></thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td><td>{c.code}</td><td>{c.faculty_name || '—'}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteCourse(c.id)}>Delete</button></td>
                  </tr>
                ))}
                {!courses.length && <tr><td colSpan="4" style={{ textAlign: 'center', color: '#999' }}>No courses yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'add-user' && (
        <div className="card">
          <h2>Add New User</h2>
          <form onSubmit={handleAddUser}>
            <div className="form-row">
              <div className="form-group"><label>Name</label><input value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required /></div>
              <div className="form-group"><label>Email</label><input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required /></div>
              <div className="form-group"><label>Password</label><input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Role</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {newUser.role === 'student' && <>
                <div className="form-group"><label>Enrollment No</label><input value={newUser.enrollment_no} onChange={e => setNewUser({...newUser, enrollment_no: e.target.value})} required /></div>
                <div className="form-group"><label>Branch</label><input value={newUser.branch} onChange={e => setNewUser({...newUser, branch: e.target.value})} /></div>
                <div className="form-group"><label>Semester</label><input type="number" value={newUser.semester} onChange={e => setNewUser({...newUser, semester: e.target.value})} min="1" max="8" /></div>
              </>}
            </div>
            <button className="btn btn-primary" type="submit">Create User</button>
          </form>
        </div>
      )}

      {tab === 'add-course' && (
        <div className="card">
          <h2>Add New Course</h2>
          <form onSubmit={handleAddCourse}>
            <div className="form-row">
              <div className="form-group"><label>Course Name</label><input value={newCourse.name} onChange={e => setNewCourse({...newCourse, name: e.target.value})} required /></div>
              <div className="form-group"><label>Course Code</label><input value={newCourse.code} onChange={e => setNewCourse({...newCourse, code: e.target.value})} required /></div>
              <div className="form-group">
                <label>Assign Faculty</label>
                <select value={newCourse.faculty_id} onChange={e => setNewCourse({...newCourse, faculty_id: e.target.value})}>
                  <option value="">— Select Faculty —</option>
                  {facultyList.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary" type="submit">Create Course</button>
          </form>
        </div>
      )}

      {tab === 'enroll' && (
        <div className="card">
          <h2>Enroll Student in Course</h2>
          <form onSubmit={handleEnroll}>
            <div className="form-row">
              <div className="form-group">
                <label>Student</label>
                <select value={enroll.student_id} onChange={e => setEnroll({...enroll, student_id: e.target.value})} required>
                  <option value="">— Select Student —</option>
                  {students.map(s => <option key={s.student_id} value={s.student_id}>{s.name} ({s.enrollment_no})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Course</label>
                <select value={enroll.course_id} onChange={e => setEnroll({...enroll, course_id: e.target.value})} required>
                  <option value="">— Select Course —</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-success" type="submit">Enroll Student</button>
          </form>
        </div>
      )}
    </div>
  );
}
