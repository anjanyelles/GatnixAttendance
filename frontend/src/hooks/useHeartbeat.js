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
        setInsideOffice(response.data.insideOffice !== false)
        setLastHeartbeat(new Date())

        // Handle auto punch out
        if (response.data.autoPunchedOut) {
          if (onAutoPunchOut) {
            onAutoPunchOut(response.data.reason || 'AUTO')
          }
          
          if (response.data.reason === 'MAX_OUT_COUNT') {
            toast.warning('Auto punched out: Maximum OUT count (2) reached for today')
          } else if (response.data.reason === 'MAX_OUT_TIME') {
            toast.warning('Auto punched out: Total OUT time exceeds 240 minutes')
          } else {
            toast.warning('Auto punched out: You left the office')
          }
          
          stopHeartbeat()
        } else if (response.data.insideOffice === false) {
          toast.info('You are outside the office. OUT period started.')
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

