import React, { useState, useEffect } from 'react'
import { managerAPI } from '../../services/api'
import Card from '../../components/common/Card'
import Table from '../../components/common/Table'
import Select from '../../components/common/Select'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { format } from 'date-fns'
import { getStatusColor } from '../../utils/constants'

const TeamAttendance = () => {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [employeeId, setEmployeeId] = useState('')

  useEffect(() => {
    loadTeamAttendance()
  }, [startDate, endDate, employeeId])

  const loadTeamAttendance = async () => {
    try {
      setLoading(true)
      const params = {
        startDate,
        endDate,
        ...(employeeId && { employeeId }),
      }
      const response = await managerAPI.getTeamAttendance(params)
      setAttendance(response.data.teamAttendance || response.data || [])
    } catch (error) {
      console.error('Error loading team attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const params = {
        startDate,
        endDate,
        ...(employeeId && { employeeId }),
        format: 'csv',
      }
      const response = await managerAPI.getTeamAttendance(params)
      // Handle file download
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `team-attendance-${startDate}-${endDate}.csv`
      a.click()
    } catch (error) {
      console.error('Error exporting attendance:', error)
    }
  }

  const attendanceColumns = [
    {
      header: 'Employee Name',
      accessor: 'employeeName',
    },
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => format(new Date(row.date), 'MMM dd, yyyy'),
    },
    {
      header: 'Punch In',
      accessor: 'punchIn',
      render: (row) => row.punchIn ? format(new Date(row.punchIn), 'h:mm a') : '-',
    },
    {
      header: 'Punch Out',
      accessor: 'punchOut',
      render: (row) => row.punchOut ? format(new Date(row.punchOut), 'h:mm a') : '-',
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Team Attendance</h1>

      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <Input
            label="Employee ID (Optional)"
            type="text"
            name="employeeId"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="Filter by employee"
          />
          <div className="flex items-end">
            <Button
              variant="primary"
              onClick={handleExport}
              className="w-full"
            >
              Export CSV
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Attendance Records">
        <Table
          columns={attendanceColumns}
          data={attendance}
          loading={loading}
          emptyMessage="No attendance records found"
        />
      </Card>
    </div>
  )
}

export default TeamAttendance

