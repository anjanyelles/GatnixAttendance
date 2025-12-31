# 🔧 Mobile Login Fix - Network Error Solution

## Problem
- ✅ UI loads fine on mobile
- ✅ Login screen visible
- ❌ Login fails with "network error" even with correct credentials

## Root Cause
Frontend is trying to connect to `localhost:3000` which doesn't work on mobile. Mobile needs to use your computer's IP address.

## ✅ Solution Applied

### 1. Created `.env.local` file
Created `frontend/.env.local` with:
```env
VITE_API_BASE_URL=http://192.168.1.223:3000/api
```

### 2. Updated Backend CORS
Added your IP (`192.168.1.223`) to allowed origins in backend.

## 🧪 Testing Steps

### Step 1: Test Backend from Mobile

**Option A: Use Test Page**
1. Copy `test-backend-mobile.html` to `frontend/public/`
2. Access from mobile: `http://192.168.1.223:5173/test-backend-mobile.html`
3. Click "Test Health Endpoint" - should show ✅

**Option B: Direct Test**
Open in mobile browser:
```
http://192.168.1.223:3000/health
```
Should return: `{"success":true,"message":"Server is running"}`

### Step 2: Test Login from Mobile

1. Open app: `http://192.168.1.223:5173`
2. Try to login
3. Check browser console (if accessible) for errors

### Step 3: Verify Configuration

**Check Frontend API URL:**
1. Open mobile browser DevTools (if possible)
2. Go to Network tab
3. Try to login
4. Check what URL is being called
5. Should be: `http://192.168.1.223:3000/api/auth/login`
6. NOT: `http://localhost:3000/api/auth/login`

## 🔍 Troubleshooting

### If Still Getting Network Error:

**1. Check Backend is Running:**
```bash
# On your computer
curl http://192.168.1.223:3000/health
```

**2. Check Firewall:**
- Mac: System Settings → Firewall → Allow incoming connections
- Make sure port 3000 is allowed

**3. Check CORS:**
- Backend should allow: `http://192.168.1.223:5173`
- Check `backend/src/server.js` - your IP should be in allowedOrigins

**4. Check Network:**
- Both devices on same WiFi?
- Try pinging from mobile (if possible)
- Try accessing backend directly: `http://192.168.1.223:3000/health`

**5. Clear Browser Cache:**
- Mobile browser might have cached old API URL
- Clear cache and reload

**6. Check Environment Variable:**
```bash
# Verify .env.local exists
cat frontend/.env.local

# Should show:
# VITE_API_BASE_URL=http://192.168.1.223:3000/api
```

**7. Restart Frontend:**
After creating `.env.local`, restart frontend:
```bash
cd frontend
# Stop current server (Ctrl+C)
npm run dev
```

## 📱 Quick Fix Commands

```bash
# 1. Get your IP
./get-local-ip.sh

# 2. Create/update .env.local (replace IP)
cd frontend
echo "VITE_API_BASE_URL=http://YOUR_IP:3000/api" > .env.local

# 3. Restart frontend
npm run dev

# 4. Test backend from mobile
# Open: http://YOUR_IP:3000/health
```

## ✅ Verification Checklist

- [ ] `.env.local` file exists in `frontend/` folder
- [ ] `.env.local` has correct IP (not localhost)
- [ ] Backend CORS includes your IP
- [ ] Backend is running on `0.0.0.0:3000`
- [ ] Frontend restarted after creating `.env.local`
- [ ] Can access `http://YOUR_IP:3000/health` from mobile
- [ ] Network tab shows correct API URL (with IP, not localhost)

## 🎯 Expected Behavior

**Before Fix:**
- Mobile tries: `http://localhost:3000/api/auth/login` ❌
- Fails because localhost on mobile = mobile device, not your computer

**After Fix:**
- Mobile tries: `http://192.168.1.223:3000/api/auth/login` ✅
- Works because it connects to your computer's IP

## 📝 Notes

- If your IP changes, update `.env.local` and restart frontend
- The `.env.local` file is gitignored (won't be committed)
- For production, use environment variables or a proper domain

---

**If still having issues, check:**
1. Backend logs for CORS errors
2. Mobile browser console for network errors
3. Network tab to see actual request URLs

