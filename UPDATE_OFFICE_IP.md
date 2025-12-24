# How to Update Office IP Address - Admin Guide

## Overview

The office IP address is used to validate that employees are connected to the office Wi-Fi network. This can be updated from the Admin Settings page.

## Current Status

- **Current Office IP**: `103.21.124.56` (from your database)
- **Location**: `17.489314, 78.392855`
- **Radius**: `60 meters`

## How to Update Office IP

### Step 1: Login as Admin

1. Login with an ADMIN account
2. Navigate to `/admin/settings`

### Step 2: Update IP Address

You have **3 options**:

#### Option A: Get Current IP Automatically (Recommended)

1. Click the **"Get Current IP"** button next to the IP field
2. The system will automatically fetch your current public IP
3. It will be filled in the field automatically
4. Click **"Save Settings"**

#### Option B: Enter IP Manually

1. Type the IP address in the **"Office Public IP"** field
2. Format: `XXX.XXX.XXX.XXX` (e.g., `103.21.124.56`)
3. The field validates the format automatically
4. Click **"Save Settings"**

#### Option C: Use Office Location Button

1. Click **"Use Office Location"** button
2. This pre-fills the office coordinates
3. Then manually enter or get the current IP
4. Click **"Save Settings"**

### Step 3: Verify Update

After saving, check the **"Current Settings"** card at the bottom:
- Office Public IP should show the new IP in green
- If not set, it shows in red

## UI Features

### ✅ New Features Added:

1. **"Get Current IP" Button**
   - Automatically fetches your current public IP
   - One-click solution to update IP

2. **Real-time IP Validation**
   - Validates IP format as you type
   - Shows error if format is invalid
   - Validates octets (0-255)

3. **Required Field**
   - IP field is now required (marked with red *)
   - Form won't submit without valid IP

4. **Better Display**
   - Current settings shown in a card
   - IP displayed in green if set, red if not
   - Clear visual feedback

5. **Help Text**
   - Explains what the IP is used for
   - Shows validation requirements

## Validation Rules

### IP Address Format:
- Must be IPv4 format: `XXX.XXX.XXX.XXX`
- Each octet must be 0-255
- Examples:
  - ✅ Valid: `103.21.124.56`
  - ✅ Valid: `192.168.1.1`
  - ❌ Invalid: `999.999.999.999` (octets > 255)
  - ❌ Invalid: `192.168.1` (incomplete)

### Backend Validation:
- Checks IP format using `isValidIP()` function
- Returns error if format is invalid
- Updates database on success

## Example: Update IP to Current Network

### Scenario: Office IP Changed

1. **Get New IP**:
   - Click "Get Current IP" button
   - System fetches: `103.21.124.56` (or your current IP)

2. **Save Settings**:
   - IP is automatically filled
   - Click "Save Settings"
   - Success message appears

3. **Verify**:
   - Check "Current Settings" card
   - IP should show in green
   - Employees can now punch in with this IP

## Testing After Update

1. **Test from Employee Account**:
   - Employee tries to punch in
   - If IP matches new office IP → ✅ Wi-Fi Valid
   - If IP doesn't match → ❌ Wi-Fi Invalid

2. **Check Validation**:
   - Location Valid: ✓ (if within 60m)
   - Wi-Fi Valid: ✓ (if IP matches new office IP)
   - Punch In button: Enabled if both are ✓

## Important Notes

### ⚠️ IP Address Behavior:

1. **Public IP vs Private IP**
   - System uses **public IP** (from `api.ipify.org`)
   - All devices on same office network share same public IP
   - This is why it works for Wi-Fi validation

2. **Dynamic IPs**
   - Office IP might change if router restarts
   - Update IP in admin settings when it changes
   - Use "Get Current IP" button to get new IP easily

3. **Multiple Networks**
   - If office has multiple networks, you may need to:
     - Update IP when switching networks
     - Or configure multiple IPs (requires backend modification)

4. **Testing from Different Location**
   - If testing from home/remote, update IP to match your current network
   - Or temporarily disable IP validation (not recommended)

## API Endpoint

**PUT** `/api/admin/office-settings`

**Request Body:**
```json
{
  "latitude": 17.489314,
  "longitude": 78.392855,
  "radiusMeters": 60,
  "officePublicIp": "103.21.124.56"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Office settings updated successfully",
  "settings": {
    "id": 1,
    "latitude": "17.48931400",
    "longitude": "78.39285500",
    "radius_meters": 60,
    "office_public_ip": "103.21.124.56",
    "updated_at": "2025-12-20T20:41:49.326Z"
  }
}
```

## Troubleshooting

### IP Not Updating?

1. **Check form validation**:
   - IP field must be filled
   - Format must be valid (XXX.XXX.XXX.XXX)
   - Each octet 0-255

2. **Check backend logs**:
   - Look for error messages
   - Verify IP format validation

3. **Test API directly**:
   ```bash
   curl -X PUT http://localhost:3000/api/admin/office-settings \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -d '{
       "latitude": 17.489314,
       "longitude": 78.392855,
       "radiusMeters": 60,
       "officePublicIp": "103.21.124.56"
     }'
   ```

### Employees Still Can't Punch In?

1. **Verify IP matches**:
   - Check employee's IP (from browser console)
   - Compare with office IP in settings
   - Must match exactly

2. **Check location**:
   - Employee must be within 60 meters
   - Both location AND IP must be valid

## Summary

✅ **UI Updated**: Admin settings now has "Get Current IP" button
✅ **Validation**: Real-time IP format validation
✅ **Required Field**: IP is now required
✅ **Better Display**: Shows current IP status clearly
✅ **Backend Ready**: Already supports IP updates

You can now easily update the office IP from the admin panel! 🎉

