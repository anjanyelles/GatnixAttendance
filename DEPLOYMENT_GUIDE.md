# 🚀 Complete Deployment Guide - Gatnix Attendance System

## Overview
This guide covers deploying both frontend (React/Vite) and backend (Node.js/Express) to production.

## 📋 Prerequisites

- GitHub account (for code hosting)
- Production database (PostgreSQL) - options: Railway, Render, Supabase, AWS RDS
- Domain name (optional but recommended)

## 🎯 Deployment Options

### Frontend Options:
1. **Vercel** (Recommended - Free, Easy, Auto HTTPS)
2. **Netlify** (Free, Easy, Auto HTTPS)
3. **Cloudflare Pages** (Free, Fast CDN)

### Backend Options:
1. **Railway** (Recommended - Free tier, Easy PostgreSQL)
2. **Render** (Free tier, Easy setup)
3. **DigitalOcean App Platform** (Paid, but reliable)
4. **Heroku** (Paid, but well-known)

### Database Options:
1. **Railway PostgreSQL** (Free tier, Easy)
2. **Render PostgreSQL** (Free tier)
3. **Supabase** (Free tier, PostgreSQL)
4. **AWS RDS** (Paid, Enterprise)

---

## 🚀 Option 1: Vercel (Frontend) + Railway (Backend + Database)

### Step 1: Prepare Code for Deployment

#### 1.1 Create `.env.example` files

**Backend `.env.example`:**
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Server
PORT=3000
NODE_ENV=production

# CORS - Add your frontend URL
FRONTEND_URL=https://your-app.vercel.app

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this

# Office Settings (Optional - can set in database)
DEFAULT_OFFICE_LATITUDE=17.489313654492967
DEFAULT_OFFICE_LONGITUDE=78.39285505628658
DEFAULT_OFFICE_RADIUS=50
DEFAULT_OFFICE_PUBLIC_IP=your-office-ip
```

**Frontend `.env.example`:**
```env
VITE_API_BASE_URL=https://your-backend.railway.app/api
```

#### 1.2 Update Frontend API Configuration

Make sure `frontend/src/services/api.js` uses environment variable:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
```

#### 1.3 Create Production Build Scripts

**Backend `package.json` - Add:**
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "migrate": "node run-pwa-migration.js"
  }
}
```

**Frontend `package.json` - Already has:**
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

### Step 2: Deploy Backend to Railway

#### 2.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"

#### 2.2 Add PostgreSQL Database
1. Click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will create a PostgreSQL database
4. Copy the `DATABASE_URL` from the database service

#### 2.3 Deploy Backend
1. Click "+ New" → "GitHub Repo"
2. Select your repository
3. Railway will detect Node.js
4. Click on the service → "Settings"
5. Add environment variables:
   ```
   DATABASE_URL=<from-postgres-service>
   PORT=3000
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.vercel.app
   JWT_SECRET=<generate-random-string>
   ```
6. Railway will auto-deploy
7. Copy the deployment URL (e.g., `https://your-app.railway.app`)

#### 2.4 Run Database Migrations
1. In Railway, go to your backend service
2. Click "Deployments" → "View Logs"
3. Or use Railway CLI:
   ```bash
   railway login
   railway link
   railway run node run-pwa-migration.js
   ```

#### 2.5 Update CORS in Backend
Make sure `backend/src/server.js` allows your frontend URL:
```javascript
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173']
```

---

### Step 3: Deploy Frontend to Vercel

#### 3.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Add New Project"

#### 3.2 Import Repository
1. Select your GitHub repository
2. Vercel will auto-detect Vite
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

#### 3.3 Add Environment Variables
1. Go to "Settings" → "Environment Variables"
2. Add:
   ```
   VITE_API_BASE_URL=https://your-backend.railway.app/api
   ```
3. Save

#### 3.4 Deploy
1. Click "Deploy"
2. Vercel will build and deploy
3. Copy the deployment URL (e.g., `https://your-app.vercel.app`)

#### 3.5 Update Backend CORS
1. Go back to Railway backend
2. Update `FRONTEND_URL` environment variable:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Redeploy backend

---

### Step 4: Configure Production Database

#### 4.1 Connect to Production Database
```bash
# Using Railway CLI
railway connect postgres

# Or use connection string from Railway dashboard
psql <DATABASE_URL>
```

#### 4.2 Run Schema Migration
```sql
-- Run the main schema
\i backend/src/config/schema.sql

-- Run PWA migration
\i backend/src/config/pwa-schema-update.sql
```

#### 4.3 Create Admin User
```bash
# In Railway, run:
railway run node create-admin-user.js
```

#### 4.4 Set Office Settings
```sql
UPDATE office_settings 
SET latitude = YOUR_LAT, 
    longitude = YOUR_LONG, 
    radius_meters = 50,
    office_public_ip = 'YOUR_OFFICE_IP'
WHERE id = (SELECT id FROM office_settings ORDER BY id DESC LIMIT 1);
```

---

## 🚀 Option 2: Netlify (Frontend) + Render (Backend)

### Frontend - Netlify

