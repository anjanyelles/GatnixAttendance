# 🔧 Mobile Login Timeout Fix Guide

## Problem
Login requests are timing out on mobile browsers even with correct credentials.

## Root Causes
1. **Backend not accessible from mobile device** (most common)
2. **Wrong API URL** (using localhost instead of actual IP)
3. **Firewall blocking port 3000**
4. **Backend not listening on 0.0.0.0**
5. **Network connectivity issues**

## ✅ Solutions Applied

### 1. Increased Timeout for Mobile
- **Desktop**: 15 seconds timeout
- **Mobile**: 30 seconds timeout
- Detects mobile browsers automatically

### 2. Enhanced Error Logging
- Console logs show exact API URL being used
- Detailed error messages with troubleshooting steps
- Network error details logged

### 3. Better API URL Detection
- Checks environment variable first
- Detects mobile/network access automatically
- Falls back gracefully

## 🔍 Troubleshooting Steps

### Step 1: Verify Backend is Running
```bash
# Check if backend is running
curl http://localhost:3000/health

# Should return: {"success":true,"message":"Server is running"}
```

### Step 2: Check Backend is Listening on All Interfaces
Make sure `backend/src/server.js` has:
```javascript
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '0.0.0.0';
app.listen(PORT, host, () => {
  // ...
});
```

### Step 3: Get Your Computer's IP Address
```bash
# On Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# On Windows
ipconfig
```

Look for your local network IP (usually starts with 192.168.x.x or 10.x.x.x)

### Step 4: Test Backend from Mobile Browser
Open on your mobile browser:
```
http://YOUR_IP_ADDRESS:3000/health
```

Should return: `{"success":true,"message":"Server is running"}`

If this fails:
- ✅ Check firewall settings (allow port 3000)
- ✅ Verify both devices are on same WiFi network
- ✅ Check backend is running on 0.0.0.0 (not just localhost)

### Step 5: Configure Frontend API URL

**Option A: Environment Variable (Recommended)**
Create `frontend/.env.local`:
```env
VITE_API_BASE_URL=http://YOUR_IP_ADDRESS:3000/api
```

Replace `YOUR_IP_ADDRESS` with your actual IP from Step 3.

**Option B: Automatic Detection**
The app will automatically detect if you're accessing from mobile and use the correct IP.

### Step 6: Check Console Logs
Open browser console (on mobile, use remote debugging or Chrome DevTools):
- Look for: `🔍 API Base URL: ...`
- Should show: `http://YOUR_IP:3000/api` (NOT localhost)
- Look for timeout/network errors

### Step 7: Verify CORS Configuration
Check `backend/src/server.js` - CORS should allow your IP:
```javascript
// In development, allow all local network IPs
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  const isLocalNetwork = 
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(origin);
  
  if (isLocalNetwork || allowedOrigins.indexOf(origin) !== -1) {
    return callback(null, true);
  }
}
```

## 🐛 Common Issues

### Issue: "Request timeout" on mobile
**Solution:**
1. Verify backend is accessible: `http://YOUR_IP:3000/health`
2. Check API URL in console logs
3. Ensure `.env.local` has correct IP
4. Restart frontend after creating `.env.local`

### Issue: "Network Error" on mobile
**Solution:**
1. Backend not running
2. Wrong IP address
3. Firewall blocking port 3000
4. Devices on different networks

### Issue: CORS error
**Solution:**
1. Check backend CORS configuration
2. Verify your IP is in allowed origins
3. Check backend logs for CORS errors

## 📱 Mobile-Specific Notes

### iOS Safari
- May require HTTPS for some features
- Check Settings → Safari → Location Services
- Clear cache if issues persist

### Android Chrome
- Check Chrome → Settings → Site Settings → Location
- Enable location permissions
- Clear cache if needed

## ✅ Verification Checklist

- [ ] Backend running on `0.0.0.0:3000`
- [ ] Backend accessible from mobile: `http://YOUR_IP:3000/health`
- [ ] Frontend `.env.local` has correct IP (if using)
- [ ] Console shows correct API URL (not localhost)
- [ ] Both devices on same WiFi network
- [ ] Firewall allows port 3000
- [ ] CORS configured correctly
- [ ] Timeout increased to 30 seconds for mobile

## 🚀 Quick Fix Commands

```bash
# 1. Get your IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# 2. Create/update .env.local (replace YOUR_IP)
cd frontend
echo "VITE_API_BASE_URL=http://YOUR_IP:3000/api" > .env.local

# 3. Restart frontend
npm run dev

# 4. Test backend from mobile
# Open: http://YOUR_IP:3000/health
```

## 📝 Debug Information

When reporting issues, include:
1. API URL from console logs
2. Backend health check result from mobile
3. Network error details from console
4. Your IP address
5. Mobile browser type and version

---

**After applying these fixes, the login should work on mobile!** 📱✨

