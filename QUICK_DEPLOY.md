# ⚡ Quick Deployment Guide

## 🎯 Fastest Way: Vercel + Railway (15 minutes)

### Step 1: Push to GitHub (2 min)
```bash
# Initialize git if not done
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/gatnix-attendance.git
git push -u origin main
```

### Step 2: Deploy Backend to Railway (5 min)

1. **Go to:** [railway.app](https://railway.app) → Sign up with GitHub
2. **New Project** → **Add PostgreSQL** (database)
3. **Add Service** → **GitHub Repo** → Select your repo
4. **Settings** → **Root Directory:** `backend`
5. **Variables** → Add:
   ```
   DATABASE_URL=<copy-from-postgres-service>
   PORT=3000
   NODE_ENV=production
   JWT_SECRET=<random-32-char-string>
   ```
6. **Copy backend URL:** `https://your-app.railway.app`

### Step 3: Deploy Frontend to Vercel (5 min)

1. **Go to:** [vercel.com](https://vercel.com) → Sign up with GitHub
2. **New Project** → Select your repo
3. **Settings:**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables:**
   ```
   VITE_API_BASE_URL=https://your-backend.railway.app/api
   ```
5. **Deploy** → Copy frontend URL

### Step 4: Update Backend CORS (2 min)

1. **Railway** → Backend service → Variables
2. **Add:**
   ```
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
3. **Redeploy** backend

### Step 5: Setup Database (1 min)

1. **Railway** → PostgreSQL service → Connect
2. **Run migrations:**
   ```sql
   -- Copy and paste from backend/src/config/schema.sql
   -- Then run backend/src/config/pwa-schema-update.sql
   ```

### ✅ Done!

**Frontend:** `https://your-app.vercel.app`  
**Backend:** `https://your-backend.railway.app`

**Test:**
- Open frontend URL
- Login works
- Location works (HTTPS!)
- Everything works!

---

## 🔧 Generate JWT Secret

```bash
# On Mac/Linux
openssl rand -base64 32

# Or use online: https://randomkeygen.com
```

---

## 📝 Environment Variables Summary

### Backend (Railway)
```
DATABASE_URL=<from-postgres>
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

**That's it! Your app is live! 🚀**
