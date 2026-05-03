import { useState, useEffect } from 'react';
import './styles.css';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = parseJwt(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(decoded);
      } else {
        localStorage.removeItem('token');
      }
    }
  }, []);

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  if (!user) return <Login onLogin={setUser} />;

  const roleLabelColor = { admin: '#c62828', faculty: '#1565c0', student: '#2e7d32' };

  return (
    <>
      <nav className="navbar">
        <h1>🎓 CampusConnect</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>
            {user.name} —{' '}
            <strong style={{ color: roleLabelColor[user.role] || 'white', textTransform: 'capitalize' }}>
              {user.role}
            </strong>
          </span>
          <button onClick={logout}>Logout</button>
        </div>
      </nav>

      <div style={{ padding: '20px 0' }}>
        {user.role === 'admin' && <AdminDashboard user={user} />}
        {user.role === 'faculty' && <FacultyDashboard user={user} />}
        {user.role === 'student' && <StudentDashboard user={user} />}
      </div>
    </>
  );
}
