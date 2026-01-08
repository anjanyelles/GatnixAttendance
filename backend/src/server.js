const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leave');
const regularizationRoutes = require('./routes/regularization');
const managerRoutes = require('./routes/manager');
const hrRoutes = require('./routes/hr');
const adminRoutes = require('./routes/admin');

// Import attendance controller for heartbeat timeout check
const attendanceController = require('./controllers/attendanceController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS configuration
// Allow frontend URL from environment variable or default to localhost
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : [
    'http://localhost:5173',  // Vite dev server (frontend)
    'http://localhost:5174',   // If your frontend runs on 5174
    'http://localhost:3000',   // Alternative frontend port
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000',
    ];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all local network IPs (for mobile access)
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      // Allow localhost and local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      const isLocalNetwork = 
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(origin);
      
      if (isLocalNetwork || allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
    }
    
    // In production, only allow specific origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/regularization', regularizationRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server - listen on all network interfaces for mobile access
// In production (Railway/Render), they handle the host binding
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '0.0.0.0';
app.listen(PORT, host, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n📱 Mobile Access:`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://YOUR_LOCAL_IP:${PORT}`);
    console.log(`   (Replace YOUR_LOCAL_IP with your computer's IP address)\n`);
  } else {
    console.log(`\n✅ Production server running\n`);
  }
  
  // Schedule heartbeat timeout check every 5 minutes
  setInterval(async () => {
    try {
      const count = await attendanceController.checkHeartbeatTimeouts();
      if (count > 0) {
        console.log(`[Heartbeat Check] Auto punched out ${count} employee(s) due to heartbeat timeout`);
      }
    } catch (error) {
      console.error('[Heartbeat Check] Error:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
  
  console.log('Heartbeat timeout checker started (runs every 5 minutes)');
});

module.exports = app;

