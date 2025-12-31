import { useState, useEffect } from 'react'

export const useLocation = (autoRequest = false) => {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errorMsg = 'Geolocation is not supported by your browser'
        setError(errorMsg)
        reject(errorMsg)
        return
      }

      // Check if we're on HTTP (not secure)
      const isHTTP = window.location.protocol === 'http:'
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      
      // Warn about HTTP issue
      if (isHTTP && !isLocalhost) {
        console.warn('⚠️ Location may not work on HTTP. Chrome blocks geolocation on HTTP. Use HTTPS or enable insecure origins in Chrome flags.')
      }

      setLoading(true)
      setError(null)

      // For mobile browsers, use watchPosition first to trigger permission, then getCurrentPosition
      const options = {
        enableHighAccuracy: true,
        timeout: 20000, // Increased timeout for mobile
        maximumAge: 0,
      }

      // Try to get location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }
          setLocation(locationData)
          setLoading(false)
          resolve(locationData)
        },
        (error) => {
          let errorMessage = 'Failed to get location'
          let isHTTPIssue = false
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              // Check if it's HTTP issue
              if (isHTTP && !isLocalhost) {
                errorMessage = 'Location blocked: Using HTTP (not secure). Chrome blocks geolocation on HTTP. Enable insecure origins in Chrome flags (chrome://flags) or use HTTPS.'
                isHTTPIssue = true
              } else {
                errorMessage = 'Location permission denied. Please enable location access in browser settings.'
              }
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please check your GPS/WiFi.'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.'
              break
            default:
              errorMessage = error.message || 'Failed to get location'
          }
          
          // Add HTTP-specific help
          if (isHTTPIssue) {
            errorMessage += '\n\nFix: Open chrome://flags → Search "Insecure origins" → Add: http://192.168.1.223:5173'
          }
          
          setError(errorMessage)
          setLoading(false)
          reject(errorMessage)
        },
        options
      )
    })
  }

  // Auto-request location on mount if autoRequest is true
  useEffect(() => {
    if (autoRequest && !location && !loading && !error) {
      // Small delay to ensure component is mounted (important for mobile)
      const timer = setTimeout(() => {
        getCurrentLocation().catch(() => {
          // Error already handled in getCurrentLocation
        })
      }, 500) // Increased delay for mobile browsers
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRequest]) // Only run when autoRequest changes

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch (error) {
      console.error('Failed to get IP address:', error)
      return null
    }
  }

  return {
    location,
    error,
    loading,
    getCurrentLocation,
    getClientIP,
  }
}

