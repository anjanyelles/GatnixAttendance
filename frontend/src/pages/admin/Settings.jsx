import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { toast } from 'react-toastify'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useLocation } from '../../hooks/useLocation'
import Holidays from './Holidays'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('location')
  const { getCurrentLocation } = useLocation()
  const [settings, setSettings] = useState({
    officeLatitude: '',
    officeLongitude: '',
    radius: 50,
    officePublicIP: '',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getSettings()
      const settingsData = response.data.settings || response.data || {}
      setSettings({
        officeLatitude: settingsData.latitude?.toString() || '',
        officeLongitude: settingsData.longitude?.toString() || '',
        radius: settingsData.radius_meters || 50,
        officePublicIP: settingsData.office_public_ip || '',
      })
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!settings.officePublicIP || !ipRegex.test(settings.officePublicIP)) {
      toast.error('Please enter a valid IP address')
      return
    }
    
    // Validate IP octets
    const ipParts = settings.officePublicIP.split('.')
    const isValidIP = ipParts.every(part => {
      const num = parseInt(part, 10)
      return num >= 0 && num <= 255
    })
    
    if (!isValidIP) {
      toast.error('IP address octets must be between 0 and 255')
      return
    }
    
    try {
      setSaving(true)
      await adminAPI.updateSettings({
        latitude: parseFloat(settings.officeLatitude),
        longitude: parseFloat(settings.officeLongitude),
        radiusMeters: parseInt(settings.radius),
        officePublicIp: settings.officePublicIP,
      })
      toast.success('Settings saved successfully!')
      // Reload settings to show updated values
      await loadSettings()
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save settings'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleGetCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation()
      setSettings({
        ...settings,
        officeLatitude: location.latitude.toString(),
        officeLongitude: location.longitude.toString(),
      })
      toast.success('Current location captured!')
    } catch (error) {
      toast.error('Failed to get current location')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Office Settings</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('location')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'location'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Location Settings
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'holidays'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Holidays
          </button>
        </nav>
      </div>

      {activeTab === 'location' && (
        <>
      <Card title="Location Configuration">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Office Latitude"
              type="number"
              step="any"
              name="officeLatitude"
              value={settings.officeLatitude}
              onChange={(e) => setSettings({ ...settings, officeLatitude: e.target.value })}
              required
            />
            <Input
              label="Office Longitude"
              type="number"
              step="any"
              name="officeLongitude"
              value={settings.officeLongitude}
              onChange={(e) => setSettings({ ...settings, officeLongitude: e.target.value })}
              required
            />
          </div>

          <div className="flex items-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleGetCurrentLocation}
            >
              Use Current Location
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSettings({
                  ...settings,
                  officeLatitude: '17.489313654492967',
                  officeLongitude: '78.39285505628658',
                  radius: 60,
                })
                toast.info('Office location pre-filled: Collabra Technologies, KPHB Colony')
              }}
            >
              Use Office Location
            </Button>
          </div>

          <Input
            label="Radius (meters)"
            type="number"
            name="radius"
            value={settings.radius}
            onChange={(e) => setSettings({ ...settings, radius: parseInt(e.target.value) })}
            required
            min={1}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="officePublicIP" className="block text-sm font-medium text-gray-700">
                Office Public IP <span className="text-red-500">*</span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch('https://api.ipify.org?format=json')
                    const data = await response.json()
                    setSettings({ ...settings, officePublicIP: data.ip })
                    toast.success(`Current IP captured: ${data.ip}`)
                  } catch (error) {
                    toast.error('Failed to get current IP address')
                  }
                }}
              >
                Get Current IP
              </Button>
            </div>
            <input
              id="officePublicIP"
              type="text"
              name="officePublicIP"
              value={settings.officePublicIP}
              onChange={(e) => setSettings({ ...settings, officePublicIP: e.target.value })}
              placeholder="e.g., 103.21.124.56"
              required
              pattern="^(\d{1,3}\.){3}\d{1,3}$"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                settings.officePublicIP && !/^(\d{1,3}\.){3}\d{1,3}$/.test(settings.officePublicIP)
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
            />
            {settings.officePublicIP && !/^(\d{1,3}\.){3}\d{1,3}$/.test(settings.officePublicIP) && (
              <p className="mt-1 text-sm text-red-600">Please enter a valid IP address (e.g., 103.21.124.56)</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              This IP will be used to validate employee Wi-Fi connections. Employees must be on the same network.
            </p>
          </div>

          <div className="pt-4">
            <Button type="submit" variant="primary" loading={saving} className="w-full">
              Save Settings
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Current Settings">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">Office Location:</span>
            <span className="text-gray-900">
              {settings.officeLatitude && settings.officeLongitude
                ? `${settings.officeLatitude}, ${settings.officeLongitude}`
                : 'Not set'}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">Allowed Radius:</span>
            <span className="text-gray-900">{settings.radius} meters</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">Office Public IP:</span>
            <span className={`font-mono ${settings.officePublicIP ? 'text-green-600' : 'text-red-600'}`}>
              {settings.officePublicIP || 'Not set'}
            </span>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Employees must be within <strong>{settings.radius} meters</strong> of the office 
              location and connected to the office Wi-Fi (IP: <strong>{settings.officePublicIP || 'Not configured'}</strong>) 
              to punch in/out.
            </p>
          </div>
        </div>
      </Card>
        </>
      )}

      {activeTab === 'holidays' && <Holidays />}
    </div>
  )
}

export default Settings

