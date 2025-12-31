# Deployment Guide for GatnixAttendance

This guide covers deploying both the backend and frontend of the GatnixAttendance application.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Production Checklist](#production-checklist)

---

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Git
- Domain name (optional, for production)

---

## Backend Deployment

### Option 1: Deploy to VPS/Cloud Server (Recommended)

#### Step 1: Prepare Your Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 for process management
sudo npm install -g pm2
```

#### Step 2: Clone and Setup Backend
```bash
# Navigate to your deployment directory
cd /var/www  # or your preferred directory

# Clone your repository (or upload files)
git clone <your-repo-url> GatnixAttendance
cd GatnixAttendance/backend

# Install dependencies
npm install --production
```

#### Step 3: Configure Environment Variables
```bash
# Create .env file
nano .env
```

Add the following (update with your values):
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=attendance_db
DB_USER=postgres
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key_min_32_characters
```

#### Step 4: Setup Database
```bash
# Create database
sudo -u postgres psql
CREATE DATABASE attendance_db;
CREATE USER postgres WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE attendance_db TO postgres;
\q

# Run database setup
psql -U postgres -d attendance_db -f src/config/schema.sql
psql -U postgres -d attendance_db -f src/config/holidays-schema.sql

# Run setup scripts
node setup-database.sql
node setup-holidays-table.js
node create-admin-user.js
```

#### Step 5: Start with PM2
```bash
# Start the application
pm2 start src/server.js --name gatnix-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown
```

#### Step 6: Setup Nginx Reverse Proxy (Optional but Recommended)
```bash
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/gatnix-backend
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your server IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/gatnix-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Deploy to Heroku

#### Step 1: Install Heroku CLI
```bash
# Install Heroku CLI (if not installed)
# Visit: https://devcenter.heroku.com/articles/heroku-cli
```

#### Step 2: Create Heroku App
```bash
cd GatnixAttendance/backend
heroku login
heroku create gatnix-backend
```

#### Step 3: Add PostgreSQL Addon
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

#### Step 4: Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_jwt_secret_key_min_32_characters
# Database credentials are automatically set by Heroku Postgres
```

#### Step 5: Deploy
```bash
git push heroku main
```

#### Step 6: Run Database Migrations
```bash
heroku run node setup-database.sql
heroku run node setup-holidays-table.js
heroku run node create-admin-user.js
```

### Option 3: Deploy to Railway

1. Go to [Railway.app](https://railway.app)
2. Create new project
3. Add PostgreSQL service
4. Add Node.js service and connect to your GitHub repo
5. Set environment variables in Railway dashboard
6. Deploy automatically

---

## Frontend Deployment

### Option 1: Deploy to VPS with Nginx

#### Step 1: Build Frontend
```bash
cd GatnixAttendance/frontend
npm install
npm run build
```

This creates a `dist` folder with production-ready files.

#### Step 2: Setup Nginx
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/gatnix-frontend
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-frontend-domain.com;  # or your server IP

    root /var/www/GatnixAttendance/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/gatnix-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 3: Copy Build Files
```bash
# If building locally, copy dist folder to server
scp -r dist/* user@your-server:/var/www/GatnixAttendance/frontend/dist/

# Or build on server
cd /var/www/GatnixAttendance/frontend
npm install
npm run build
```

### Option 2: Deploy to Vercel

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Deploy
```bash
cd GatnixAttendance/frontend
vercel
```

Follow the prompts. When asked for build settings:
- Build Command: `npm run build`
- Output Directory: `dist`

#### Step 3: Set Environment Variables
In Vercel dashboard:
- Go to your project settings
- Add environment variable: `VITE_API_BASE_URL` = `https://your-backend-url.com/api`

### Option 3: Deploy to Netlify

#### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### Step 2: Deploy
```bash
cd GatnixAttendance/frontend
npm run build
netlify deploy --prod --dir=dist
```

#### Step 3: Set Environment Variables
In Netlify dashboard:
- Go to Site settings > Environment variables
- Add: `VITE_API_BASE_URL` = `https://your-backend-url.com/api`

### Option 4: Deploy to GitHub Pages

#### Step 1: Update vite.config.js
```javascript
export default defineConfig({
  plugins: [react()],
  base: '/GatnixAttendance/', // Your repo name
  // ... rest of config
})
```

#### Step 2: Install gh-pages
```bash
npm install --save-dev gh-pages
```

#### Step 3: Add Script to package.json
```json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}
```

#### Step 4: Deploy
```bash
npm run deploy
```

---

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=attendance_db
DB_USER=postgres
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key_min_32_characters
```

### Frontend (.env or .env.production)
Create `.env.production` in frontend directory:
```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

**Important:** Update `server.js` CORS configuration to include your frontend URL:
```javascript
const corsOptions = {
  origin: [
    'https://your-frontend-domain.com',  // Production frontend
    'http://localhost:5173',              // Keep for local dev
  ],
  credentials: true,
  // ... rest of config
};
```

---

## Database Setup

### Production Database Setup

1. **Create Database:**
```sql
CREATE DATABASE attendance_db;
```

2. **Run Schema:**
```bash
psql -U postgres -d attendance_db -f src/config/schema.sql
psql -U postgres -d attendance_db -f src/config/holidays-schema.sql
```

3. **Run Setup Scripts:**
```bash
node setup-database.sql
node setup-holidays-table.js
node create-admin-user.js
```

---

## Production Checklist

### Backend
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (minimum 32 characters)
- [ ] Use secure database password
- [ ] Update CORS to allow only production frontend URL
- [ ] Setup SSL/HTTPS (use Let's Encrypt)
- [ ] Configure firewall (allow only necessary ports)
- [ ] Setup database backups
- [ ] Configure PM2 or similar process manager
- [ ] Setup logging and monitoring
- [ ] Test all API endpoints

### Frontend
- [ ] Set `VITE_API_BASE_URL` to production backend URL
- [ ] Build production bundle (`npm run build`)
- [ ] Test all features in production environment
- [ ] Setup SSL/HTTPS
- [ ] Configure proper caching headers
- [ ] Test on multiple browsers
- [ ] Verify API connectivity

### Security
- [ ] Use HTTPS for both frontend and backend
- [ ] Implement rate limiting on backend
- [ ] Setup proper CORS configuration
- [ ] Use environment variables for secrets
- [ ] Keep dependencies updated
- [ ] Setup regular backups
- [ ] Configure firewall rules

### Monitoring
- [ ] Setup error logging (e.g., Sentry)
- [ ] Monitor server resources (CPU, memory, disk)
- [ ] Setup uptime monitoring
- [ ] Configure alerts for critical issues

---

## Quick Deployment Commands

### Backend (VPS)
```bash
cd /var/www/GatnixAttendance/backend
npm install --production
# Setup .env file
pm2 start src/server.js --name gatnix-backend
pm2 save
```

### Frontend (VPS)
```bash
cd /var/www/GatnixAttendance/frontend
npm install
npm run build
# Configure Nginx to serve dist folder
```

---

## Troubleshooting

### Backend Issues
- **Port already in use:** Change PORT in .env or kill process using port 3000
- **Database connection failed:** Check DB credentials in .env
- **CORS errors:** Update CORS origin in server.js

### Frontend Issues
- **API calls failing:** Check VITE_API_BASE_URL environment variable
- **Build errors:** Check Node.js version (should be v16+)
- **404 on routes:** Ensure Nginx is configured with `try_files $uri $uri/ /index.html;`

---

## Support

For issues or questions, refer to:
- Backend README: `backend/README.md`
- Frontend README: `frontend/README.md`
- Quick Setup: `backend/QUICKSTART.md`

