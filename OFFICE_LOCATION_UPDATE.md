# Office Location Update Guide

## Your Correct Office Location

- **Latitude**: 17.48928389703935
- **Longitude**: 78.39281598963233
- **IP Address**: 103.206.104.149

## ✅ Already Updated

I've updated the default values in the backend code. However, you still need to:

1. **Update via Admin Panel** (Recommended):
   - Login as ADMIN user
   - Go to `/admin/settings`
   - Enter the coordinates:
     - Latitude: `17.48928389703935`
     - Longitude: `78.39281598963233`
     - Radius: `100` (or your preferred radius in meters)
     - Office Public IP: `103.206.104.149`
   - Click "Save Settings"

2. **Or Update via .env file** (Alternative):
   Add to `backend/.env`:
   ```env
   DEFAULT_OFFICE_LATITUDE=17.48928389703935
   DEFAULT_OFFICE_LONGITUDE=78.39281598963233
   DEFAULT_OFFICE_RADIUS=100
   DEFAULT_OFFICE_PUBLIC_IP=103.206.104.149
   ```

## Why Update?

The defaults are now set, but if you've already created office settings in the database, you need to update them via the admin panel. The defaults only apply when no settings exist in the database.

## Testing

After updating:
1. Try punch-in again with your location
2. Should work if:
   - You're within the radius (100 meters by default)
   - Your IP matches `103.206.104.149`

## Note on IP Address

The IP address `103.206.104.149` is your current public IP. If you're testing from home or a different network, you may need to:
- Update the IP in admin settings to match your current network's public IP
- Or temporarily disable IP validation for testing (not recommended for production)

