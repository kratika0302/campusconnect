# CampusConnect – Smart Student Management System

## Tech Stack
- **Frontend**: React.js (Create React App)
- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **Auth**: JWT + bcrypt

---

## Quick Setup

### 1. MySQL Database
```bash
mysql -u root -p < database/schema.sql
```
This creates the `campusconnect` database and a default admin user.

**Default admin login:**
- Email: `admin@campus.com`
- Password: `password`

> Note: The schema seeds a hashed version of "password". To use a different password,
> run: `node -e "const b=require('bcrypt'); b.hash('yourpassword',10).then(console.log)"` 
> and update the INSERT in schema.sql.

---

### 2. Backend
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env and set your MySQL password

npm run dev     # development (with nodemon)
# OR
npm start       # production
```

Backend runs on **http://localhost:5000**

---

### 3. Frontend
```bash
cd frontend
npm install
npm start
```

Frontend runs on **http://localhost:3000**  
(Proxies `/api` requests to backend automatically via `"proxy"` in package.json)

---

## Project Structure
```
campusconnect/
├── database/
│   └── schema.sql          # MySQL schema + seed data
├── backend/
│   ├── server.js           # Express app entry point
│   ├── db.js               # MySQL connection pool
│   ├── .env.example        # Environment variables template
│   ├── middleware/
│   │   └── auth.js         # JWT authentication middleware
│   └── routes/
│       ├── auth.js         # Login + Register
│       ├── students.js     # Student CRUD
│       ├── courses.js      # Course management + enrollment
│       ├── attendance.js   # Attendance marking + viewing
│       └── grades.js       # Grade upload + viewing
└── frontend/
    ├── public/index.html
    └── src/
        ├── index.js        # React entry
        ├── App.jsx         # Root component + routing by role
        ├── api.js          # All API calls in one place
        ├── styles.css      # Global styles
        └── pages/
            ├── Login.jsx           # Login form
            ├── AdminDashboard.jsx  # Admin: students, courses, enroll
            ├── FacultyDashboard.jsx# Faculty: attendance, grades
            └── StudentDashboard.jsx# Student: my grades, attendance
```

---

## Roles & Features

| Feature | Admin | Faculty | Student |
|---|---|---|---|
| Add/delete users | ✅ | — | — |
| Add/delete courses | ✅ | — | — |
| Enroll students | ✅ | — | — |
| View all students | ✅ | ✅ | — |
| Mark attendance | — | ✅ | — |
| Upload grades | — | ✅ | — |
| View own grades | — | — | ✅ |
| View own attendance | — | — | ✅ |

---

## API Endpoints

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/auth/login | Public |
| POST | /api/auth/register | Admin only |

### Students
| Method | Endpoint | Access |
|---|---|---|
| GET | /api/students | Admin, Faculty |
| GET | /api/students/me | Student |
| PUT | /api/students/:id | Admin, Student |
| DELETE | /api/students/:id | Admin |

### Courses
| GET | /api/courses | All |
| GET | /api/courses/my | Student |
| GET | /api/courses/teaching | Faculty |
| POST | /api/courses | Admin |
| PUT | /api/courses/:id | Admin |
| DELETE | /api/courses/:id | Admin |
| POST | /api/courses/:id/enroll | Admin |
| GET | /api/courses/:id/students | Admin, Faculty |

### Attendance
| POST | /api/attendance | Faculty |
| GET | /api/attendance/course/:id | Faculty, Admin |
| GET | /api/attendance/my | Student |

### Grades
| POST | /api/grades | Faculty |
| GET | /api/grades/course/:id | Faculty, Admin |
| GET | /api/grades/my | Student |
