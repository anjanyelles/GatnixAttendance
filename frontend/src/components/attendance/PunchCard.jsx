import React from 'react'
import Button from '../common/Button'
import Card from '../common/Card'

const PunchCard = ({ 
  status, 
  punchInTime, 
  punchOutTime, 
  insideOffice,
  outCount = 0,
  totalOutTimeHours = 0,
  netWorkingHours = 0,
  onPunchIn, 
  onPunchOut, 
  loading, 
  locationValid, 
  wifiValid 
}) => {
  const canPunch = locationValid && wifiValid
  const isPunchedIn = status === 'punched_in' || !!punchInTime
  const isPunchedOut = !!punchOutTime
  const presenceStatus = insideOffice === true ? 'In Office' : insideOffice === false ? 'Out of Office' : 'Unknown'

  return (
    <Card title="Current Status">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600">Today's Status</p>
            <p className="text-2xl font-bold text-gray-900">
              {isPunchedOut ? 'Punched Out' : isPunchedIn ? 'Punched In' : 'Not Punched In'}
            </p>
            {isPunchedIn && !isPunchedOut && (
              <p className={`text-sm font-medium mt-1 ${insideOffice ? 'text-green-600' : 'text-orange-600'}`}>
                {presenceStatus}
              </p>
            )}
            {punchInTime && (
              <p className="text-sm text-gray-500 mt-1">
                Punch In: {new Date(punchInTime).toLocaleTimeString()}
              </p>
            )}
            {punchOutTime && (
              <p className="text-sm text-gray-500 mt-1">
                Punch Out: {new Date(punchOutTime).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Display tracking info if punched in */}
        {isPunchedIn && (
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Times Gone Out:</span>
              <span className="font-semibold">{outCount}</span>
            </div>
            {outCount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Out Duration:</span>
                <span className="font-semibold">{totalOutTimeHours.toFixed(2)} hrs</span>
              </div>
            )}
            {isPunchedOut && (
              <div className="flex justify-between text-sm border-t pt-2 mt-2">
                <span className="text-gray-600">Net Working Hours:</span>
                <span className="font-bold text-primary-600">{netWorkingHours.toFixed(2)} hrs</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={locationValid ? 'text-green-600' : 'text-red-600'}>
                {locationValid ? '✓' : '✗'}
              </span>
              <span className="text-sm">Location Valid (within radius)</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={wifiValid ? 'text-green-600' : 'text-red-600'}>
                {wifiValid ? '✓' : '✗'}
              </span>
              <span className="text-sm">Wi-Fi Valid (office IP)</span>
            </div>
          </div>
        </div>

        <div className="pt-4">
          {isPunchedOut ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">You have already punched out for today</p>
              <Button
                disabled={true}
                variant="secondary"
                className="w-full"
              >
                Already Punched Out
              </Button>
            </div>
          ) : isPunchedIn ? (
            <Button
              onClick={onPunchOut}
              disabled={!canPunch || loading || isPunchedOut}
              loading={loading}
              variant="danger"
              className="w-full"
            >
              Punch Out
            </Button>
          ) : (
            <Button
              onClick={onPunchIn}
              disabled={!canPunch || loading}
              loading={loading}
              variant="success"
              className="w-full"
            >
              Punch In
            </Button>
          )}
          {!canPunch && !isPunchedOut && (
            <p className="text-sm text-red-600 mt-2 text-center">
              Please ensure location and Wi-Fi are valid
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

export default PunchCard

