import React, { useState, useEffect } from 'react'
import { attendanceAPI } from '../services/api'
import Card from '../components/common/Card'
import Select from '../components/common/Select'
import { format } from 'date-fns'
import { toast } from 'react-toastify'

const MyMonthlyCalendar = () => {
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
      const response = await attendanceAPI.getMyMonthlyCalendar({
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
    if (type === 'WEEKEND' || type === 'HOLIDAY') {
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
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusLabel = (status, type, leaveType) => {
    if (type === 'WEEKEND' || type === 'HOLIDAY') return 'H'
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

  const { days, summary, employee, daysInMonth } = calendarData

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">My Monthly Attendance</h1>

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
        </div>

        {/* Summary Statistics */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">Summary for {employee.name}</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Days</div>
              <div className="text-2xl font-bold">{summary.totalDays}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Present</div>
              <div className="text-2xl font-bold text-green-600">{summary.presentDays}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Absent</div>
              <div className="text-2xl font-bold text-red-600">{summary.absentDays}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Leave</div>
              <div className="text-2xl font-bold text-blue-600">{summary.leaveDays}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Incomplete</div>
              <div className="text-2xl font-bold text-yellow-600">{summary.incompleteDays}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Holiday</div>
              <div className="text-2xl font-bold text-gray-600">{summary.holidayDays}</div>
            </div>
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

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-700 p-2">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((dayData, idx) => {
              const date = new Date(dayData.date)
              const dayOfWeek = date.getDay()
              const isFirstDay = idx === 0
              const offset = isFirstDay ? dayOfWeek : 0
              
              return (
                <React.Fragment key={dayData.day}>
                  {isFirstDay && Array.from({ length: offset }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-2"></div>
                  ))}
                  <div
                    className={`p-2 text-center rounded ${getStatusColor(dayData.status, dayData.type)}`}
                    title={`${format(new Date(dayData.date), 'MMM dd, yyyy')} - ${dayData.status}${dayData.leaveType ? ` (${dayData.leaveType})` : ''}${dayData.punchIn ? `\nPunch In: ${format(new Date(dayData.punchIn), 'h:mm a')}` : ''}${dayData.punchOut ? `\nPunch Out: ${format(new Date(dayData.punchOut), 'h:mm a')}` : ''}`}
                  >
                    <div className="font-semibold">{dayData.day}</div>
                    <div className="text-xs mt-1">{getStatusLabel(dayData.status, dayData.type, dayData.leaveType)}</div>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default MyMonthlyCalendar

