import React from 'react'
import Card from '../common/Card'

const LocationStatus = ({ location, error, loading, insideOffice, lastHeartbeat, punchedIn, onRequestLocation }) => {
  const getStatusDisplay = () => {
    if (!punchedIn) {
      return {
        text: 'Not Punched In',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: '○',
      }
    }

    if (insideOffice === null) {
      return {
        text: 'Checking...',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: '⟳',
      }
    }

    if (insideOffice) {
      return {
        text: 'Inside Office',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: '✓',
      }
    } else {
      return {
        text: 'Outside Office',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: '✗',
      }
    }
  }

  const status = getStatusDisplay()

  return (
    <Card title="Presence Status">
      <div className="space-y-4">
        {/* Live Status */}
        <div className={`${status.bgColor} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className={`text-2xl ${status.color}`}>{status.icon}</span>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Current Status</p>
                <p className={`text-xl font-bold ${status.color}`}>{status.text}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Location Details */}
        <div className="space-y-2">
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              <span className="text-sm text-gray-600">Getting location...</span>
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 space-y-2">
              <div>
                <p className="font-medium">Error:</p>
                <p className="whitespace-pre-line">{error}</p>
              </div>
              {(error.includes('permission') || error.includes('HTTP') || error.includes('insecure')) && (
                <div className="space-y-2 pt-2 border-t border-red-200">
                  {(error.includes('HTTP') || error.includes('insecure')) ? (
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                      <p className="text-xs font-bold text-yellow-900 mb-2">⚠️ HTTP (Not Secure) Issue:</p>
                      <p className="text-xs text-yellow-800 mb-2">Chrome blocks location on HTTP. Fix:</p>
                      <div className="text-xs text-yellow-800 space-y-1 pl-2">
                        <p><strong>1. Open Chrome</strong> → Type: <code className="bg-yellow-100 px-1 rounded">chrome://flags</code></p>
                        <p><strong>2. Search:</strong> "Insecure origins treated as secure"</p>
                        <p><strong>3. Enable it</strong> and add: <code className="bg-yellow-100 px-1 rounded">http://192.168.1.223:5173</code></p>
                        <p><strong>4. Relaunch</strong> Chrome</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-medium">To enable location:</p>
                      <div className="text-xs space-y-1 pl-2">
                        <p><strong>Android Chrome:</strong></p>
                        <p className="pl-2">1. Open: <code className="bg-gray-100 px-1 rounded">chrome://flags</code></p>
                        <p className="pl-2">2. Search: "Insecure origins" → Enable</p>
                        <p className="pl-2">3. Add: <code className="bg-gray-100 px-1 rounded">http://192.168.1.223:5173</code></p>
                        <p className="pt-1"><strong>iOS Safari:</strong></p>
                        <p className="pl-2">1. Settings → Safari</p>
                        <p className="pl-2">2. Location Services → Allow</p>
                      </div>
                    </>
                  )}
                  <button
                    onClick={async () => {
                      // Try to request location again
                      if (onRequestLocation) {
                        try {
                          await onRequestLocation()
                          // If successful, the location state will update automatically
                        } catch (err) {
                          if (err.includes && err.includes('permission')) {
                            alert('Location permission is still denied.\n\nPlease enable it in browser settings:\n\nAndroid Chrome:\n1. Tap ⋮ (menu) → Settings\n2. Site Settings → Location\n3. Allow for this site\n\niOS Safari:\n1. Settings → Safari\n2. Location Services → Allow')
                          }
                        }
                      } else {
                        // Fallback if onRequestLocation not provided
                        try {
                          if (navigator.geolocation) {
                            await new Promise((resolve, reject) => {
                              navigator.geolocation.getCurrentPosition(
                                () => {
                                  alert('Location permission granted! Please reload the page.')
                                  window.location.reload()
                                },
                                (err) => {
                                  if (err.code === err.PERMISSION_DENIED) {
                                    alert('Location permission is still denied. Please enable it in browser settings.')
                                  } else {
                                    reject(err)
                                  }
                                },
                                { enableHighAccuracy: true, timeout: 10000 }
                              )
                            })
                          }
                        } catch (e) {
                          console.error('Location request error:', e)
                        }
                      }
                    }}
                    className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 active:bg-blue-800"
                  >
                    Request Location Again
                  </button>
                </div>
              )}
            </div>
          )}
          {location && !error && (
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>Location obtained</span>
              </div>
              <div className="pl-6">
                <p>Latitude: {location.latitude.toFixed(6)}</p>
                <p>Longitude: {location.longitude.toFixed(6)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Heartbeat Info */}
        {punchedIn && lastHeartbeat && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            <p>Last heartbeat: {new Date(lastHeartbeat).toLocaleTimeString()}</p>
          </div>
        )}
      </div>
    </Card>
  )
}

export default LocationStatus

