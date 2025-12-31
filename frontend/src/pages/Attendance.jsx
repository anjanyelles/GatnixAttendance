import React, { useState, useEffect } from 'react'
import { useLocation } from '../hooks/useLocation'
import { useHeartbeat } from '../hooks/useHeartbeat'
import { attendanceAPI } from '../services/api'
import { toast } from 'react-toastify'
import PunchCard from '../components/attendance/PunchCard'
import LocationStatus from '../components/attendance/LocationStatus'
import LocationPermissionPrompt from '../components/common/LocationPermissionPrompt'
import Card from '../components/common/Card'
import Table from '../components/common/Table'
import { format } from 'date-fns'
import { getStatusColor } from '../utils/constants'
import Select from '../components/common/Select'
import Button from '../components/common/Button'

const Attendance = () => {
  // Auto-request location on mount (especially important for mobile)
  const { location, error: locationError, loading: locationLoading, getCurrentLocation, getClientIP } = useLocation(true)
  const [todayStatus, setTodayStatus] = useState(null)
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [punching, setPunching] = useState(false)
  const [locationValid, setLocationValid] = useState(false)
  const [wifiValid, setWifiValid] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showLocationPrompt, setShowLocationPrompt] = useState(false)
  
  const isPunchedIn = todayStatus?.punchedIn && !todayStatus?.punchOutTime
  
  // Handle auto punch out
  const handleAutoPunchOut = (reason) => {
    console.log('Auto punch out triggered:', reason)
    loadTodayStatus()
    loadAttendanceHistory()
  }
  
  // Use heartbeat hook for presence monitoring
  const { insideOffice, lastHeartbeat } = useHeartbeat(isPunchedIn, handleAutoPunchOut)

  useEffect(() => {
    loadTodayStatus()
    loadAttendanceHistory()
    
    // Request location immediately when page loads (for mobile permission prompt)
    const requestLocation = () => {
      if (navigator.geolocation) {
        // Request location immediately - this will trigger permission prompt on mobile
        getCurrentLocation().catch((err) => {
          // If permission denied, show prompt after a delay
          if (err && err.includes && err.includes('permission')) {
            setTimeout(() => {
              setShowLocationPrompt(true)
            }, 2000) // Show prompt after 2 seconds if permission denied
          }
        })
      }
    }
    
    // Request immediately and also after small delay (for mobile browsers)
    requestLocation()
    const timer = setTimeout(requestLocation, 500)
    
    // Also run checkLocation for validation
    const checkTimer = setTimeout(() => {
      checkLocation()
    }, 1000)
    
    return () => {
      clearTimeout(timer)
      clearTimeout(checkTimer)
    }
  }, [])

  // Show prompt if location error is permission-related
  useEffect(() => {
    if (locationError && locationError.includes && locationError.includes('permission')) {
      // Show prompt after a short delay
      const timer = setTimeout(() => {
        setShowLocationPrompt(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [locationError])

  // Show prompt if location error is permission-related
  useEffect(() => {
    if (locationError && locationError.includes('permission')) {
      // Show prompt after a short delay
      const timer = setTimeout(() => {
        setShowLocationPrompt(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [locationError])

  // Reload today status periodically to update punch out state
  useEffect(() => {
    const interval = setInterval(() => {
      loadTodayStatus()
    }, 30000) // Every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    loadAttendanceHistory()
  }, [selectedMonth, selectedYear])

  const checkLocation = async () => {
    try {
      const locationData = await getCurrentLocation()
      const ipAddress = await getClientIP()
      
      if (!ipAddress) {
        toast.error('Failed to get IP address')
        setLocationValid(false)
        setWifiValid(false)
        return
      }
      
      // Validate location and IP with backend
      try {
        const validation = await attendanceAPI.validateLocation({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          ipAddress,
        })
        
        // Set location and Wi-Fi validation separately
        setLocationValid(validation.data.locationValid || false)
        setWifiValid(validation.data.wifiValid || false)
        
        if (validation.data.valid) {
          toast.success(`Location and Wi-Fi validated! Distance: ${validation.data.distance} meters from office`)
        } else {
          // Show specific error messages
          if (validation.data.locationError) {
            toast.warning(validation.data.locationError)
          }
          if (validation.data.wifiError) {
            toast.warning(validation.data.wifiError)
          }
        }
      } catch (validationError) {
        // If API call fails, try to get location at least
        setLocationValid(true)
        setWifiValid(false)
        console.error('Location validation error:', validationError)
        toast.warning('Could not validate with server. Please check your connection.')
      }
    } catch (error) {
      setLocationValid(false)
      setWifiValid(false)
      console.error('Location error:', error)
      toast.error('Failed to get location. Please enable location permissions.')
    }
  }

  const loadTodayStatus = async () => {
    try {
      const response = await attendanceAPI.getTodayStatus()
      setTodayStatus(response.data)
      
      // Also get presence status if punched in
      if (response.data.punchedIn && !response.data.punchOutTime) {
        try {
          const presenceResponse = await attendanceAPI.getPresenceStatus()
          if (presenceResponse.data) {
            setTodayStatus(prev => ({
              ...prev,
              insideOffice: presenceResponse.data.insideOffice,
              lastHeartbeat: presenceResponse.data.lastHeartbeat,
              outCount: presenceResponse.data.outCount,
              totalOutTimeMinutes: presenceResponse.data.totalOutTimeMinutes,
            }))
          }
        } catch (err) {
          console.error('Error loading presence status:', err)
        }
      }
    } catch (error) {
      console.error('Error loading today status:', error)
    }
  }

  const loadAttendanceHistory = async () => {
    try {
      setLoading(true)
      const response = await attendanceAPI.getMyAttendance(selectedMonth, selectedYear)
      setAttendanceHistory(response.data.data || response.data.attendance || [])
    } catch (error) {
      console.error('Error loading attendance history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePunchIn = async () => {
    try {
      setPunching(true)
      const locationData = await getCurrentLocation()
      const ipAddress = await getClientIP()

      const response = await attendanceAPI.punchIn({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        ipAddress,
      })

      toast.success('Punched in successfully!')
      await loadTodayStatus()
      await loadAttendanceHistory()
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to punch in'
      toast.error(message)
    } finally {
      setPunching(false)
    }
  }

  const handlePunchOut = async () => {
    try {
      setPunching(true)
      const locationData = await getCurrentLocation()
      const ipAddress = await getClientIP()

      const response = await attendanceAPI.punchOut({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        ipAddress,
      })

      toast.success('Punched out successfully!')
      await loadTodayStatus()
      await loadAttendanceHistory()
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to punch out'
      toast.error(message)
    } finally {
      setPunching(false)
    }
  }

  const getAttendanceStatus = (row) => {
    if (!row.punch_in) return 'ABSENT'
    if (row.punch_in && !row.punch_out) return 'PRESENT'
    if (row.punch_in && row.punch_out) return 'PRESENT'
    return 'ABSENT'
  }

  const attendanceColumns = [
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => {
        const date = new Date(row.date)
        return format(date, 'MMM dd, yyyy')
      },
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
      <LocationPermissionPrompt
        visible={showLocationPrompt}
        onRequest={async () => {
          setShowLocationPrompt(false)
          try {
            await getCurrentLocation()
            toast.success('Location permission granted!')
          } catch (err) {
            toast.error('Please enable location in browser settings')
          }
        }}
        onDismiss={() => setShowLocationPrompt(false)}
      />
      <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PunchCard
          status={
            todayStatus?.punchedIn && !todayStatus?.punchOutTime 
              ? 'punched_in' 
              : 'not_punched_in'
          }
          punchInTime={todayStatus?.punchInTime}
          punchOutTime={todayStatus?.punchOutTime}
          onPunchIn={handlePunchIn}
          onPunchOut={handlePunchOut}
          loading={punching}
          locationValid={locationValid}
          wifiValid={wifiValid}
        />
        <LocationStatus
          location={location}
          error={locationError}
          loading={locationLoading}
          insideOffice={insideOffice !== null ? insideOffice : todayStatus?.insideOffice}
          lastHeartbeat={lastHeartbeat || todayStatus?.lastHeartbeat}
          punchedIn={isPunchedIn}
          onRequestLocation={getCurrentLocation}
        />
      </div>

      <Card
        title="Attendance History"
        headerAction={
          <div className="flex space-x-2">
            <Select
              name="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              options={months}
              className="w-32"
            />
            <Select
              name="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              options={years}
              className="w-32"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadTodayStatus()
                loadAttendanceHistory()
                checkLocation()
              }}
            >
              Refresh
            </Button>
          </div>
        }
      >
        <Table
          columns={attendanceColumns}
          data={attendanceHistory}
          loading={loading}
          emptyMessage="No attendance records found"
        />
      </Card>
    </div>
  )
}

export default Attendance

