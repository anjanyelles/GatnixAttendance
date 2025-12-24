# Quick Fix for CORS and Port Issues

## Immediate Steps to Fix

### 1. Check/Create `.env` file in `frontend/` directory

Create or update the file `frontend/.env` with:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

**Important**: If you have an existing `.env` file with port 5000, update it to 3000.

### 2. Restart Frontend Dev Server

Stop the current dev server (Ctrl+C) and restart:
```bash
cd frontend
npm run dev
```

The frontend will now run on **port 5173** (Vite default).

### 3. Verify Backend is Running

Make sure backend is running on port 3000:
```bash
cd backend
npm run dev
```

Test the backend:
```bash
curl http://localhost:3000/health
```

### 4. Clear Browser Cache

- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
- Or clear browser cache completely

## Port Configuration Summary

- **Frontend Dev Server**: `http://localhost:5173` (Vite)
- **Backend API Server**: `http://localhost:3000` (Express)
- **API Base URL**: `http://localhost:3000/api`

## CORS Configuration

The backend CORS is now configured to allow:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (alternative frontend port)

## If Still Getting Port 5000 Errors

1. Check if `.env` file exists in `frontend/` directory
2. Verify it has: `VITE_API_BASE_URL=http://localhost:3000/api`
3. Restart the Vite dev server completely
4. Clear browser cache and hard refresh
5. Check browser DevTools Network tab to see actual request URL

## Testing

After fixing, test login:
- Frontend: `http://localhost:5173`
- Login with: `john@example.com` / `password123`
- Should connect to: `http://localhost:3000/api/auth/login`