1. **Sign up:** [netlify.com](https://netlify.com)
2. **New site from Git:** Select your repo
3. **Build settings:**
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
4. **Environment variables:**
   - `VITE_API_BASE_URL=https://your-backend.onrender.com/api`
5. **Deploy**

### Backend - Render

1. **Sign up:** [render.com](https://render.com)
2. **New Web Service:** Connect GitHub repo
3. **Settings:**
   - Environment: Node
   - Build command: `npm install`
   - Start command: `npm start`
   - Root directory: `backend`
4. **Add PostgreSQL:**
   - New → PostgreSQL
   - Copy connection string
5. **Environment variables:**
   ```
   DATABASE_URL=<from-postgres>
   PORT=3000
   NODE_ENV=production
   FRONTEND_URL=https://your-app.netlify.app
   JWT_SECRET=<random-string>
   ```
6. **Deploy**

---

## 🔧 Production Configuration

### Backend Production Checklist

- [ ] Environment variables set
- [ ] Database migrations run
- [ ] CORS configured for frontend URL
- [ ] JWT_SECRET is strong and secure
- [ ] Office settings configured
- [ ] Admin user created
- [ ] HTTPS enabled (automatic on Railway/Render)

### Frontend Production Checklist

- [ ] Environment variables set (API URL)
- [ ] Build succeeds
- [ ] API calls work
- [ ] PWA manifest configured
- [ ] Service worker works
- [ ] HTTPS enabled (automatic on Vercel/Netlify)

---

## 🔐 Security Best Practices

### 1. Environment Variables
- Never commit `.env` files
- Use strong JWT_SECRET (32+ characters)
- Rotate secrets regularly

### 2. Database
- Use strong database passwords
- Enable SSL connections
- Regular backups

### 3. CORS
- Only allow your frontend domain
- Don't use wildcards in production

### 4. HTTPS
- Always use HTTPS in production
- Required for geolocation to work
- Automatic on Vercel/Netlify/Railway

---

## 📱 Post-Deployment Steps

### 1. Test Everything
- [ ] Login works
- [ ] Location permission works (HTTPS required!)
- [ ] Punch IN/OUT works
- [ ] Heartbeat works
- [ ] All features functional

### 2. Update Office Settings
```sql
-- Connect to production database
UPDATE office_settings 
SET latitude = YOUR_OFFICE_LAT, 
    longitude = YOUR_OFFICE_LONG,
    radius_meters = 50,
    office_public_ip = 'YOUR_OFFICE_PUBLIC_IP'
WHERE id = (SELECT id FROM office_settings ORDER BY id DESC LIMIT 1);
```

### 3. Create Admin User
```bash
# In production environment
node create-admin-user.js
```

### 4. Test Mobile
- [ ] Open app on mobile
- [ ] Location permission works (HTTPS!)
- [ ] All features work
- [ ] PWA installable

---

## 🌐 Custom Domain (Optional)

### Vercel
1. Go to project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. SSL auto-configured

### Railway
1. Go to service → Settings → Networking
2. Add custom domain
3. Update DNS records
4. SSL auto-configured

---

## 🔄 Continuous Deployment

Both Vercel and Railway auto-deploy on git push:

1. **Make changes** to code
2. **Commit and push** to GitHub
3. **Auto-deploys** to production
4. **Test** new deployment

---

## 📊 Monitoring

### Railway
- View logs in dashboard
- Monitor resource usage
- Set up alerts

### Vercel
- View analytics
- Monitor performance
- Check build logs

---

## 🐛 Troubleshooting

### Backend Issues

**Database connection fails:**
- Check DATABASE_URL is correct
- Verify database is running
- Check firewall rules

**CORS errors:**
- Verify FRONTEND_URL matches actual frontend URL
- Check backend CORS configuration
- Clear browser cache

### Frontend Issues

**API calls fail:**
- Check VITE_API_BASE_URL is correct
- Verify backend is running
- Check CORS configuration

**Location not working:**
- Must use HTTPS (automatic on Vercel/Netlify)
- Check browser console for errors
- Verify location permissions

### Database Issues

**Migrations fail:**
- Check database connection
- Verify schema files exist
- Run migrations manually if needed

---

## 📝 Quick Deployment Checklist

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] `.env.example` files created
- [ ] No hardcoded URLs/credentials
- [ ] Build scripts tested locally

### Backend Deployment
- [ ] Railway/Render account created
- [ ] PostgreSQL database created
- [ ] Backend service deployed
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] CORS configured
- [ ] Backend URL copied

### Frontend Deployment
- [ ] Vercel/Netlify account created
- [ ] Frontend service deployed
- [ ] Environment variables set (API URL)
- [ ] Frontend URL copied

### Post-Deployment
- [ ] Backend CORS updated with frontend URL
- [ ] Database configured (office settings)
- [ ] Admin user created
- [ ] Tested on desktop
- [ ] Tested on mobile
- [ ] Location works (HTTPS!)
- [ ] All features work

---

## 🎉 You're Live!

After completing these steps, your app will be:
- ✅ Accessible from anywhere
- ✅ Using HTTPS (location will work!)
- ✅ Auto-deploying on git push
- ✅ Production-ready

**Frontend URL:** `https://your-app.vercel.app`  
**Backend URL:** `https://your-backend.railway.app`

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Need Help?** Check the troubleshooting section or review the deployment logs.

