import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import Card from '../../components/common/Card'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import { toast } from 'react-toastify'
import { format } from 'date-fns'

const MonthlyAttendanceCalendar = () => {
  const [calendarData, setCalendarData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    loadCalendar()
  }, [selectedMonth, selectedYear])

  const loadCalendar = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getMonthlyAttendanceCalendar({
        month: selectedMonth,
        year: selectedYear,
      })
      setCalendarData(response.data)
    } catch (error) {
      console.error('Error loading calendar:', error)
      toast.error('Failed to load attendance calendar')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status, type) => {
    if (type === 'WEEKEND') {
      return 'bg-gray-200 text-gray-600'
    }
    if (type === 'LEAVE') {
      return 'bg-blue-100 text-blue-800'
    }
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800'
      case 'INCOMPLETE':
        return 'bg-yellow-100 text-yellow-800'
      case 'ABSENT':
        return 'bg-red-100 text-red-800'
      case 'HOLIDAY':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusLabel = (status, type, leaveType) => {
    if (type === 'WEEKEND') return 'H'
    if (type === 'LEAVE') return leaveType || 'L'
    switch (status) {
      case 'PRESENT':
        return 'P'
      case 'INCOMPLETE':
        return 'I'
      case 'ABSENT':
        return 'A'
      default:
        return '-'
    }
  }

  const exportToCSV = () => {
    if (!calendarData || !calendarData.calendar) {
      toast.error('No data to export')
      return
    }

    const { calendar, month, year, daysInMonth } = calendarData

    // Create CSV header
    const headers = ['Employee Name', 'Email', 'Role', 'Total Days', 'Present', 'Absent', 'Leave', 'Incomplete', 'Holiday']
    
    // Add day columns (1-31)
    for (let day = 1; day <= daysInMonth; day++) {
      headers.push(`Day ${day}`)
    }
    
    const csvRows = [headers.join(',')]

    // Add data rows
    calendar.forEach(emp => {
      const row = [
        `"${emp.employeeName}"`,
        `"${emp.employeeEmail}"`,
        `"${emp.employeeRole}"`,
        emp.summary.totalDays,
        emp.summary.presentDays,
        emp.summary.absentDays,
        emp.summary.leaveDays,
        emp.summary.incompleteDays,
        emp.summary.holidayDays,
      ]

      // Add day statuses
      emp.days.forEach(day => {
        const label = getStatusLabel(day.status, day.type, day.leaveType)
        row.push(label)
      })

      csvRows.push(row.join(','))
    })

    // Create CSV content
    const csvContent = csvRows.join('\n')
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `attendance_${year}_${String(month).padStart(2, '0')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('CSV file downloaded successfully')
  }

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2024, i).toLocaleString('default', { month: 'long' }),
  }))

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 2 + i
    return { value: year, label: year.toString() }
  })

  if (loading && !calendarData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading calendar...</div>
      </div>
    )
  }

  if (!calendarData) {
    return null
  }

  const { calendar, daysInMonth } = calendarData

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Monthly Attendance Calendar</h1>
        <Button onClick={exportToCSV} variant="primary">
          📥 Export CSV
        </Button>
      </div>

      <Card>
        <div className="flex space-x-4 mb-6">
          <Select
            label="Month"
            name="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            options={months}
            className="w-40"
          />
          <Select
            label="Year"
            name="year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            options={years}
            className="w-32"
          />
          <div className="flex items-end">
            <Button variant="outline" onClick={loadCalendar}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Legend:</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-100 text-green-800 rounded text-center text-xs flex items-center justify-center">P</div>
              <span>Present</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-red-100 text-red-800 rounded text-center text-xs flex items-center justify-center">A</div>
              <span>Absent</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded text-center text-xs flex items-center justify-center">L</div>
              <span>Leave</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-yellow-100 text-yellow-800 rounded text-center text-xs flex items-center justify-center">I</div>
              <span>Incomplete</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-200 text-gray-600 rounded text-center text-xs flex items-center justify-center">H</div>
              <span>Holiday/Weekend</span>
            </div>
          </div>
        </div>

        {/* Calendar Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left sticky left-0 bg-gray-100 z-10 min-w-[200px]">Employee</th>
                <th className="border p-2 text-center min-w-[80px]">Total</th>
                <th className="border p-2 text-center min-w-[80px]">Present</th>
                <th className="border p-2 text-center min-w-[80px]">Absent</th>
                <th className="border p-2 text-center min-w-[80px]">Leave</th>
                <th className="border p-2 text-center min-w-[80px]">Incomplete</th>
                <th className="border p-2 text-center min-w-[80px]">Holiday</th>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <th key={i + 1} className="border p-1 text-center min-w-[40px] text-xs">
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calendar.map((emp) => (
                <tr key={emp.employeeId} className="hover:bg-gray-50">
                  <td className="border p-2 sticky left-0 bg-white z-10">
                    <div className="font-medium">{emp.employeeName}</div>
                    <div className="text-xs text-gray-500">{emp.employeeEmail}</div>
                  </td>
                  <td className="border p-2 text-center font-semibold">{emp.summary.totalDays}</td>
                  <td className="border p-2 text-center text-green-600 font-semibold">{emp.summary.presentDays}</td>
                  <td className="border p-2 text-center text-red-600 font-semibold">{emp.summary.absentDays}</td>
                  <td className="border p-2 text-center text-blue-600 font-semibold">{emp.summary.leaveDays}</td>
                  <td className="border p-2 text-center text-yellow-600 font-semibold">{emp.summary.incompleteDays}</td>
                  <td className="border p-2 text-center text-gray-600 font-semibold">{emp.summary.holidayDays}</td>
                  {emp.days.map((day, idx) => (
                    <td
                      key={idx}
                      className={`border p-1 text-center text-xs font-medium ${getStatusColor(day.status, day.type)}`}
                      title={`${format(new Date(day.date), 'MMM dd, yyyy')} - ${day.status}${day.leaveType ? ` (${day.leaveType})` : ''}`}
                    >
                      {getStatusLabel(day.status, day.type, day.leaveType)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Statistics */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">Overall Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Employees</div>
              <div className="text-2xl font-bold">{calendar.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Present Days</div>
              <div className="text-2xl font-bold text-green-600">
                {calendar.reduce((sum, emp) => sum + emp.summary.presentDays, 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Absent Days</div>
              <div className="text-2xl font-bold text-red-600">
                {calendar.reduce((sum, emp) => sum + emp.summary.absentDays, 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Leave Days</div>
              <div className="text-2xl font-bold text-blue-600">
                {calendar.reduce((sum, emp) => sum + emp.summary.leaveDays, 0)}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default MonthlyAttendanceCalendar

