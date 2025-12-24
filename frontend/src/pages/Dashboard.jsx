import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { USER_ROLES } from '../utils/constants'
import { attendanceAPI, leaveAPI, regularizationAPI } from '../services/api'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    todayStatus: null,
    attendanceSummary: {},
    pendingLeaves: 0,
    pendingRegularizations: 0,
    teamStats: {},
    companyStats: {},
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // Load today's attendance status
      const todayStatusRes = await attendanceAPI.getTodayStatus()
      setStats((prev) => ({ ...prev, todayStatus: todayStatusRes.data }))

      // Load pending leaves
      if (user.role === USER_ROLES.EMPLOYEE) {
        const leavesRes = await leaveAPI.getMyLeaves()
        const leaves = leavesRes.data.leaveRequests || leavesRes.data || []
        const pending = leaves.filter((l) => l.status === 'PENDING').length
        setStats((prev) => ({ ...prev, pendingLeaves: pending }))
      }

      // Load pending regularizations
      if (user.role === USER_ROLES.EMPLOYEE) {
        const regRes = await regularizationAPI.getMyRegularizations()
        const regs = regRes.data.requests || regRes.data.regularizationRequests || regRes.data || []
        const pending = regs.filter((r) => r.status === 'PENDING').length
        setStats((prev) => ({ ...prev, pendingRegularizations: pending }))
      }

      // Manager/HR/Admin specific data would be loaded here
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderEmployeeDashboard = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Today's Status">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {stats.todayStatus?.punchedIn ? 'Punched In' : 'Not Punched In'}
            </p>
            {stats.todayStatus?.punchInTime && (
              <p className="text-sm text-gray-600">
                {format(new Date(stats.todayStatus.punchInTime), 'h:mm a')}
              </p>
            )}
            <Button
              variant="primary"
              className="mt-4 w-full"
              onClick={() => navigate('/attendance')}
            >
              Go to Attendance
            </Button>
          </div>
        </Card>

        <Card title="Pending Requests">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Leave Requests:</span>
              <span className="font-semibold">{stats.pendingLeaves}</span>
            </div>
            <div className="flex justify-between">
              <span>Regularizations:</span>
              <span className="font-semibold">{stats.pendingRegularizations}</span>
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => navigate('/leave')}
            >
              View Requests
            </Button>
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="space-y-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => navigate('/attendance')}
            >
              Mark Attendance
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/leave')}
            >
              Apply Leave
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/regularization')}
            >
              Apply Regularization
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )

  const renderManagerDashboard = () => (
    <div className="space-y-6">
      {renderEmployeeDashboard()}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card title="Team Overview">
          <p className="text-gray-600">Team attendance and statistics</p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => navigate('/manager/team')}
          >
            View Team
          </Button>
        </Card>
        <Card title="Pending Approvals">
          <p className="text-gray-600">Review leave and regularization requests</p>
          <div className="mt-4 space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/manager/leave-requests')}
            >
              Leave Requests
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/manager/regularization-requests')}
            >
              Regularization Requests
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )

  const renderHRDashboard = () => (
    <div className="space-y-6">
      {renderManagerDashboard()}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card title="HR Approvals">
          <p className="text-gray-600">Final approval of requests</p>
          <div className="mt-4 space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/hr/leave-requests')}
            >
              HR Leave Approval
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/hr/regularization-requests')}
            >
              HR Regularization
            </Button>
          </div>
        </Card>
        <Card title="Reports">
          <p className="text-gray-600">Generate and export reports</p>
          <Button
            variant="primary"
            className="mt-4 w-full"
            onClick={() => navigate('/hr/reports')}
          >
            View Reports
          </Button>
        </Card>
      </div>
    </div>
  )

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="System Statistics">
          <p className="text-gray-600">View system-wide statistics</p>
        </Card>
        <Card title="User Management">
          <p className="text-gray-600">Manage employees and users</p>
          <Button
            variant="primary"
            className="mt-4 w-full"
            onClick={() => navigate('/admin/employees')}
          >
            Manage Employees
          </Button>
        </Card>
        <Card title="Settings">
          <p className="text-gray-600">Configure system settings</p>
          <Button
            variant="primary"
            className="mt-4 w-full"
            onClick={() => navigate('/admin/settings')}
          >
            Configure Settings
          </Button>
        </Card>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  switch (user?.role) {
    case USER_ROLES.EMPLOYEE:
      return renderEmployeeDashboard()
    case USER_ROLES.MANAGER:
      return renderManagerDashboard()
    case USER_ROLES.HR:
      return renderHRDashboard()
    case USER_ROLES.ADMIN:
      return renderAdminDashboard()
    default:
      return <div>Invalid role</div>
  }
}

export default Dashboard

