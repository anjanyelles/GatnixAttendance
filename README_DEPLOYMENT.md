# 🚀 Quick Start Deployment

## Fastest Way to Deploy (15 minutes)

### Prerequisites
- GitHub account
- Code pushed to GitHub repository

---

## Step-by-Step Deployment

### 1️⃣ Deploy Backend to Railway (5 min)

1. **Sign up:** [railway.app](https://railway.app) → Login with GitHub

2. **Create Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add PostgreSQL Database:**
   - Click "+ New" → "Database" → "Add PostgreSQL"
   - Copy the `DATABASE_URL` (you'll need it)

4. **Configure Backend Service:**
   - Click on your backend service
   - Go to "Settings"
   - Set **Root Directory:** `backend`
   - Set **Start Command:** `npm start`

5. **Add Environment Variables:**
   - Go to "Variables" tab
   - Add these:
     ```
     DATABASE_URL=<paste-from-postgres-service>
     PORT=3000
     NODE_ENV=production
     JWT_SECRET=<generate-random-32-char-string>
     FRONTEND_URL=https://your-frontend.vercel.app
     ```
   - **Generate JWT_SECRET:** Use `openssl rand -base64 32` or [randomkeygen.com](https://randomkeygen.com)

6. **Deploy:**
   - Railway will auto-deploy
   - Wait for deployment to complete
   - Copy your backend URL: `https://your-app.railway.app`

7. **Run Database Migrations:**
   - Go to PostgreSQL service → "Connect"
   - Run SQL from `backend/src/config/schema.sql`
   - Then run `backend/src/config/pwa-schema-update.sql`

---

### 2️⃣ Deploy Frontend to Vercel (5 min)

1. **Sign up:** [vercel.com](https://vercel.com) → Login with GitHub

2. **Import Project:**
   - Click "Add New Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Build:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)

4. **Add Environment Variable:**
   - Go to "Environment Variables"
   - Add:
     ```
     VITE_API_BASE_URL=https://your-backend.railway.app/api
     ```
   - Replace `your-backend.railway.app` with your actual Railway backend URL

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Copy your frontend URL: `https://your-app.vercel.app`

---

### 3️⃣ Update Backend CORS (2 min)

1. **Go back to Railway:**
   - Backend service → "Variables"
   - Update `FRONTEND_URL`:
     ```
     FRONTEND_URL=https://your-app.vercel.app
     ```
   - Replace with your actual Vercel frontend URL

2. **Redeploy:**
   - Railway will auto-redeploy
   - Wait for completion

---

### 4️⃣ Setup Database (3 min)

1. **Connect to Database:**
   - Railway → PostgreSQL service → "Connect"
   - Or use Railway CLI: `railway connect postgres`

2. **Run Schema:**
   ```sql
   -- Copy and paste contents of:
   -- backend/src/config/schema.sql
   ```

3. **Run PWA Migration:**
   ```sql
   -- Copy and paste contents of:
   -- backend/src/config/pwa-schema-update.sql
   ```

4. **Create Admin User:**
   - In Railway, go to backend service
   - Click "Deployments" → "View Logs"
   - Or use Railway CLI:
     ```bash
     railway run node create-admin-user.js
     ```

5. **Set Office Settings:**
   ```sql
   UPDATE office_settings 
   SET latitude = YOUR_OFFICE_LAT, 
       longitude = YOUR_OFFICE_LONG,
       radius_meters = 50,
       office_public_ip = 'YOUR_OFFICE_PUBLIC_IP'
   WHERE id = (SELECT id FROM office_settings ORDER BY id DESC LIMIT 1);
   ```

---

## ✅ Test Your Deployment

1. **Open Frontend:** `https://your-app.vercel.app`
2. **Test Login:** Use admin credentials
3. **Test Location:** Should work (HTTPS!)
4. **Test Punch IN/OUT:** Should work
5. **Test on Mobile:** Install as PWA

---

## 🔧 Environment Variables Reference

### Backend (Railway)
```
DATABASE_URL=postgresql://...
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
JWT_SECRET=<32-char-random-string>
```

### Frontend (Vercel)
```
VITE_API_BASE_URL=https://your-backend.railway.app/api
```

---

## 🐛 Common Issues

### Backend won't start
- Check `DATABASE_URL` is correct
- Verify all environment variables are set
- Check Railway logs for errors

### Frontend can't connect to backend
- Verify `VITE_API_BASE_URL` is correct
- Check backend CORS allows frontend URL
- Verify backend is running

### Location not working
- Must use HTTPS (automatic on Vercel)
- Check browser console for errors
- Verify location permissions

### Database connection fails
- Check `DATABASE_URL` format
- Verify database is running
- Check firewall rules

---

## 📱 Post-Deployment Checklist

- [ ] Backend deployed and running
- [ ] Frontend deployed and running
- [ ] Database migrations completed
- [ ] Admin user created
- [ ] Office settings configured
- [ ] CORS configured correctly
- [ ] Login works
- [ ] Location works (HTTPS!)
- [ ] All features functional
- [ ] Mobile testing successful

---

## 🎉 You're Live!

**Frontend:** `https://your-app.vercel.app`  
**Backend:** `https://your-backend.railway.app`

Your app is now accessible from anywhere with HTTPS!

---

For detailed instructions, see `DEPLOYMENT_GUIDE.md`

