import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import Card from '../../components/common/Card'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import { format } from 'date-fns'
import { getStatusColor } from '../../utils/constants'

const EmployeeAttendance = () => {
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [employeeDetails, setEmployeeDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [viewType, setViewType] = useState('monthly') // 'monthly' or 'daily'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    loadEmployeeAttendance()
  }, [viewType, selectedMonth, selectedYear, startDate, endDate])

  const loadEmployeeAttendance = async () => {
    try {
      setLoading(true)
      const params = viewType === 'monthly'
        ? { month: selectedMonth, year: selectedYear }
        : { startDate, endDate }
      
      const response = await adminAPI.getEmployeeAttendanceSummary(params)
      setEmployees(response.data.employees || [])
    } catch (error) {
      console.error('Error loading employee attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEmployeeDetails = async (employeeId) => {
    try {
      setDetailsLoading(true)
      const params = viewType === 'monthly'
        ? { month: selectedMonth, year: selectedYear }
        : { startDate, endDate }
      
      const response = await adminAPI.getEmployeeAttendanceDetails(employeeId, params)
      setEmployeeDetails(response.data)
      setShowDetailsModal(true)
    } catch (error) {
      console.error('Error loading employee details:', error)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleRowClick = (employee) => {
    setSelectedEmployee(employee)
    loadEmployeeDetails(employee.id)
  }

  const getAttendanceStatus = (row) => {
    if (!row.punch_in) return 'ABSENT'
    if (row.punch_in && row.punch_out) return 'PRESENT'
    if (row.punch_in && !row.punch_out) return 'INCOMPLETE'
    return 'ABSENT'
  }

  const employeeColumns = [
    {
      header: 'Employee Name',
      accessor: 'name',
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Role',
      accessor: 'role',
    },
    {
      header: 'Total Days',
      accessor: 'total_days',
      render: (row) => row.total_days || 0,
    },
    {
      header: 'Present',
      accessor: 'present_days',
      render: (row) => (
        <span className="text-green-600 font-semibold">{row.present_days || 0}</span>
      ),
    },
    {
      header: 'Incomplete',
      accessor: 'incomplete_days',
      render: (row) => (
        <span className="text-yellow-600 font-semibold">{row.incomplete_days || 0}</span>
      ),
    },
    {
      header: 'Absent',
      accessor: 'absent_days',
      render: (row) => (
        <span className="text-red-600 font-semibold">{row.absent_days || 0}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleRowClick(row)
          }}
        >
          View Details
        </Button>
      ),
    },
  ]

  const detailsColumns = [
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => format(new Date(row.date), 'MMM dd, yyyy'),
    },
    {
      header: 'Punch In',
      accessor: 'punch_in',
      render: (row) => row.punch_in ? format(new Date(row.punch_in), 'h:mm a') : '-',
    },
    {
      header: 'Punch Out',
      accessor: 'punch_out',
      render: (row) => row.punch_out ? format(new Date(row.punch_out), 'h:mm a') : '-',
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const status = getAttendanceStatus(row)
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
        )
      },
    },
    {
      header: 'Distance (m)',
      accessor: 'distance_meters',
      render: (row) => row.distance_meters ? `${row.distance_meters}` : '-',
    },
  ]

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2024, i).toLocaleString('default', { month: 'long' }),
  }))

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 2 + i
    return { value: year, label: year.toString() }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Employee Attendance</h1>

      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View Type</label>
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="monthly">Monthly</option>
              <option value="daily">Date Range</option>
            </select>
          </div>

          {viewType === 'monthly' ? (
            <>
              <Select
                label="Month"
                name="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                options={months}
              />
              <Select
                label="Year"
                name="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                options={years}
              />
            </>
          ) : (
            <>
              <Input
                label="Start Date"
                type="date"
                name="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                name="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </>
          )}

          <div className="flex items-end">
            <Button variant="primary" onClick={loadEmployeeAttendance} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Employee Attendance Summary">
        <Table
          columns={employeeColumns}
          data={employees}
          loading={loading}
          emptyMessage="No attendance records found"
        />
      </Card>

      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedEmployee(null)
          setEmployeeDetails(null)
        }}
        title={employeeDetails ? `Attendance Details - ${employeeDetails.employee.name}` : 'Attendance Details'}
        size="lg"
      >
        {employeeDetails && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Email: {employeeDetails.employee.email}</p>
              <p className="text-sm text-gray-600">Role: {employeeDetails.employee.role}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Daily Attendance Records</h4>
              <Table
                columns={detailsColumns}
                data={employeeDetails.attendance || []}
                loading={detailsLoading}
                emptyMessage="No attendance records found for this period"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default EmployeeAttendance

