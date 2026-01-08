# 🔧 Backend Connection Timeout Fix

## Problem
Getting "Request timeout" error when trying to login. The app is trying to connect to `http://192.168.1.223:3000/api` but the backend is not responding.

## Quick Fix Steps

### Step 1: Verify Backend is Running

**Check if backend process is running:**
```bash
# On Mac/Linux
ps aux | grep node

# Or check if port 3000 is in use
lsof -i :3000
```

**If backend is NOT running, start it:**
```bash
cd backend
npm run dev
```

You should see:
```
Server is running on port 3000
Environment: development
📱 Mobile Access:
   Local:   http://localhost:3000
   Network: http://YOUR_LOCAL_IP:3000
```

### Step 2: Test Backend Locally

**Test from your laptop (same machine):**
```bash
curl http://localhost:3000/health
```

Should return: `{"success":true,"message":"Server is running"}`

If this fails, the backend is not running or crashed.

### Step 3: Test Backend from Network IP

**Test from your laptop using network IP:**
```bash
curl http://192.168.1.223:3000/health
```

**If this fails but localhost works:**
- Backend might not be listening on `0.0.0.0`
- Check `backend/src/server.js` line 128-129
- Should be: `const host = '0.0.0.0'`

### Step 4: Check Firewall

**Mac Firewall:**
1. System Settings → Network → Firewall
2. Make sure port 3000 is allowed
3. Or temporarily disable firewall to test

**If firewall is blocking:**
```bash
# Allow port 3000 (Mac)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

### Step 5: Verify IP Address

**Get your actual IP address:**
```bash
# Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Or
ipconfig getifaddr en0  # For WiFi
ipconfig getifaddr en1  # For Ethernet
```

**Update `.env.local` if IP changed:**
```bash
cd frontend
echo "VITE_API_BASE_URL=http://YOUR_ACTUAL_IP:3000/api" > .env.local
```

### Step 6: Check Backend Logs

**Look for errors in backend console:**
- Database connection errors?
- Port already in use?
- CORS errors?
- Any crash messages?

## Common Issues & Solutions

### Issue 1: Backend Not Running
**Solution:** Start the backend server
```bash
cd backend
npm run dev
```

### Issue 2: Port Already in Use
**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Issue 3: Backend Listening Only on Localhost
**Check:** `backend/src/server.js` line 128
**Should be:** `const host = '0.0.0.0'`

### Issue 4: Wrong IP Address
**Solution:** 
1. Get correct IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
2. Update `.env.local` with correct IP
3. Restart frontend

### Issue 5: Firewall Blocking
**Solution:**
- Temporarily disable firewall to test
- Or allow Node.js through firewall
- Or allow port 3000

### Issue 6: Backend Crashed
**Check backend console for errors:**
- Database connection issues?
- Missing environment variables?
- Syntax errors?

**Solution:** Fix the error and restart backend

## Testing Checklist

- [ ] Backend is running (`npm run dev` in backend folder)
- [ ] Backend responds to `http://localhost:3000/health`
- [ ] Backend responds to `http://192.168.1.223:3000/health`
- [ ] Backend is listening on `0.0.0.0` (check server.js)
- [ ] Firewall allows port 3000
- [ ] IP address in `.env.local` matches actual IP
- [ ] Frontend restarted after changing `.env.local`
- [ ] Both devices on same WiFi network

## Quick Test Commands

```bash
# 1. Check if backend is running
curl http://localhost:3000/health

# 2. Check if accessible via network IP
curl http://192.168.1.223:3000/health

# 3. Get your IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# 4. Check what's using port 3000
lsof -i :3000

# 5. Kill process on port 3000 (if needed)
lsof -ti:3000 | xargs kill -9
```

## Expected Behavior

**When backend is running correctly:**
1. Backend console shows: `Server is running on port 3000`
2. `curl http://localhost:3000/health` returns success
3. `curl http://192.168.1.223:3000/health` returns success
4. Frontend can connect and login works

**If timeout persists:**
1. Check backend is actually running
2. Verify IP address is correct
3. Check firewall settings
4. Ensure both devices on same network
5. Try restarting both backend and frontend

---

**Most common issue: Backend is not running. Start it with `npm run dev` in the backend folder!** 🚀

