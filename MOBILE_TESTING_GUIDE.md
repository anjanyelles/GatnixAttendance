# Mobile Testing Guide - Local Development

## 🚀 Quick Steps to Test on Mobile

### Step 1: Find Your Computer's Local IP Address

**On Mac:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
Look for something like: `192.168.1.100` or `10.0.0.5`

**On Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually `192.168.x.x`)

**On Linux:**
```bash
hostname -I
```

### Step 2: Update Backend CORS Settings

Make sure your backend allows connections from your mobile device's IP.

**Option A: Update `.env` file (Recommended)**
```env
FRONTEND_URL=http://localhost:5173,http://YOUR_LOCAL_IP:5173
NODE_ENV=development
```

**Option B: Update `backend/src/server.js`**
The CORS is already configured to allow localhost and development mode, but you can add your mobile IP:

```javascript
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://YOUR_LOCAL_IP:5173',  // Add your IP here
    ];
```

### Step 3: Start Backend with Network Access

Make sure the backend listens on all network interfaces (0.0.0.0), not just localhost:

**Check `backend/src/server.js`:**
```javascript
app.listen(PORT, '0.0.0.0', () => {  // Add '0.0.0.0' here
  console.log(`Server is running on port ${PORT}`);
  // ...
});
```

If not already set, update it:
```javascript
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  console.log(`Access from mobile: http://YOUR_LOCAL_IP:${PORT}`);
  // ...
});
```

### Step 4: Start Frontend with Network Access

**Update `frontend/vite.config.js`:**
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',  // Add this to allow network access
    open: true
  },
  publicDir: 'public'
})
```

### Step 5: Update Frontend API URL

**Option A: Use Environment Variable (Recommended)**

Create `frontend/.env.local`:
```env
VITE_API_BASE_URL=http://YOUR_LOCAL_IP:3000/api
```

**Option B: Update `frontend/src/services/api.js`**

Temporarily change:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://YOUR_LOCAL_IP:3000/api`
```

### Step 6: Start Both Services

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://YOUR_LOCAL_IP:5173/
```

### Step 7: Connect Mobile Device

1. **Ensure mobile and computer are on the same WiFi network**
2. **Open mobile browser** (Chrome, Safari, Firefox)
3. **Navigate to:** `http://YOUR_LOCAL_IP:5173`

   Example: `http://192.168.1.100:5173`

### Step 8: Install as PWA on Mobile

**Android (Chrome):**
1. Open the app in Chrome
2. Tap the menu (3 dots) → "Add to Home screen" or "Install app"
3. Or look for install banner at bottom

**iOS (Safari):**
1. Open the app in Safari
2. Tap Share button (square with arrow)
3. Tap "Add to Home Screen"
4. Customize name if needed
5. Tap "Add"

**Android (Firefox):**
1. Open the app in Firefox
2. Menu → "Install"

### Step 9: Test Features

1. **Location Permission:**
   - Browser will ask for location permission
   - Grant permission for testing

2. **Punch IN:**
   - Must be within 50m of office location
   - Must be on office IP (or test with your IP)

3. **Heartbeat:**
   - Check browser console (if accessible)
   - Should see heartbeat every 1-2 minutes

4. **PWA Features:**
   - App should work offline (cached assets)
   - Should look like native app
   - No browser address bar when installed

## 🔧 Troubleshooting

### Can't Access from Mobile

**Check Firewall:**
- Mac: System Settings → Firewall → Allow incoming connections
- Windows: Windows Defender → Allow app through firewall
- Linux: `sudo ufw allow 5173` and `sudo ufw allow 3000`

**Check Network:**
- Ensure both devices on same WiFi
- Try pinging mobile from computer: `ping MOBILE_IP`
- Try pinging computer from mobile

**Check Backend:**
- Verify backend is running: `curl http://YOUR_LOCAL_IP:3000/health`
- Check backend logs for connection attempts

**Check Frontend:**
- Verify frontend accessible: Open `http://YOUR_LOCAL_IP:5173` on computer
- Check browser console for errors

### CORS Errors

