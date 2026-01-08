import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { USER_ROLES } from '../../utils/constants'

const Sidebar = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isActive = (path) => location.pathname === path

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

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
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={toggleMobileMenu}
          className="fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg md:hidden"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-gray-800 min-h-screen transform transition-transform duration-300 ease-in-out ${
          isMobile && !isMobileMenuOpen ? '-translate-x-full' : 'translate-x-0'
        } md:translate-x-0`}
      >
        <div className="p-4 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-xl font-bold">Gatnix</h2>
            {isMobile && (
              <button
                onClick={toggleMobileMenu}
                className="text-white p-1 md:hidden"
                aria-label="Close menu"
              >
                ✕
              </button>
            )}  
          </div>
        <nav className="space-y-2">
          {getMenuItems().map((item) => (
            <Link
              key={item.path}
              to={item.path}
                onClick={() => isMobile && setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="text-sm md:text-base">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
    </>
  )
}

export default Sidebar

