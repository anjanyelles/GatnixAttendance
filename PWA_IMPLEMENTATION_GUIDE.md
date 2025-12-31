# PWA Implementation Guide - Gatnix Attendance System

## Overview
This document provides a complete guide for the PWA (Progressive Web App) enhancement of the Gatnix Attendance System with automatic geofencing, heartbeat monitoring, and presence tracking.

## Features Implemented

### 1. PWA (Progressive Web App)
- ✅ Manifest.json for app-like installation
- ✅ Service Worker for offline support and caching
- ✅ Installable on mobile and desktop browsers
- ✅ App-like experience with standalone display mode

### 2. Geofencing & IP Validation
- ✅ Punch IN only allowed when:
  - User is within 50m of office location (geofence)
  - User is connected to office IP range
- ✅ Both conditions must be met for punch in

### 3. Automatic Presence Monitoring
- ✅ Heartbeat sent every 1-2 minutes (randomized)
- ✅ Automatic OUT period tracking when user leaves office
- ✅ Auto Punch OUT when:
  - User leaves geofence (>50m) OR IP changes
  - No heartbeat received for >10 minutes
  - Maximum OUT count (2) reached
  - Total OUT time exceeds 240 minutes

### 4. OUT Time & Count Tracking
- ✅ Tracks total OUT time per day
- ✅ Tracks OUT count per day
- ✅ Rules enforced:
  - Max 2 OUT periods per day
  - Max 60 minutes total OUT time (warning threshold)
  - >120 minutes = Half Day
  - >240 minutes = Absent (auto punch out)

### 5. Live Status Display
- ✅ Shows "Inside Office" / "Outside Office" status
- ✅ Real-time updates via heartbeat
- ✅ Backend determines attendance status

## Database Schema Updates

### New Columns in `attendance` table:
- `last_heartbeat` (TIMESTAMP) - Last heartbeat received
- `total_out_time_minutes` (INTEGER) - Total time spent outside office
- `out_count` (INTEGER) - Number of OUT periods today
- `status` (VARCHAR) - Calculated status: PRESENT, HALF_DAY, ABSENT, INCOMPLETE
- `is_auto_punched_out` (BOOLEAN) - Flag for auto punch out

### New Table: `attendance_out_periods`
Tracks individual OUT periods:
- `attendance_id` - Reference to attendance record
- `out_time` - When user left office
- `in_time` - When user returned (NULL if still out)
- `duration_minutes` - Calculated duration
- `reason` - AUTO, MANUAL, HEARTBEAT_TIMEOUT, GEO_FENCE_EXIT, IP_CHANGE

## Setup Instructions

### Step 1: Database Migration

Run the database migration script to add new columns and tables:

```bash
cd backend
psql -U your_username -d your_database -f src/config/pwa-schema-update.sql
```

Or using Node.js:
```bash
cd backend
node -e "const pool = require('./src/config/database'); const fs = require('fs'); const sql = fs.readFileSync('./src/config/pwa-schema-update.sql', 'utf8'); pool.query(sql).then(() => { console.log('Migration completed'); process.exit(0); }).catch(err => { console.error(err); process.exit(1); });"
```

### Step 2: Install Frontend Dependencies

The frontend uses standard React dependencies. No additional packages needed for PWA (using native Service Worker API).

### Step 3: Create PWA Icons

Create two icon files in `frontend/public/`:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

You can use any image editor or online tool to create these icons.

### Step 4: Start Backend Server

```bash
cd backend
npm install  # If not already done
npm start    # or npm run dev for development
```

The server will automatically start the heartbeat timeout checker (runs every 5 minutes).

### Step 5: Start Frontend

```bash
cd frontend
npm install  # If not already done
npm run dev   # Development server
# or
npm run build && npm run preview  # Production build
```

### Step 6: Install as PWA

1. Open the app in a browser (Chrome, Edge, Safari, Firefox)
2. Look for the install prompt or:
   - **Chrome/Edge**: Click the install icon in address bar
   - **Safari (iOS)**: Tap Share → Add to Home Screen
   - **Firefox**: Menu → Install
3. The app will install and work like a native app

## API Endpoints

### New Endpoints

#### POST `/api/attendance/heartbeat`
Send heartbeat for presence monitoring.

**Request Body:**
```json
{
  "latitude": 17.489313,
  "longitude": 78.392855,
  "ipAddress": "103.206.104.149"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Heartbeat received - Inside office",
  "insideOffice": true,
  "punchedIn": true,
  "locationValid": true,
  "wifiValid": true
}
```

**Auto Punch Out Response:**
```json
{
  "success": true,
  "message": "Auto punched out: Maximum OUT count reached",
  "punchedIn": false,
  "autoPunchedOut": true,
  "reason": "MAX_OUT_COUNT"
}
```

#### GET `/api/attendance/presence`
Get current presence status.

**Response:**
```json
{
  "success": true,
  "punchedIn": true,
  "insideOffice": true,
  "status": "INSIDE_OFFICE",
  "lastHeartbeat": "2024-01-15T10:30:00Z",
  "outCount": 1,
  "totalOutTimeMinutes": 15
}
```

### Updated Endpoints

#### GET `/api/attendance/today`
Now includes presence information:
```json
{
  "success": true,
  "punchedIn": true,
  "punchInTime": "2024-01-15T09:00:00Z",
  "punchOutTime": null,
  "insideOffice": true,
  "lastHeartbeat": "2024-01-15T10:30:00Z",
  "outCount": 0,
  "totalOutTimeMinutes": 0,
  "status": "PRESENT"
}
```

## Frontend Components

### useHeartbeat Hook
Located at `frontend/src/hooks/useHeartbeat.js`

Automatically:
- Sends heartbeat every 1-2 minutes when punched in
- Handles auto punch out notifications
- Updates presence status
- Stops when user punches out

**Usage:**
```javascript
const { insideOffice, lastHeartbeat } = useHeartbeat(isPunchedIn, handleAutoPunchOut)
```

### LocationStatus Component
Updated to show:
- Live "Inside Office" / "Outside Office" status
- Last heartbeat time
- Location coordinates

### Attendance Page
Enhanced with:
- Automatic heartbeat monitoring
- Real-time presence status
- Auto punch out handling

## Backend Logic

### Heartbeat Processing Flow

1. **Receive Heartbeat**
   - Validate location and IP
   - Check if user is inside/outside office

2. **If Outside Office:**
   - Check if OUT period already exists
   - If not, create new OUT period
   - Check OUT count limit (max 2)
   - If limit reached, auto punch out

3. **If Inside Office:**
   - Check if active OUT period exists
   - If yes, close it and calculate duration
   - Update total OUT time
   - Check if total OUT time > 240 minutes
   - If yes, auto punch out and mark as ABSENT
   - Update status (PRESENT, HALF_DAY, ABSENT)

### Auto Punch Out Scenarios

1. **Geofence Exit**: User moves >50m from office
2. **IP Change**: User's IP address changes (not office IP)
3. **Heartbeat Timeout**: No heartbeat for >10 minutes
4. **Max OUT Count**: Reached 2 OUT periods
5. **Max OUT Time**: Total OUT time >240 minutes

### Status Calculation

Backend calculates status based on:
- Total OUT time
- Punch in/out times
- Work duration

**Rules:**
- `PRESENT`: OUT time ≤ 120 minutes, work time ≥ 8 hours
- `HALF_DAY`: OUT time > 120 minutes but ≤ 240 minutes
- `ABSENT`: OUT time > 240 minutes or work time < 4 hours
- `INCOMPLETE`: No punch out but heartbeat timeout

## Testing

### Test Punch IN
1. Ensure you're within 50m of office
2. Ensure you're on office IP
3. Click "Punch In"
4. Should succeed and start heartbeat

### Test Auto OUT Period
1. Punch in successfully
2. Move outside geofence (>50m) or change IP
3. Wait for next heartbeat (1-2 minutes)
4. Should see "Outside Office" status
5. Should see OUT period started

### Test Auto Punch Out
1. Punch in
2. Leave office (trigger OUT period)
3. Wait for conditions:
   - 2 OUT periods, OR
   - Total OUT time > 240 minutes, OR
   - No heartbeat for 10 minutes
4. Should auto punch out

### Test Heartbeat
1. Punch in
2. Monitor browser console for heartbeat logs
3. Should see heartbeats every 1-2 minutes
4. Check "Last heartbeat" time in UI

## Configuration

### Office Settings
Update office location and IP in database:
```sql
UPDATE office_settings 
SET latitude = 17.489313, 
    longitude = 78.392855, 
    radius_meters = 50,
    office_public_ip = '103.206.104.149'
WHERE id = (SELECT id FROM office_settings ORDER BY id DESC LIMIT 1);
```

### Heartbeat Interval
Currently randomized between 60-120 seconds. To change, edit `frontend/src/hooks/useHeartbeat.js`:
```javascript
const getNextInterval = () => {
  return 60000 + Math.random() * 60000 // Adjust these values
}
```

### Heartbeat Timeout
Currently 10 minutes. To change, edit:
- Backend: `backend/src/controllers/attendanceController.js` - `checkHeartbeatTimeouts()` function
- Backend: `backend/src/server.js` - Interval check frequency

## Troubleshooting

### Service Worker Not Registering
- Check browser console for errors
- Ensure HTTPS (or localhost for development)
- Clear browser cache and reload

### Heartbeat Not Sending
- Check browser console for errors
- Verify location permissions are granted
- Check network tab for API calls

### Auto Punch Out Not Working
- Check backend logs for heartbeat timeout checker
- Verify database migration completed
- Check office settings in database

### Status Not Updating
- Verify database function `calculate_attendance_status` exists
- Check attendance record has correct status column
- Review backend logs for errors

## Security Considerations

1. **Location Privacy**: Location data is only sent to your server
2. **IP Validation**: IP addresses are validated server-side
3. **Heartbeat Security**: Heartbeats require authentication token
4. **Auto Punch Out**: All auto actions are logged with reasons

## Performance

- Heartbeat interval: 60-120 seconds (randomized to prevent server spikes)
- Heartbeat timeout check: Every 5 minutes
- Database indexes added for performance
- Service worker caches static assets

## Future Enhancements

Possible improvements:
- Push notifications for auto punch out
- Background geofencing (when browser is closed)
- Detailed OUT period history
- Analytics dashboard for attendance patterns
- Mobile app (React Native) with native geofencing

## Support

For issues or questions:
1. Check browser console for errors
2. Check backend server logs
3. Verify database schema is updated
4. Test with browser DevTools Network tab

---

**Last Updated**: January 2024
**Version**: 1.0.0

