import { useState, useEffect } from 'react'

export const useLocation = (autoRequest = false) => {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLocationError = (error, isHTTP, isLocalhost, resolve, reject) => {
    let errorMessage = 'Failed to get location'
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        // Check if it's HTTP issue
        if (isHTTP && !isLocalhost) {
          errorMessage = 'Location permission denied. Please enable location access in your browser settings. On mobile: Settings → Site Settings → Location → Allow.'
        } else {
          errorMessage = 'Location permission denied. Please enable location access in your browser settings.'
        }
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information is unavailable. Please check your GPS/WiFi settings.'
        break
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Please try again.'
        break
      default:
        errorMessage = error.message || 'Failed to get location'
    }
    
    setError(errorMessage)
    setLoading(false)
    reject(errorMessage)
  }

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

      // For mobile browsers, optimize options for better accuracy and reliability
      const options = {
        enableHighAccuracy: true, // Use GPS if available (important for mobile)
        timeout: 30000, // Increased timeout for mobile (30 seconds)
        maximumAge: 60000, // Accept cached location up to 1 minute old (reduces battery drain)
      }

      const successCallback = (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }
          setLocation(locationData)
          setLoading(false)
        setError(null)
          resolve(locationData)
      }

      const errorCallback = (error) => {
        handleLocationError(error, isHTTP, isLocalhost, resolve, reject)
      }

      // Check permission status first (for better error handling)
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          if (result.state === 'denied') {
            const errorMsg = 'Location permission denied. Please enable location access in your browser settings.'
            setError(errorMsg)
            setLoading(false)
            reject(errorMsg)
            return
          }
          
          // Try to get location
          navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options)
        }).catch(() => {
          // Permissions API failed, try directly
          navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options)
        })
      } else {
        // Permissions API not supported, try directly
        navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options)
      }
    })
  }

  // Auto-request location on mount if autoRequest is true
  useEffect(() => {
    if (autoRequest && !location && !loading && !error) {
      // Delay to ensure component is mounted and page is fully loaded (important for mobile)
      // Mobile browsers need more time to initialize geolocation API
      const timer = setTimeout(() => {
        getCurrentLocation().catch(() => {
          // Error already handled in getCurrentLocation
        })
      }, 1000) // Increased delay for mobile browsers (1 second)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRequest]) // Only run when autoRequest changes

  const getClientIP = async () => {
    // Try multiple IP detection services for better reliability on mobile
    const ipServices = [
      'https://api.ipify.org?format=json',
      'https://api64.ipify.org?format=json',
      'https://ipapi.co/json/',
    ]
    
    for (const service of ipServices) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
        
        const response = await fetch(service, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const data = await response.json()
        
        // Handle different response formats
        if (data.ip) {
          return data.ip
        } else if (data.query) {
          return data.query
        } else if (typeof data === 'string') {
          return data.trim()
        }
      } catch (error) {
        console.warn(`IP service ${service} failed:`, error.message)
        // Try next service
        continue
      }
    }
    
    // All services failed
    console.error('Failed to get IP address from all services')
    return null
  }

  return {
    location,
    error,
    loading,
    getCurrentLocation,
    getClientIP,
  }
}

