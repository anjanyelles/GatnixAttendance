# CORS and Port Configuration Fix

## Issues Fixed

### 1. Port Conflict
- **Problem**: Both frontend (Vite) and backend were configured to use port 3000
- **Solution**: 
  - Frontend (Vite dev server): Changed to port **5173** (Vite default)
  - Backend API: Remains on port **3000**

### 2. CORS Configuration
- **Problem**: CORS 403 error - backend not allowing frontend origin
- **Solution**: Updated CORS configuration to explicitly allow:
  - `http://localhost:5173` (Vite dev server)
  - `http://localhost:3000` (alternative frontend port)
  - `http://127.0.0.1:5173`
  - `http://127.0.0.1:3000`

## Configuration

### Frontend
- **Dev Server Port**: 5173
- **API Base URL**: `http://localhost:3000/api`
- **Environment Variable**: `VITE_API_BASE_URL=http://localhost:3000/api`

### Backend
- **API Server Port**: 3000
- **CORS**: Configured to allow frontend origins

## Next Steps

1. **Create `.env` file in frontend directory** (if not exists):
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

2. **Restart both servers**:
   ```bash
   # Backend (in backend directory)
   npm run dev
   
   # Frontend (in frontend directory)
   npm run dev
   ```

3. **Clear browser cache** if you still see port 5000 errors

## Verification

- Frontend should be accessible at: `http://localhost:5173`
- Backend API should be accessible at: `http://localhost:3000/api`
- Health check: `http://localhost:3000/health`

