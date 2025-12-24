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
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [department, setDepartment] = useState('')
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
      setReports(response.data?.records || [])
      setSummary(response.data?.summary || summary)
    } catch (error) {
      console.error('Error loading reports:', error)
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

  const reportColumns = [
    {
      header: 'Employee Name',
      accessor: 'employeeName',
    },
    {
      header: 'Department',
      accessor: 'department',
    },
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => format(new Date(row.date), 'MMM dd, yyyy'),
    },
    {
      header: 'Punch In',
      accessor: 'punchIn',
      render: (row) => (row.punchIn ? format(new Date(row.punchIn), 'h:mm a') : '-'),
    },
    {
      header: 'Punch Out',
      accessor: 'punchOut',
      render: (row) => (row.punchOut ? format(new Date(row.punchOut), 'h:mm a') : '-'),
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

      <Card title="Attendance Records">
        <Table
          columns={reportColumns}
          data={reports}
          loading={loading}
          emptyMessage="No attendance records found"
        />
      </Card>
    </div>
  )
}

export default Reports