If you see CORS errors:
1. Check backend CORS configuration
2. Add mobile IP to allowed origins
3. Check `FRONTEND_URL` environment variable

### API Connection Failed

1. **Check API URL in frontend:**
   - Open browser DevTools → Network tab
   - See what URL is being called
   - Should be `http://YOUR_LOCAL_IP:3000/api/...`

2. **Test backend directly:**
   - From mobile browser: `http://YOUR_LOCAL_IP:3000/health`
   - Should return JSON response

3. **Update API base URL:**
   - Make sure frontend uses correct IP
   - Not `localhost` (won't work on mobile)

### Location Not Working

1. **Grant Permissions:**
   - Mobile browser will ask for location
   - Grant permission

2. **HTTPS Requirement:**
   - Some browsers require HTTPS for geolocation
   - For local testing, use `http://localhost` or trusted IP
   - Or use ngrok (see below)

3. **Test Location:**
   - Open browser console
   - Check for location errors

### Service Worker Not Working

1. **HTTPS Required:**
   - Service workers need HTTPS (or localhost)
   - For mobile testing, use ngrok or similar

2. **Clear Cache:**
   - Clear browser cache
   - Unregister old service worker

## 🌐 Using ngrok for HTTPS (Optional)

If you need HTTPS for service worker or geolocation:

### Install ngrok:
```bash
# Mac
brew install ngrok

# Or download from https://ngrok.com/
```

### Start ngrok:
```bash
# For frontend
ngrok http 5173

# For backend (in another terminal)
ngrok http 3000
```

### Update Configuration:

**Frontend `.env.local`:**
```env
VITE_API_BASE_URL=https://YOUR_BACKEND_NGROK_URL/api
```

**Backend CORS:**
Add ngrok URLs to allowed origins.

**Access from mobile:**
Use the ngrok HTTPS URL instead of local IP.

## 📱 Quick Test Checklist

- [ ] Backend running on `0.0.0.0:3000`
- [ ] Frontend running on `0.0.0.0:5173`
- [ ] Can access frontend from mobile: `http://YOUR_IP:5173`
- [ ] Can access backend from mobile: `http://YOUR_IP:3000/health`
- [ ] API calls working (check Network tab)
- [ ] Location permission granted
- [ ] PWA installed on home screen
- [ ] Heartbeat sending (check console/logs)
- [ ] Punch IN working
- [ ] Presence status updating

## 🎯 Testing Scenarios

### 1. Basic PWA Test
- Install app
- Close browser
- Open from home screen
- Should work like native app

### 2. Location Test
- Grant location permission
- Check if location obtained
- Try punch IN (if within 50m)

### 3. Heartbeat Test
- Punch IN
- Wait 1-2 minutes
- Check if heartbeat sent
- Check presence status

### 4. Geofencing Test
- Punch IN (if within 50m)
- Move away from office (>50m)
- Wait for next heartbeat
- Should show "Outside Office"

### 5. Auto Punch Out Test
- Punch IN
- Leave office
- Wait for conditions:
  - 2 OUT periods, OR
  - >240 min OUT time, OR
  - >10 min no heartbeat
- Should auto punch out

## 💡 Pro Tips

1. **Use Browser DevTools on Mobile:**
   - Chrome: `chrome://inspect` on desktop
   - Safari: Enable Web Inspector in Settings
   - Firefox: Use remote debugging

2. **Check Logs:**
   - Backend: Check terminal for errors
   - Frontend: Use browser console (remote debugging)

3. **Network Monitoring:**
   - Use browser Network tab to see API calls
   - Check if requests are reaching backend

4. **Test Different Networks:**
   - Same WiFi: Best for testing
   - Mobile hotspot: Can work but slower
   - Different networks: Won't work (use ngrok)

## 🚀 Production Deployment

For production, you'll need:
- Real domain with HTTPS
- Proper CORS configuration
- Production database
- Environment variables set

But for local mobile testing, the above steps should work!

---

**Need Help?** Check the main documentation:
- `PWA_IMPLEMENTATION_GUIDE.md`
- `PWA_QUICK_START.md`

