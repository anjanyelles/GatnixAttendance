import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { USER_ROLES } from '../../utils/constants'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getRoleBasedLinks = () => {
    if (!user) return []

    const links = [
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/attendance', label: 'Attendance' },
      { path: '/leave', label: 'Leave' },
      { path: '/regularization', label: 'Regularization' },
    ]

    if (user.role === USER_ROLES.MANAGER || user.role === USER_ROLES.HR || user.role === USER_ROLES.ADMIN) {
      links.push(
        { path: '/manager/team', label: 'Team' },
        { path: '/manager/leave-requests', label: 'Leave Requests' },
        { path: '/manager/regularization-requests', label: 'Regularization Requests' }
      )
    }

    if (user.role === USER_ROLES.HR || user.role === USER_ROLES.ADMIN) {
      links.push(
        { path: '/hr/leave-requests', label: 'HR Leave Approval' },
        { path: '/hr/regularization-requests', label: 'HR Regularization' },
        { path: '/hr/reports', label: 'Reports' }
      )
    }

    if (user.role === USER_ROLES.ADMIN) {
      links.push(
        { path: '/admin/employees', label: 'Employees' },
        { path: '/admin/employee-attendance', label: 'Employee Attendance' },
        { path: '/admin/monthly-calendar', label: 'Monthly Calendar' },
        { path: '/admin/leave-requests', label: 'All Leave Requests' },
        { path: '/admin/settings', label: 'Settings' }
      )
    }

    return links
  }

  if (!user) return null

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-lg md:text-xl font-bold text-primary-600">Gatnix</h1>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center space-x-2 md:space-x-4">
              <span className="text-xs md:text-sm text-gray-700 truncate max-w-[100px] md:max-w-none">
                {user.name} ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-2 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-red-700 text-xs md:text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

