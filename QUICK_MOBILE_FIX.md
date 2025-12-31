# 🚨 Quick Fix: Mobile Login Network Error

## The Problem
Your mobile can see the login screen but login fails with "network error" because the frontend is trying to connect to `localhost:3000` which doesn't work on mobile.

## ✅ Solution (2 Steps)

### Step 1: Create Environment File

**Run this command:**
```bash
./setup-mobile-env.sh
```

**OR manually create `frontend/.env.local`:**
```bash
cd frontend
echo "VITE_API_BASE_URL=http://192.168.1.223:3000/api" > .env.local
```

**Replace `192.168.1.223` with YOUR IP** (shown in terminal: `Network: http://192.168.1.223:5173/`)

### Step 2: Restart Frontend

**IMPORTANT:** You MUST restart the frontend after creating `.env.local`:

```bash
# Stop current frontend (Ctrl+C)
# Then restart:
cd frontend
npm run dev
```

## ✅ That's It!

Now try logging in from mobile - it should work!

## 🧪 Test First

Before trying login, test if backend is accessible:

**On Mobile Browser:**
Open: `http://192.168.1.223:3000/health`

Should show: `{"success":true,"message":"Server is running"}`

If this works, login will work too!

## 🔍 If Still Not Working

1. **Check `.env.local` exists:**
   ```bash
   cat frontend/.env.local
   ```
   Should show: `VITE_API_BASE_URL=http://192.168.1.223:3000/api`

2. **Check you restarted frontend** after creating the file

3. **Check backend is running** on `0.0.0.0:3000`

4. **Check CORS** - Backend should allow your IP (already updated)

5. **Clear mobile browser cache** and reload

## 📝 What Changed

- ✅ Created `frontend/.env.local` with your IP
- ✅ Updated backend CORS to allow your IP
- ✅ Backend already listening on `0.0.0.0` (network accessible)

The frontend will now use `http://192.168.1.223:3000/api` instead of `localhost:3000` when accessed from mobile!

