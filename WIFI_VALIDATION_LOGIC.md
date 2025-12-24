# Wi-Fi Validation Logic - Complete Flow

## Overview

The "Wi-Fi Valid" check is actually **IP Address validation**. It checks if the employee's public IP address matches the office's public IP address.

## Flow Diagram

```
Employee Browser
    ↓
1. Get Public IP (Frontend)
    ↓
2. Send IP to Backend
    ↓
3. Compare with Office IP (Backend)
    ↓
4. Return Validation Result
    ↓
5. Update Wi-Fi Status (Frontend)
```

## Code Locations

### 1. Frontend: Get IP Address

**File**: `frontend/src/hooks/useLocation.js`

```javascript
const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip  // Returns employee's public IP
  } catch (error) {
    console.error('Failed to get IP address:', error)
    return null
  }
}
```

**What it does**: Gets the employee's public IP address from `api.ipify.org`

---

### 2. Frontend: Validate Location & IP

**File**: `frontend/src/pages/Attendance.jsx` (lines 35-65)

```javascript
const checkLocation = async () => {
  try {
    const locationData = await getCurrentLocation()
    const ipAddress = await getClientIP()  // Get employee's IP
    
    // Validate location and IP with backend
    const validation = await attendanceAPI.validateLocation({
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      ipAddress,  // Send IP to backend
    })
    
    if (validation.data.success) {
      setLocationValid(true)
      setWifiValid(true)  // ✅ Wi-Fi is valid
    } else {
      setLocationValid(false)
      setWifiValid(false)  // ❌ Wi-Fi is invalid
    }
  } catch (error) {
    setLocationValid(false)
    setWifiValid(false)
  }
}
```

**What it does**: 
- Gets employee's IP address
- Sends it to backend for validation
- Sets `wifiValid` state based on backend response

---

### 3. Backend: IP Validation Logic

**File**: `backend/src/controllers/attendanceController.js` (lines 29-69)

```javascript
const validateLocationAndIP = async (latitude, longitude, ipAddress) => {
  const settings = await getOfficeSettings();  // Get office settings from DB
  
  // ... location validation ...
  
  // Check IP match - THIS IS THE Wi-Fi VALIDATION
  if (ipAddress !== settings.office_public_ip) {
    return { 
      valid: false, 
      error: `Not connected to office Wi-Fi. Your IP: ${ipAddress}, Office IP: ${settings.office_public_ip}`,
      distance: distance.toFixed(2),
    };
  }
  
  return { valid: true, distance: distance.toFixed(2) };
};
```

**What it does**:
- Gets office IP from database: `103.21.124.56`
- Compares employee IP with office IP
- Returns error if they don't match

---

### 4. Backend: Get Office Settings

**File**: `backend/src/controllers/attendanceController.js` (lines 8-24)

```javascript
const getOfficeSettings = async () => {
  const result = await pool.query(
    'SELECT latitude, longitude, radius_meters, office_public_ip FROM office_settings ORDER BY id DESC LIMIT 1'
  );
  
  if (result.rows.length === 0) {
    // Return defaults if no settings exist
    return {
      latitude: '17.489313654492967',
      longitude: '78.39285505628658',
      radius_meters: 50,
      office_public_ip: '103.206.104.149',  // Default office IP
    };
  }
  
  return result.rows[0];  // Returns: { office_public_ip: '103.21.124.56', ... }
};
```

**What it does**: Retrieves office IP from database (currently: `103.21.124.56`)

---

### 5. Frontend: Display Wi-Fi Status

**File**: `frontend/src/components/attendance/PunchCard.jsx` (lines 32-37)

```javascript
<div className="flex items-center space-x-2">
  <span className={wifiValid ? 'text-green-600' : 'text-red-600'}>
    {wifiValid ? '✓' : '✗'}
  </span>
  <span className="text-sm">Wi-Fi Valid</span>
</div>
```

**What it does**: Shows green ✓ if `wifiValid` is true, red ✗ if false

---

## Current Office Settings

From your database:
- **Office IP**: `103.21.124.56`
- **Office Location**: `17.489314, 78.392855`
- **Radius**: `60 meters`

## How Wi-Fi Validation Works

### Step-by-Step:

1. **Employee opens Attendance page**
   - Frontend calls `getClientIP()`
   - Gets employee's public IP (e.g., `103.21.124.56`)

2. **Frontend sends to backend**
   ```json
   POST /api/attendance/validate-location
   {
     "latitude": 17.489314,
     "longitude": 78.392855,
     "ipAddress": "103.21.124.56"  // Employee's IP
   }
   ```

3. **Backend compares IPs**
   ```javascript
   if (ipAddress !== settings.office_public_ip) {
     // Employee IP: "103.21.124.56"
     // Office IP: "103.21.124.56"
     // Match? ✅ YES → Wi-Fi Valid
   }
   ```

4. **Backend returns result**
   ```json
   {
     "success": true,
     "valid": true,
     "message": "Location validated successfully..."
   }
   ```

5. **Frontend updates status**
   ```javascript
   setWifiValid(true)  // Shows green ✓
   ```

## Why It's Called "Wi-Fi Validation"

Even though it's IP-based, it's called "Wi-Fi validation" because:
- Employees on office Wi-Fi will have the same public IP
- Employees on different networks will have different IPs
- This ensures employees are physically at the office (on office network)

## Important Notes

### ⚠️ IP Address Limitations

1. **Public IP vs Private IP**
   - The system uses **public IP** (from `api.ipify.org`)
   - All devices on the same office network share the same public IP
   - This is why it works for Wi-Fi validation

2. **Dynamic IPs**
   - Office IP might change if router restarts
   - Update office IP in admin settings if it changes

3. **Mobile Networks**
   - Employees on mobile data will have different IP
   - They won't be able to punch in (by design)

4. **VPN/Proxy**
   - If employee uses VPN, IP will be different
   - They won't be able to punch in (by design)

## Testing Wi-Fi Validation

### Test Case 1: Correct IP ✅
```json
POST /api/attendance/validate-location
{
  "ipAddress": "103.21.124.56"  // Matches office IP
}
```
**Result**: ✅ Wi-Fi Valid

### Test Case 2: Wrong IP ❌
```json
POST /api/attendance/validate-location
{
  "ipAddress": "192.168.1.100"  // Different IP
}
```
**Result**: ❌ Wi-Fi Invalid - "Not connected to office Wi-Fi. Your IP: 192.168.1.100, Office IP: 103.21.124.56"

## Summary

**Wi-Fi Validation = IP Address Matching**

- **Frontend**: Gets employee's public IP → `frontend/src/hooks/useLocation.js`
- **Frontend**: Sends IP to backend → `frontend/src/pages/Attendance.jsx`
- **Backend**: Compares with office IP → `backend/src/controllers/attendanceController.js` (line 60)
- **Backend**: Returns validation result
- **Frontend**: Updates Wi-Fi status → `frontend/src/components/attendance/PunchCard.jsx`

The validation happens in **`backend/src/controllers/attendanceController.js`** in the `validateLocationAndIP()` function at **line 60**.

