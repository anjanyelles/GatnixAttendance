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
      
      // Map API response (snake_case) to frontend format (camelCase)
      const rawData = response.data.teamAttendance || response.data || []
      const mappedData = rawData.map(item => ({
        id: item.id,
        employeeId: item.employee_id,
        employeeName: item.employee_name || item.name || '-',
        employeeEmail: item.employee_email || item.email || '-',
        date: item.date,
        punchIn: item.punch_in,
        punchOut: item.punch_out,
        status: item.status || (item.punch_in && !item.punch_out ? 'PRESENT' : item.punch_in && item.punch_out ? 'PRESENT' : 'ABSENT'),
        latitude: item.latitude,
        longitude: item.longitude,
        distanceMeters: item.distance_meters,
        ipAddress: item.ip_address,
        createdAt: item.created_at,
      }))
      
      setAttendance(mappedData)
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
      render: (row) => (
        <div>
          <div className="font-medium">{row.employeeName || '-'}</div>
          <div className="text-xs text-gray-500">{row.employeeEmail || ''}</div>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => {
        if (!row.date) return '-'
        try {
          const date = new Date(row.date)
          if (isNaN(date.getTime())) return '-'
          return format(date, 'MMM dd, yyyy')
        } catch {
          return '-'
        }
      },
    },
    {
      header: 'Punch In',
      accessor: 'punchIn',
      render: (row) => {
        if (!row.punchIn) return '-'
        try {
          const date = new Date(row.punchIn)
          if (isNaN(date.getTime())) return '-'
          return format(date, 'h:mm a')
        } catch {
          return '-'
        }
      },
    },
    {
      header: 'Punch Out',
      accessor: 'punchOut',
      render: (row) => {
        if (!row.punchOut) return '-'
        try {
          const date = new Date(row.punchOut)
          if (isNaN(date.getTime())) return '-'
          return format(date, 'h:mm a')
        } catch {
          return '-'
        }
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        // Calculate status if not provided
        let status = row.status
        if (!status) {
          if (!row.punchIn) {
            status = 'ABSENT'
          } else if (row.punchIn && !row.punchOut) {
            status = 'PRESENT'
          } else if (row.punchIn && row.punchOut) {
            status = 'PRESENT'
          } else {
            status = 'ABSENT'
          }
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status || 'ABSENT'}
        </span>
        )
      },
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

