const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  register: (data) => request('POST', '/auth/register', data),

  // Students
  getStudents: () => request('GET', '/students'),
  getMyProfile: () => request('GET', '/students/me'),
  updateStudent: (id, data) => request('PUT', `/students/${id}`, data),
  deleteStudent: (id) => request('DELETE', `/students/${id}`),

  // Courses
  getCourses: () => request('GET', '/courses'),
  getMyCourses: () => request('GET', '/courses/my'),
  getTeachingCourses: () => request('GET', '/courses/teaching'),
  createCourse: (data) => request('POST', '/courses', data),
  updateCourse: (id, data) => request('PUT', `/courses/${id}`, data),
  deleteCourse: (id) => request('DELETE', `/courses/${id}`),
  enrollStudent: (courseId, studentId) => request('POST', `/courses/${courseId}/enroll`, { student_id: studentId }),
  getCourseStudents: (courseId) => request('GET', `/courses/${courseId}/students`),

  // Attendance
  markAttendance: (data) => request('POST', '/attendance', data),
  getCourseAttendance: (courseId, date) => request('GET', `/attendance/course/${courseId}?date=${date}`),
  getMyAttendance: () => request('GET', '/attendance/my'),

  // Grades
  saveGrade: (data) => request('POST', '/grades', data),
  getCourseGrades: (courseId) => request('GET', `/grades/course/${courseId}`),
  getMyGrades: () => request('GET', '/grades/my'),
  getAllUsers: () => request('GET', '/grades/users'),
};
