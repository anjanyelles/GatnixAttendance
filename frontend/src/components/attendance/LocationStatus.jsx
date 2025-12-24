import React from 'react'
import Card from '../common/Card'

const LocationStatus = ({ location, error, loading }) => {
  return (
    <Card title="Location Status">
      <div className="space-y-2">
        {loading && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            <span className="text-sm text-gray-600">Getting location...</span>
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}
        {location && !error && (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-sm text-gray-700">Location obtained</span>
            </div>
            <div className="text-sm text-gray-600 pl-6">
              <p>Latitude: {location.latitude.toFixed(6)}</p>
              <p>Longitude: {location.longitude.toFixed(6)}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export default LocationStatus

