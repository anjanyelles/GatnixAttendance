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

  return (
    <Modal
      isOpen={showModal}
      onClose={handleDismiss}
      title="Location Permission Required"
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          This app needs your location to track attendance. Please allow location access when prompted.
        </p>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-2">How to enable:</p>
          <div className="text-sm text-blue-800 space-y-2">
            <div>
              <p><strong>⚠️ HTTP (Not Secure) Issue:</strong></p>
              <p className="pl-2 text-xs">Chrome blocks location on HTTP. Enable insecure origins:</p>
            </div>
            <div>
              <p><strong>Android Chrome (HTTP Fix):</strong></p>
              <p className="pl-2">1. Open: <code className="bg-blue-100 px-1 rounded">chrome://flags</code></p>
              <p className="pl-2">2. Search: "Insecure origins treated as secure"</p>
              <p className="pl-2">3. Add: <code className="bg-blue-100 px-1 rounded">http://192.168.1.223:5173</code></p>
              <p className="pl-2">4. Reload Chrome</p>
            </div>
            <div>
              <p><strong>Or via Site Settings:</strong></p>
              <p className="pl-2">1. Tap lock icon in address bar</p>
              <p className="pl-2">2. Site Settings → Location → Allow</p>
            </div>
            <div>
              <p><strong>iOS Safari:</strong></p>
              <p className="pl-2">1. Tap "Allow" when prompted</p>
              <p className="pl-2">2. Or: Settings → Safari → Location Services</p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={handleRequest}
            variant="success"
            className="flex-1"
          >
            Enable Location
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            className="flex-1"
          >
            Later
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default LocationPermissionPrompt

