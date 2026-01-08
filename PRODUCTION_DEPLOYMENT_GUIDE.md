# 🚀 Production Deployment Guide for Mobile

## ✅ Pre-Deployment Checklist

### Backend Requirements
- [ ] Backend deployed and accessible via HTTPS
- [ ] Database configured and accessible
- [ ] Environment variables set:
  - `DATABASE_URL` or individual DB credentials
  - `JWT_SECRET` (strong random string)
  - `JWT_EXPIRES_IN` (default: 24h)
  - `FRONTEND_URL` (your production frontend URL)
  - `NODE_ENV=production`
- [ ] CORS configured to allow production frontend URL
- [ ] Server listening on `0.0.0.0` (already configured)

### Frontend Requirements
- [ ] Frontend deployed and accessible via HTTPS
- [ ] Environment variable set:
  - `VITE_API_BASE_URL` (your production backend API URL)
- [ ] PWA manifest configured
- [ ] Service worker registered
- [ ] HTTPS enabled (required for geolocation on mobile)

## 🔧 Production Configuration

### 1. Backend Environment Variables

Set these in your hosting platform (Railway, Render, Heroku, etc.):

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=your_postgresql_connection_string
# OR individual DB variables:
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password

JWT_SECRET=your_strong_random_secret_key_here
JWT_EXPIRES_IN=24h

FRONTEND_URL=https://your-frontend-domain.com
```

### 2. Frontend Environment Variables

Create `.env.production` or set in your hosting platform:

```env
VITE_API_BASE_URL=https://your-backend-api-domain.com/api
```

**Important:** Replace `your-backend-api-domain.com` with your actual backend URL.

### 3. CORS Configuration

The backend already handles CORS, but verify `FRONTEND_URL` includes:
- Your production frontend domain
- Any subdomains if needed
- Example: `https://your-app.com,https://www.your-app.com`

## 📱 Mobile-Specific Requirements

### HTTPS is Mandatory
- **Geolocation API requires HTTPS** on mobile browsers
- Both frontend and backend must use HTTPS
- Self-signed certificates won't work on mobile

### PWA Configuration
- Already configured in `frontend/public/manifest.json`
- Service worker registered in `frontend/index.html`
- Icons should be present (192x192 and 512x512)

### API URL Detection
The app will automatically detect the API URL in production:
- Uses `VITE_API_BASE_URL` if set (recommended)
- Otherwise infers from current domain
- Make sure to set `VITE_API_BASE_URL` explicitly

## 🚀 Deployment Steps

### Step 1: Deploy Backend

1. **Push backend code to repository**
2. **Set environment variables** in hosting platform
3. **Deploy backend**
4. **Test backend health endpoint:**
   ```bash
   curl https://your-backend-api.com/health
   ```
   Should return: `{"success":true,"message":"Server is running"}`

### Step 2: Deploy Frontend

1. **Set environment variable:**
   ```env
   VITE_API_BASE_URL=https://your-backend-api.com/api
   ```

2. **Build frontend:**
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy `dist/` folder** to hosting platform (Vercel, Netlify, etc.)

4. **Verify build:**
   - Check `dist/index.html` exists
   - Check `dist/manifest.json` exists
   - Check `dist/sw.js` exists

### Step 3: Test on Mobile

1. **Open frontend URL on mobile browser**
2. **Test login** - should work without timeout
3. **Test location permission** - should prompt automatically
4. **Test punch in/out** - should work with location
5. **Test movement tracking** - heartbeat should work

## 🔍 Post-Deployment Testing

### Desktop Testing
- [ ] Login works
- [ ] Location detection works
- [ ] Punch in/out works
- [ ] Reports load correctly

### Mobile Testing (iOS Safari)
- [ ] App loads correctly
- [ ] Login works
- [ ] Location permission prompt appears
- [ ] Location detection works after permission
- [ ] Punch in/out works
- [ ] Movement tracking works
- [ ] Reports are mobile-friendly

### Mobile Testing (Android Chrome)
- [ ] App loads correctly
- [ ] Login works
- [ ] Location permission prompt appears
- [ ] Location detection works after permission
- [ ] Punch in/out works
- [ ] Movement tracking works
- [ ] Reports are mobile-friendly

## 🐛 Common Production Issues

### Issue: Geolocation not working on mobile
**Solution:**
- Ensure HTTPS is enabled (not HTTP)
- Check location permissions in browser settings
- Verify manifest.json has proper configuration

### Issue: API timeout on mobile
**Solution:**
- Verify `VITE_API_BASE_URL` is set correctly
- Check backend CORS allows frontend domain
- Ensure backend is accessible from mobile network
- Check backend logs for errors

### Issue: Service worker not registering
**Solution:**
- Ensure HTTPS is enabled
- Check `sw.js` is in `public/` folder
- Verify service worker registration code in `index.html`

### Issue: Login fails on mobile
**Solution:**
- Check API URL is correct
- Verify backend is accessible
- Check CORS configuration
- Review browser console for errors

## 📋 Production Checklist

### Backend
- [ ] Deployed and running
- [ ] HTTPS enabled
- [ ] Database connected
- [ ] Environment variables set
- [ ] CORS configured for frontend domain
- [ ] Health endpoint accessible

### Frontend
- [ ] Deployed and running
- [ ] HTTPS enabled
- [ ] `VITE_API_BASE_URL` set correctly
- [ ] Build successful
- [ ] PWA manifest configured
- [ ] Service worker registered

### Mobile Testing
- [ ] Login works
- [ ] Location permission works
- [ ] Punch in/out works
- [ ] Movement tracking works
- [ ] Reports display correctly
- [ ] No console errors

## 🎯 Quick Deployment Commands

### Backend
```bash
# Set environment variables in hosting platform
# Then deploy (varies by platform)
```

### Frontend
```bash
cd frontend

# Set production API URL
echo "VITE_API_BASE_URL=https://your-backend-api.com/api" > .env.production

# Build
npm run build

# Deploy dist/ folder to hosting platform
```

## 📝 Notes

1. **HTTPS is mandatory** for mobile geolocation
2. **Set `VITE_API_BASE_URL` explicitly** in production
3. **Test on actual mobile devices**, not just desktop browser dev tools
4. **Monitor backend logs** for errors
5. **Keep environment variables secure** (don't commit secrets)

## ✅ Success Criteria

After deployment, you should be able to:
- ✅ Access app on mobile browser via HTTPS
- ✅ Login successfully
- ✅ Grant location permission
- ✅ Punch in/out with location validation
- ✅ See movement tracking working
- ✅ View reports on mobile

---

**Good luck with your deployment! 🚀📱**

If you encounter any issues, check the browser console on mobile (use remote debugging) and backend logs.

