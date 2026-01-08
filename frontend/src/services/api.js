import axios from 'axios'
import { toast } from 'react-toastify'


const getApiBaseUrl = () => {
  // Check for explicit environment variable first (highest priority)
  if (import.meta.env.VITE_API_BASE_URL) {
    if (import.meta.env.DEV) {
      console.log('✅ Using VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
    }
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // In development, detect if we're on mobile/network access
  if (import.meta.env.DEV) {
    const currentHost = window.location.hostname
    const currentProtocol = window.location.protocol
    const currentPort = window.location.port
    
    // If accessing from mobile/network (not localhost), use the same host with port 3000
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      // Mobile/network access - use the same protocol and host but port 3000 for backend
      const apiUrl = `${currentProtocol}//${currentHost}:3000/api`
      console.log('📱 Mobile/Network detected. Using API URL:', apiUrl)
      return apiUrl
    }
    // Local development - use localhost
    const localUrl = 'http://localhost:3000/api'
    console.log('💻 Local development. Using API URL:', localUrl)
    return localUrl
  }
  
  // In production, try to infer from current location
  const currentHost = window.location.hostname
  const currentProtocol = window.location.protocol
  const currentPort = window.location.port
  
  // If production URL is provided, use it; otherwise infer from current location
  if (currentHost && currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    // Production: use same protocol and host, assume backend on same domain or port 3000
    // For production, backend might be on same domain or subdomain
    const prodUrl = `${currentProtocol}//${currentHost}${currentPort ? `:${currentPort}` : ''}/api`
    // Don't log in production to avoid exposing internal URLs
    return prodUrl
  }
  
  // Fallback
  const fallbackUrl = 'http://localhost:3000/api'
  if (import.meta.env.DEV) {
    console.warn('⚠️ Using fallback API URL:', fallbackUrl)
  }
  return fallbackUrl
}

const API_BASE_URL = getApiBaseUrl()

// Detect if we're on mobile (for longer timeout) - must be defined before use
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

// Add debug logging (only in development)
if (import.meta.env.DEV) {
  console.log('🔍 API Base URL:', API_BASE_URL)
  console.log('🔍 Environment:', import.meta.env.MODE)
  console.log('🔍 Is Mobile:', isMobile)
  console.log('🔍 Current Hostname:', window.location.hostname)
  console.log('🔍 Current Protocol:', window.location.protocol)
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: isMobile ? 30000 : 15000, // 30 seconds for mobile, 15 seconds for desktop
  headers: {
    'Content-Type': 'application/json',
  },
})


// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (works on mobile browsers)
    let token = null
    try {
      token = localStorage.getItem('token')
    } catch (error) {
      console.error('Error accessing localStorage:', error)
      // localStorage might be disabled or unavailable
      // Try sessionStorage as fallback
      try {
        token = sessionStorage.getItem('token')
      } catch (e) {
        console.error('Error accessing sessionStorage:', e)
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log request for debugging (only in development)
    if (import.meta.env.DEV) {
      console.log('📤 API Request:', config.method?.toUpperCase(), config.url)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('✅ API Response:', response.config.url)
    }
    return response
  },
  (error) => {
    // Log full error for debugging (only in development)
    if (import.meta.env.DEV) {
      console.error('❌ API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        code: error.code,
      })
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      const baseURL = error.config?.baseURL || API_BASE_URL
      const fullURL = `${baseURL}${error.config?.url}`
      
      console.error('⏱️ Timeout Error:', {
        url: error.config?.url,
        baseURL: baseURL,
        fullURL: fullURL,
        timeout: api.defaults.timeout,
      })
      
      // Provide helpful troubleshooting steps
      const troubleshootingSteps = [
        '1. Check if backend is running: cd backend && npm run dev',
        `2. Test backend: curl ${baseURL.replace('/api', '/health')}`,
        '3. Verify IP address matches your computer\'s IP',
        '4. Check firewall allows port 3000',
        '5. Ensure both devices are on same network'
      ]
      
      console.error('🔧 Troubleshooting Steps:')
      troubleshootingSteps.forEach(step => console.error(`   ${step}`))
      
      toast.error('Backend not responding. Check console for troubleshooting steps.')
      return Promise.reject(new Error(`Request timeout: Backend at ${baseURL} is not responding`))
    }
    
    // Handle network errors (CORS, connection refused, etc.)
    if (error.message === 'Network Error' || !error.response) {
      // More specific error messages for mobile
      let message = 'Cannot connect to server. '
      const fullURL = `${error.config?.baseURL || API_BASE_URL}${error.config?.url}`
      
      console.error('🌐 Network Error Details:', {
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL || API_BASE_URL,
        fullURL,
        code: error.code,
        hostname: window.location.hostname,
      })
      
      // Check if it's a CORS issue
      if (error.message === 'Network Error' && window.location.protocol === 'https:') {
        message += 'Make sure the backend supports HTTPS.'
      } else if (error.message === 'Network Error') {
        message += `Check if backend is running at: ${fullURL}`
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          message += `\nMake sure both devices are on the same network.`
        }
      } else {
        message += 'Please check your internet connection.'
      }
      
      toast.error(message)
      return Promise.reject(new Error(message))
    }
    
    // Handle 401 Unauthorized - clear tokens and redirect
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
      } catch (e) {
        console.error('Error clearing storage:', e)
      }
      // Use window.location for reliable redirect on mobile
      window.location.href = '/login'
      return Promise.reject(error)
    }
    
    const message = error.response?.data?.message || error.message || 'An error occurred'
    if (error.response?.status !== 401) {
      toast.error(message)
    }
    
    return Promise.reject(error)
  }
)

export default api

// ... rest of the file stays the same

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
    } catch (error) {
      console.error('Error clearing storage on logout:', error)
    }
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
  getMovementLog: (params) => api.get('/hr/reports/movement-log', { params }),
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

