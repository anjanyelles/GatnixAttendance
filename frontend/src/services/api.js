import axios from 'axios'
import { toast } from 'react-toastify'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    
    const message = error.response?.data?.message || error.message || 'An error occurred'
    if (error.response?.status !== 401) {
      toast.error(message)
    }
    
    return Promise.reject(error)
  }
)

export default api

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
}

// Attendance API
export const attendanceAPI = {
  validateLocation: (data) => api.post('/attendance/validate-location', data),
  punchIn: (data) => api.post('/attendance/punch-in', data),
  punchOut: (data) => api.post('/attendance/punch-out', data),
  getMyAttendance: (month, year) => api.get(`/attendance/my?month=${month}&year=${year}`),
  getTodayStatus: () => api.get('/attendance/today'),
  getMyMonthlyCalendar: (params) => api.get('/attendance/my-calendar', { params }),
  sendHeartbeat: (data) => api.post('/attendance/heartbeat', data),
  getPresenceStatus: () => api.get('/attendance/presence'),
}

// Leave API
export const leaveAPI = {
  apply: (data) => api.post('/leave/apply', data),
  getMyLeaves: () => api.get('/leave/my'),
  getManagerLeaves: () => api.get('/manager/leave-requests'),
  approveManager: (id, data) => api.put(`/manager/leave-requests/${id}`, data),
  getHRLeaves: () => api.get('/hr/leave-requests'),
  approveHR: (id, data) => api.put(`/hr/leave-requests/${id}`, data),
}

// Regularization API
export const regularizationAPI = {
  apply: (data) => api.post('/regularization/apply', data),
  getMyRegularizations: () => api.get('/regularization/my'),
  getManagerRegularizations: () => api.get('/manager/regularization-requests'),
  approveManager: (id, data) => api.put(`/manager/regularization-requests/${id}`, data),
  getHRRegularizations: () => api.get('/hr/regularization-requests'),
  approveHR: (id, data) => api.put(`/hr/regularization-requests/${id}`, data),
}

// Manager API
export const managerAPI = {
  getTeamAttendance: (params) => api.get('/manager/team-attendance', { params }),
}

// HR API
export const hrAPI = {
  getReports: (params) => api.get('/hr/reports', { params }),
  exportReports: (params) => api.get('/hr/reports/export', { params, responseType: 'blob' }),
}

// Admin API
export const adminAPI = {
  getEmployees: () => api.get('/admin/employees'),
  addEmployee: (data) => api.post('/admin/employees', data),
  updateEmployee: (id, data) => api.put(`/admin/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/admin/employees/${id}`),
  getSettings: () => api.get('/admin/office-settings'),
  updateSettings: (data) => api.put('/admin/office-settings', data),
  getEmployeeAttendanceSummary: (params) => api.get('/admin/employee-attendance', { params }),
  getEmployeeAttendanceDetails: (employeeId, params) => api.get(`/admin/employee-attendance/${employeeId}`, { params }),
  getMonthlyAttendanceCalendar: (params) => api.get('/admin/monthly-attendance-calendar', { params }),
  exportAttendanceCSV: (params) => api.get('/admin/export-attendance-csv', { params }),
  getHolidays: (params) => api.get('/admin/holidays', { params }),
  createHoliday: (data) => api.post('/admin/holidays', data),
  updateHoliday: (id, data) => api.put(`/admin/holidays/${id}`, data),
  deleteHoliday: (id) => api.delete(`/admin/holidays/${id}`),
  getAllLeaveRequests: (params) => api.get('/admin/leave-requests', { params }),
}

