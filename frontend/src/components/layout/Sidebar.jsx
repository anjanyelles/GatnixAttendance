import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { USER_ROLES } from '../../utils/constants'

const Sidebar = () => {
  const { user } = useAuth()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const getMenuItems = () => {
    if (!user) return []

    const items = [
      { path: '/dashboard', label: 'Dashboard', icon: '📊' },
      { path: '/attendance', label: 'Attendance', icon: '⏰' },
      { path: '/my-calendar', label: 'My Calendar', icon: '📅' },
      { path: '/leave', label: 'Leave', icon: '📅' },
      { path: '/regularization', label: 'Regularization', icon: '✏️' },
    ]

    if (user.role === USER_ROLES.MANAGER || user.role === USER_ROLES.HR || user.role === USER_ROLES.ADMIN) {
      items.push(
        { path: '/manager/team', label: 'Team Attendance', icon: '👥' },
        { path: '/manager/leave-requests', label: 'Leave Requests', icon: '📋' },
        { path: '/manager/regularization-requests', label: 'Regularization Requests', icon: '📝' }
      )
    }

    if (user.role === USER_ROLES.HR || user.role === USER_ROLES.ADMIN) {
      items.push(
        { path: '/hr/leave-requests', label: 'HR Leave Approval', icon: '✅' },
        { path: '/hr/regularization-requests', label: 'HR Regularization', icon: '✅' },
        { path: '/hr/reports', label: 'Reports', icon: '📊' }
      )
    }

    if (user.role === USER_ROLES.ADMIN) {
      items.push(
        { path: '/admin/employees', label: 'Employees', icon: '👤' },
        { path: '/admin/employee-attendance', label: 'Employee Attendance', icon: '📊' },
        { path: '/admin/monthly-calendar', label: 'Monthly Calendar', icon: '📅' },
        { path: '/admin/leave-requests', label: 'All Leave Requests', icon: '📋' },
        { path: '/admin/settings', label: 'Settings', icon: '⚙️' }
      )
    }

    return items
  }

  if (!user) return null

  return (
    <aside className="w-64 bg-gray-800 min-h-screen">
      <div className="p-4">
        <h2 className="text-white text-xl font-bold mb-6">Gatnix</h2>
        <nav className="space-y-2">
          {getMenuItems().map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar

