# Office Location Configuration - Final Update

## ✅ Office Location Updated

**Collabra Technologies, KPHB Colony, Hyderabad**

- **Address**: collabra technologies, eSeva Lane, KPHB Colony, Hyderabad - 500972, Telangana, India
- **Latitude**: `17.489313654492967`
- **Longitude**: `78.39285505628658`
- **Radius**: `50 meters`
- **IP Address**: `103.206.104.149`

## Changes Made

### 1. Backend Defaults Updated
- ✅ Updated `attendanceController.js` default coordinates
- ✅ Updated `adminController.js` default coordinates
- ✅ Set default radius to **50 meters**

### 2. Frontend Admin Settings
- ✅ Updated "Use Office Location" button with correct coordinates
- ✅ Set default radius to **50 meters**
- ✅ Button now pre-fills all correct values including radius

### 3. Location Validation
- ✅ Haversine formula correctly calculates distance
- ✅ Employees within **50 meters** of office can punch in/out
- ✅ Validation checks both location (50m radius) and IP address

## How to Update in Admin Panel

1. **Login as ADMIN user**
2. **Navigate to**: `/admin/settings`
3. **Click "Use Office Location" button** - This will automatically fill:
   - Latitude: `17.489313654492967`
   - Longitude: `78.39285505628658`
   - Radius: `50`
   - Office Public IP: `103.206.104.149`
4. **Click "Save Settings"**

## Location Validation Logic

The backend validates:

1. **IP Address Match**: Employee's IP must match office IP (`103.206.104.149`)
2. **Distance Check**: Employee must be within **50 meters** of office location
   - Uses Haversine formula to calculate distance
   - Office location: `17.489313654492967, 78.39285505628658`
   - If distance > 50 meters, punch-in/out is rejected

## Testing

### Test Punch-In Request:
```json
{
    "latitude": 17.489313654492967,
    "longitude": 78.39285505628658,
    "ipAddress": "103.206.104.149"
}
```

### Expected Result:
- ✅ **Success** if:
  - Location is within 50 meters of office
  - IP address matches office IP

- ❌ **Error** if:
  - Location is more than 50 meters away
  - IP address doesn't match
  - Invalid coordinates

## Distance Calculation

The system uses the **Haversine formula** to calculate the distance between:
- Employee's current location (from GPS)
- Office location (`17.489313654492967, 78.39285505628658`)

If the calculated distance is ≤ 50 meters, the employee can punch in/out.

## Important Notes

1. **IP Address**: The IP `103.206.104.149` is your current public IP. If employees are on a different network, you may need to:
   - Update the IP in admin settings to match their network
   - Or configure multiple allowed IPs (requires backend modification)

2. **GPS Accuracy**: Mobile GPS accuracy is typically 5-10 meters. The 50-meter radius provides a good buffer.

3. **First Time Setup**: If no office settings exist in the database, the system will use these defaults automatically.

## Verification

After updating settings, verify:

1. Check admin settings page shows correct coordinates
2. Try punch-in from office location
3. Check distance calculation is working
4. Verify IP validation is working

All updates are complete! 🎉

