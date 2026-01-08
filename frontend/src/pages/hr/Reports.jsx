import React, { useState, useEffect } from 'react'
import { hrAPI } from '../../services/api'
import { toast } from 'react-toastify'
import Card from '../../components/common/Card'
import Table from '../../components/common/Table'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import { format } from 'date-fns'
import { getStatusColor } from '../../utils/constants'

const Reports = () => {
  const [reports, setReports] = useState([])
  const [movementLog, setMovementLog] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMovementLog, setLoadingMovementLog] = useState(false)
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [department, setDepartment] = useState('')
  const [showMovementLog, setShowMovementLog] = useState(false)
  const [summary, setSummary] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalOnLeave: 0,
  })

  useEffect(() => {
    loadReports()
  }, [startDate, endDate, department])

  const loadReports = async () => {
    try {
      setLoading(true)
      const params = {
        startDate,
        endDate,
        ...(department && { department }),
      }
      const response = await hrAPI.getReports(params)
      
      // Extract data from response structure: response.data.report.attendance
      const attendanceData = response.data?.report?.attendance || response.data?.attendance || []
      
      // Map API fields (snake_case) to frontend fields (camelCase)
      const mappedReports = attendanceData.map(emp => ({
        id: emp.id,
        employeeName: emp.name || emp.employee_name,
        email: emp.email || emp.employee_email,
        totalDays: parseInt(emp.total_days || emp.totalDays || 0),
        fullDays: parseInt(emp.full_days || emp.fullDays || 0),
        incompleteDays: parseInt(emp.incomplete_days || emp.incompleteDays || 0),
        absentDays: parseInt(emp.absent_days || emp.absentDays || 0),
        totalOutCount: parseInt(emp.total_out_count || 0),
        totalOutTimeHours: parseFloat(((emp.total_out_time_minutes || 0) / 60).toFixed(2)),
      }))
      
      setReports(mappedReports)
      
      // Calculate summary from attendance data
      const calculatedSummary = {
        totalPresent: mappedReports.reduce((sum, emp) => sum + emp.fullDays, 0),
        totalAbsent: mappedReports.reduce((sum, emp) => sum + emp.absentDays, 0),
        totalOnLeave: response.data?.report?.leaveSummary?.length || 0,
      }
      
      setSummary(calculatedSummary)
    } catch (error) {
      console.error('Error loading reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format) => {
    try {
      const params = {
        startDate,
        endDate,
        ...(department && { department }),
        format,
      }
      const response = await hrAPI.exportReports(params)
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance-report-${startDate}-${endDate}.${format}`
      a.click()
      toast.success(`Report exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error('Failed to export report')
    }
  }

  const loadMovementLog = async () => {
    try {
      setLoadingMovementLog(true)
      const params = {
        startDate,
        endDate,
      }
      const response = await hrAPI.getMovementLog(params)
      setMovementLog(response.data.movementLog || [])
      setShowMovementLog(true)
    } catch (error) {
      console.error('Error loading movement log:', error)
      toast.error('Failed to load movement log')
    } finally {
      setLoadingMovementLog(false)
    }
  }

  const reportColumns = [
    {
      header: 'Employee Name',
      accessor: 'employeeName',
      render: (row) => (
        <div className="min-w-[150px]">
          <div className="font-medium text-sm md:text-base">{row.employeeName}</div>
          <div className="text-xs md:text-sm text-gray-500 truncate">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Total Days',
      accessor: 'totalDays',
      render: (row) => (
        <span className="font-semibold text-sm md:text-base">{row.totalDays}</span>
      ),
    },
    {
      header: 'Full Days',
      accessor: 'fullDays',
      render: (row) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {row.fullDays}
        </span>
      ),
    },
    {
      header: 'Incomplete Days',
      accessor: 'incompleteDays',
      render: (row) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          {row.incompleteDays}
        </span>
      ),
    },
    {
      header: 'Absent Days',
      accessor: 'absentDays',
      render: (row) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {row.absentDays}
        </span>
      ),
    },
    {
      header: 'Times Out',
      accessor: 'totalOutCount',
      render: (row) => (
        <span className="font-semibold text-sm md:text-base">{row.totalOutCount || 0}</span>
      ),
    },
    {
      header: 'Total Out Time',
      accessor: 'totalOutTimeHours',
      render: (row) => (
        <span className="text-sm md:text-base">{row.totalOutTimeHours || 0} hrs</span>
      ),
    },
  ]

  const movementLogColumns = [
    {
      header: 'Employee',
      accessor: 'employee_name',
      render: (row) => (
        <div className="min-w-[120px]">
          <div className="font-medium text-sm">{row.employee_name}</div>
          <div className="text-xs text-gray-500">{format(new Date(row.date), 'MMM dd')}</div>
        </div>
      ),
    },
    {
      header: 'Time',
      accessor: 'out_time',
      render: (row) => (
        <div className="text-sm">
          <div className="font-medium">
            {row.status === 'OUT' ? 'OUT:' : 'IN:'} {format(new Date(row.out_time), 'h:mm a')}
          </div>
          {row.in_time && (
            <div className="text-xs text-gray-500">
              IN: {format(new Date(row.in_time), 'h:mm a')}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'OUT' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Duration',
      accessor: 'duration_minutes',
      render: (row) => {
        if (!row.in_time && row.status === 'OUT') {
          const now = new Date()
          const outTime = new Date(row.out_time)
          const minutes = Math.floor((now - outTime) / 1000 / 60)
          return <span className="text-sm text-orange-600">Active: {minutes} min</span>
        }
        return row.duration_minutes ? (
          <span className="text-sm">{(row.duration_minutes / 60).toFixed(2)} hrs</span>
        ) : '-'
      },
    },
    {
      header: 'Wi-Fi',
      accessor: 'wifi_status',
      render: (row) => (
        <span className={`text-xs ${
          row.wifi_status ? 'text-green-600' : 'text-gray-500'
        }`}>
          {row.wifi_status ? 'Connected' : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Location',
      accessor: 'location_status',
      render: (row) => (
        <span className={`text-xs ${
          row.location_status?.includes('Inside') ? 'text-green-600' : 'text-red-600'
        }`}>
          {row.location_status || 'N/A'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Attendance Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Total Present">
          <p className="text-3xl font-bold text-green-600">{summary.totalPresent}</p>
        </Card>
        <Card title="Total Absent">
          <p className="text-3xl font-bold text-red-600">{summary.totalAbsent}</p>
        </Card>
        <Card title="Total on Leave">
          <p className="text-3xl font-bold text-blue-600">{summary.totalOnLeave}</p>
        </Card>
      </div>

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
            label="Department (Optional)"
            type="text"
            name="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Filter by department"
          />
          <div className="flex items-end space-x-2">
            <Button variant="primary" onClick={loadReports} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </div>
        <div className="mt-4 flex space-x-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('excel')}>
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            Export PDF
          </Button>
        </div>
      </Card>

      <Card 
        title="Daily Attendance Summary"
        headerAction={
          <Button
            variant="outline"
            size="sm"
            onClick={showMovementLog ? () => setShowMovementLog(false) : loadMovementLog}
            loading={loadingMovementLog}
          >
            {showMovementLog ? 'Hide' : 'Show'} Movement Log
          </Button>
        }
      >
        <Table
          columns={reportColumns}
          data={reports}
          loading={loading}
          emptyMessage="No attendance data found for the selected period"
        />
      </Card>

      {showMovementLog && (
        <Card title="Detailed Movement Log">
          <div className="mb-4 text-sm text-gray-600">
            Shows all OUT/IN movements when employees left office radius or disconnected from Wi-Fi
          </div>
          <Table
            columns={movementLogColumns}
            data={movementLog}
            loading={loadingMovementLog}
            emptyMessage="No movement data found for the selected period"
          />
        </Card>
      )}
    </div>
  )
}

export default Reports

