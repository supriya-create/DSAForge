const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const trackerRoutes = require('./routes/trackerRoutes');
const leetcodeRoutes = require('./routes/leetcodeRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Scheduler (start after server is ready)
const { startScheduler } = require('./scheduler/leetcodeSyncScheduler');

// Connect to MongoDB
connectDB();

// Security Headers Middleware (CSP, HSTS, secure transport)
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://generativelanguage.googleapis.com https://leetcode.com;"
  );
  next();
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tracker', trackerRoutes);
app.use('/api/leetcode', leetcodeRoutes);

// Serve frontend build if it exists (so backend can host both frontend + API)
const buildPath = path.join(__dirname, '..', 'build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));

  // Fallback to index.html for client-side routing, but allow /api and /health through
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path === '/health') return next();
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  // Root - simple API landing page when no frontend build is present
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head><title>DSAForge API</title></head>
        <body style="font-family: Arial, sans-serif; line-height:1.6; padding:24px;">
          <h1>DSAForge Backend API</h1>
          <p>Server is running. Useful endpoints:</p>
          <ul>
            <li><a href="/health">/health</a> — Health check</li>
            <li><a href="/api/auth/register">/api/auth/register</a> — Register (POST)</li>
            <li><a href="/api/auth/login">/api/auth/login</a> — Login (POST)</li>
            <li><a href="/api/auth/me">/api/auth/me</a> — Get current user (protected)</li>
          </ul>
          <p>Use <code>curl</code> or Postman to interact with the POST endpoints.</p>
        </body>
      </html>
    `);
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API Documentation:`);
  console.log(`   POST   /api/auth/register - Register new user`);
  console.log(`   POST   /api/auth/login - Login user`);
  console.log(`   GET    /api/auth/me - Get current user (protected)`);
  console.log(`   PUT    /api/auth/profile - Update profile (protected)`);
  console.log(`   POST   /api/auth/change-password - Change password (protected)`);
  console.log(`   POST   /api/auth/verify-token - Verify token (protected)`);
  console.log(`   POST   /api/auth/logout - Logout (protected)\n`);
  // Start scheduled background jobs
  try {
    startScheduler();
  } catch (err) {
    console.error('Failed to start scheduler:', err);
  }
});

module.exports = app;
