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
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-primary-600">Gatnix</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {/* {getRoleBasedLinks().map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  {link.label}
                </Link>
              ))} */}
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user.name} ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium"
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

