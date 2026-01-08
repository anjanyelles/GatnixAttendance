import { useEffect, useRef, useState } from 'react'
import { attendanceAPI } from '../services/api'
import { useLocation } from './useLocation'
import { toast } from 'react-toastify'

/**
 * Hook to manage heartbeat and presence monitoring
 * Sends heartbeat every 1-2 minutes when user is punched in
 */
export const useHeartbeat = (isPunchedIn, onAutoPunchOut) => {
  const { getCurrentLocation, getClientIP } = useLocation()
  const [insideOffice, setInsideOffice] = useState(null)
  const [lastHeartbeat, setLastHeartbeat] = useState(null)
  const heartbeatIntervalRef = useRef(null)
  const isActiveRef = useRef(false)

  const sendHeartbeat = async () => {
    try {
      const locationData = await getCurrentLocation()
      const ipAddress = await getClientIP()

      if (!locationData || !ipAddress) {
        console.warn('Heartbeat: Failed to get location or IP')
        return
      }

      const response = await attendanceAPI.sendHeartbeat({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        ipAddress,
      })

      if (response.data) {
        const isInside = response.data.insideOffice !== false
        setInsideOffice(isInside)
        setLastHeartbeat(new Date())

        // Update status based on presence (no auto punch out)
        if (response.data.status === 'OUT_OF_OFFICE' && isInside === false) {
          // Just went out - show info toast
          if (response.data.outTime) {
            toast.info('Marked as OUT OF OFFICE')
          }
        } else if (response.data.status === 'INSIDE_OFFICE' && isInside === true) {
          // Just came back in
          if (response.data.inTime) {
            toast.success(`Back IN OFFICE (Out duration: ${response.data.outDurationMinutes || 0} min)`)
          }
        }
      }
    } catch (error) {
      console.error('Heartbeat error:', error)
      // Don't show error toast for heartbeat failures to avoid spam
    }
  }

  const startHeartbeat = () => {
    if (isActiveRef.current) {
      return
    }

    isActiveRef.current = true
    
    // Send initial heartbeat immediately
    sendHeartbeat()

    // Send heartbeat every 1-2 minutes (randomized between 60-120 seconds)
    const getNextInterval = () => {
      return 60000 + Math.random() * 60000 // 60-120 seconds
    }

    const scheduleNext = () => {
      if (!isActiveRef.current) {
        return
      }

      const nextInterval = getNextInterval()
      heartbeatIntervalRef.current = setTimeout(() => {
        if (isActiveRef.current) {
          sendHeartbeat()
          scheduleNext()
        }
      }, nextInterval)
    }

    scheduleNext()
  }

  const stopHeartbeat = () => {
    isActiveRef.current = false
    if (heartbeatIntervalRef.current) {
      clearTimeout(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }

  useEffect(() => {
    if (isPunchedIn) {
      startHeartbeat()
    } else {
      stopHeartbeat()
      setInsideOffice(null)
      setLastHeartbeat(null)
    }

    return () => {
      stopHeartbeat()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPunchedIn])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat()
    }
  }, [])

  return {
    insideOffice,
    lastHeartbeat,
    sendHeartbeat, // Manual trigger if needed
  }
}

