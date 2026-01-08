import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import Button from './Button'

const LocationPermissionPrompt = ({ onRequest, onDismiss, visible }) => {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Show modal if visible prop is true
    if (visible) {
      setShowModal(true)
    }
  }, [visible])

  const handleRequest = () => {
    setShowModal(false)
    if (onRequest) {
      onRequest()
    }
  }

  const handleDismiss = () => {
    setShowModal(false)
    if (onDismiss) {
      onDismiss()
    }
  }

  if (!showModal) return null

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const isHTTP = window.location.protocol === 'http:'
  const currentHost = window.location.host

  return (
    <Modal
      isOpen={showModal}
      onClose={handleDismiss}
      title="📍 Location Permission Required"
    >
      <div className="space-y-4">
        <p className="text-gray-700 text-sm md:text-base">
          This app needs your location to track attendance. Please allow location access when prompted.
        </p>
        
        <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
          <p className="text-xs md:text-sm font-medium text-blue-900 mb-2">📱 How to enable on mobile:</p>
          <div className="text-xs md:text-sm text-blue-800 space-y-2">
            {isHTTP && (
              <div className="bg-yellow-50 p-2 rounded mb-2">
                <p className="font-semibold text-yellow-900">⚠️ HTTP Connection Detected</p>
                <p className="text-yellow-800 text-xs mt-1">Location may be blocked on HTTP. Try these steps:</p>
            </div>
            )}
            
            <div>
              <p className="font-semibold">Android Chrome:</p>
              <ol className="list-decimal list-inside pl-2 space-y-1 text-xs">
                <li>Tap the lock/info icon in the address bar</li>
                <li>Select "Site settings"</li>
                <li>Tap "Location" → Select "Allow"</li>
                <li>Refresh the page</li>
              </ol>
            </div>
            
            <div>
              <p className="font-semibold">iOS Safari:</p>
              <ol className="list-decimal list-inside pl-2 space-y-1 text-xs">
                <li>Tap "Allow" when the browser prompts you</li>
                <li>Or go to: Settings → Safari → Location Services → Allow</li>
                <li>Refresh the page</li>
              </ol>
            </div>

            {isHTTP && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="font-semibold text-xs">Alternative (Advanced):</p>
                <p className="text-xs mt-1">Enable insecure origins in Chrome flags:</p>
                <p className="text-xs mt-1 break-all bg-blue-100 p-1 rounded font-mono">
                  chrome://flags → Search "Insecure origins" → Add: http://{currentHost}
                </p>
            </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={handleRequest}
            variant="success"
            className="flex-1 min-h-[44px]"
          >
            Try Again
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            className="flex-1 min-h-[44px]"
          >
            Later
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default LocationPermissionPrompt

