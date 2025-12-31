# 🚀 Quick Mobile Testing - 3 Steps

## Step 1: Get Your IP Address

**Mac/Linux:**
```bash
./get-local-ip.sh
```

**Or manually:**
```bash
# Mac
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

You'll get something like: `192.168.1.100`

## Step 2: Update Frontend API URL

Create `frontend/.env.local`:
```env
VITE_API_BASE_URL=http://YOUR_IP:3000/api
```

Replace `YOUR_IP` with the IP from Step 1.

Example:
```env
VITE_API_BASE_URL=http://192.168.1.100:3000/api
```

## Step 3: Start Services & Access from Mobile

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

**On Mobile:**
1. Connect to same WiFi
2. Open browser
3. Go to: `http://YOUR_IP:5173`
4. Install as PWA!

## ✅ That's It!

The configuration files are already updated to allow network access.

## 🔧 If It Doesn't Work

1. **Check Firewall:**
   - Mac: System Settings → Firewall
   - Windows: Windows Defender → Firewall

2. **Check Network:**
   - Both devices on same WiFi?

3. **Check IP:**
   - Run `./get-local-ip.sh` again
   - Make sure it's correct

4. **Check Backend:**
   - Test: `http://YOUR_IP:3000/health` from mobile browser
   - Should return JSON

5. **Check Frontend:**
   - Test: `http://YOUR_IP:5173` from mobile browser
   - Should see the app

## 📱 Installing as PWA

**Android:**
- Chrome menu → "Add to Home screen"

**iOS:**
- Safari Share → "Add to Home Screen"

---

For detailed guide, see `MOBILE_TESTING_GUIDE.md`

