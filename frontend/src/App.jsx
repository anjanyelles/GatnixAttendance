import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './context/AuthContext'
import { USER_ROLES } from './utils/constants'
import ProtectedRoute from './components/common/ProtectedRoute'
import Navbar from './components/layout/Navbar'
import Sidebar from './components/layout/Sidebar'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Attendance from './pages/Attendance'
import Leave from './pages/Leave'
import Regularization from './pages/Regularization'
import MyMonthlyCalendar from './pages/MyMonthlyCalendar'

// Manager Pages
import TeamAttendance from './pages/manager/TeamAttendance'
import LeaveRequests from './pages/manager/LeaveRequests'
import RegularizationRequests from './pages/manager/RegularizationRequests'

// HR Pages
import LeaveApproval from './pages/hr/LeaveApproval'
import RegularizationApproval from './pages/hr/RegularizationApproval'
import Reports from './pages/hr/Reports'

// Admin Pages
import Employees from './pages/admin/Employees'
import Settings from './pages/admin/Settings'
import EmployeeAttendance from './pages/admin/EmployeeAttendance'
import MonthlyAttendanceCalendar from './pages/admin/MonthlyAttendanceCalendar'
import AdminLeaveRequests from './pages/admin/LeaveRequests'

const AppLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Employee Routes */}
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Attendance />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-calendar"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MyMonthlyCalendar />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leave"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Leave />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/regularization"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Regularization />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Manager Routes */}
          <Route
            path="/manager/team"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER, USER_ROLES.HR, USER_ROLES.ADMIN]}>
                <AppLayout>
                  <TeamAttendance />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/leave-requests"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER, USER_ROLES.HR, USER_ROLES.ADMIN]}>
                <AppLayout>
                  <LeaveRequests />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/regularization-requests"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER, USER_ROLES.HR, USER_ROLES.ADMIN]}>
                <AppLayout>
                  <RegularizationRequests />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* HR Routes */}
          <Route
            path="/hr/leave-requests"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.HR, USER_ROLES.ADMIN]}>
                <AppLayout>
                  <LeaveApproval />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/regularization-requests"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.HR, USER_ROLES.ADMIN]}>
                <AppLayout>
                  <RegularizationApproval />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/reports"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.HR, USER_ROLES.ADMIN]}>
                <AppLayout>
                  <Reports />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/employees"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <AppLayout>
                  <Employees />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/employee-attendance"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <AppLayout>
                  <EmployeeAttendance />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/monthly-calendar"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <AppLayout>
                  <MonthlyAttendanceCalendar />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leave-requests"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <AppLayout>
                  <AdminLeaveRequests />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Router>
    </AuthProvider>
  )
}

export default App

