# PWA Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Database Migration
```bash
cd backend
node run-pwa-migration.js
```

### 2. Create PWA Icons
Create two icon files in `frontend/public/`:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

**Quick icon creation:**
- Use any logo/image
- Resize to 192x192 and 512x512
- Save as PNG format
- Place in `frontend/public/` folder

### 3. Start Services
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Install as PWA
1. Open `http://localhost:5173` in browser
2. Look for install prompt or use browser menu
3. Install and use like a native app!

## ✅ Features Now Available

- ✅ **PWA**: Install on mobile/desktop
- ✅ **Geofencing**: Punch IN only when inside 50m + office IP
- ✅ **Auto Monitoring**: Heartbeat every 1-2 minutes
- ✅ **Auto Punch OUT**: When leaving office or timeout
- ✅ **OUT Tracking**: Tracks time and count
- ✅ **Status Calculation**: PRESENT/HALF_DAY/ABSENT
- ✅ **Live Status**: Shows Inside/Outside Office

## 📋 Rules Enforced

- **Max 2 OUT periods per day**
- **Max 60 minutes OUT time** (warning)
- **>120 minutes OUT = Half Day**
- **>240 minutes OUT = Absent** (auto punch out)
- **No heartbeat >10 minutes = Auto punch out**

## 🔧 Configuration

Update office location/IP in database:
```sql
UPDATE office_settings 
SET latitude = YOUR_LAT, 
    longitude = YOUR_LONG, 
    radius_meters = 50,
    office_public_ip = 'YOUR_IP'
WHERE id = (SELECT id FROM office_settings ORDER BY id DESC LIMIT 1);
```

## 📱 Testing

1. **Punch IN**: Must be within 50m + office IP
2. **Leave Office**: Move >50m away or change IP
3. **Check Status**: Should show "Outside Office"
4. **Return**: Should show "Inside Office" and close OUT period
5. **Auto Punch OUT**: Will trigger if rules violated

## 🐛 Troubleshooting

**Service Worker not working?**
- Check browser console
- Clear cache and reload
- Ensure HTTPS (or localhost)

**Heartbeat not sending?**
- Check browser console
- Verify location permissions
- Check network tab

**Auto punch out not working?**
- Check backend logs
- Verify migration completed
- Check office settings

## 📚 Full Documentation

See `PWA_IMPLEMENTATION_GUIDE.md` for complete details.

---

**Ready to use!** 🎉

