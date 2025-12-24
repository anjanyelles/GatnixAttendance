# Location Validation Test Guide

## ✅ Office Settings Updated

Your office settings are now configured:
- **Latitude**: `17.489314`
- **Longitude**: `78.392855`
- **Radius**: `60 meters`
- **IP Address**: `103.21.124.56`

## Backend Validation Flow

When an employee/manager clicks "Punch In", the backend validates:

### 1. **Location Validation** (Distance Check)
- Calculates distance from employee location to office using Haversine formula
- Office location: `17.489314, 78.392855`
- Must be within **60 meters** of office
- ✅ **PASS**: If distance ≤ 60 meters
- ❌ **FAIL**: If distance > 60 meters → Error: "Location is X.XX meters away. Must be within 60 meters."

### 2. **IP Address Validation** (Wi-Fi Check)
- Compares employee's IP address with office IP
- Office IP: `103.21.124.56`
- ✅ **PASS**: If IP matches exactly
- ❌ **FAIL**: If IP doesn't match → Error: "Not connected to office Wi-Fi. Your IP: X.X.X.X, Office IP: 103.21.124.56"

### 3. **Both Must Pass**
- Both location (within 60m) AND IP match must be true
- If either fails, punch-in is rejected

## New Features Added

### 1. Pre-Validation Endpoint
**POST** `/api/attendance/validate-location`

This endpoint validates location before punch-in, so employees can see if they're in range.

**Request:**
```json
{
  "latitude": 17.489314,
  "longitude": 78.392855,
  "ipAddress": "103.21.124.56"
}
```

**Success Response:**
```json
{
  "success": true,
  "valid": true,
  "message": "Location validated successfully. Distance: 0.00 meters from office.",
  "distance": "0.00",
  "officeLocation": {
    "latitude": "17.48931400",
    "longitude": "78.39285500",
    "radius": 60
  },
  "employeeLocation": {
    "latitude": 17.489314,
    "longitude": 78.392855
  }
}
```

**Failure Response:**
```json
{
  "success": false,
  "valid": false,
  "message": "Location is 150.25 meters away from office. Must be within 60 meters.",
  "distance": "150.25",
  "officeLocation": {
    "latitude": "17.48931400",
    "longitude": "78.39285500",
    "radius": 60
  },
  "employeeLocation": {
    "latitude": 17.490000,
    "longitude": 78.393000
  }
}
```

### 2. Improved Error Messages
- Now shows exact distance from office
- Shows both employee IP and office IP when IP doesn't match
- More descriptive error messages

### 3. Frontend Pre-Validation
- Frontend now validates location when page loads
- Shows real-time validation status
- Displays distance from office

## Testing Punch-In

### Test Case 1: Valid Location & IP ✅
```json
POST /api/attendance/punch-in
{
  "latitude": 17.489314,
  "longitude": 78.392855,
  "ipAddress": "103.21.124.56"
}
```
**Expected**: ✅ Success - "Punched in successfully"

### Test Case 2: Valid Location, Wrong IP ❌
```json
POST /api/attendance/punch-in
{
  "latitude": 17.489314,
  "longitude": 78.392855,
  "ipAddress": "192.168.1.100"
}
```
**Expected**: ❌ Error - "Not connected to office Wi-Fi. Your IP: 192.168.1.100, Office IP: 103.21.124.56"

### Test Case 3: Wrong Location, Valid IP ❌
```json
POST /api/attendance/punch-in
{
  "latitude": 17.500000,
  "longitude": 78.400000,
  "ipAddress": "103.21.124.56"
}
```
**Expected**: ❌ Error - "Location is X.XX meters away from office. Must be within 60 meters."

### Test Case 4: Both Wrong ❌
```json
POST /api/attendance/punch-in
{
  "latitude": 17.500000,
  "longitude": 78.400000,
  "ipAddress": "192.168.1.100"
}
```
**Expected**: ❌ Error - Location error (checked first)

## Frontend Behavior

1. **Page Load**: Automatically validates location
2. **Location Valid ✓**: Green checkmark if within 60 meters
3. **Wi-Fi Valid ✓**: Green checkmark if IP matches
4. **Punch In Button**: Enabled only if both are valid
5. **Real-time Feedback**: Shows distance from office

## Verification Steps

1. ✅ Office settings saved: `17.489314, 78.392855`, radius `60m`, IP `103.21.124.56`
2. ✅ Employee at office location with correct IP → Should punch in successfully
3. ✅ Employee at office location with wrong IP → Should show IP error
4. ✅ Employee far from office → Should show distance error
5. ✅ Frontend shows validation status correctly

## Notes

- **IP Address**: Must match exactly. If employees are on different networks, update IP in admin settings.
- **Distance**: Uses Haversine formula (accurate for short distances)
- **GPS Accuracy**: Mobile GPS is typically 5-10 meters accurate, so 60m radius provides good buffer
- **Validation Order**: Location distance is checked first, then IP address

All validation is working correctly! 🎉

