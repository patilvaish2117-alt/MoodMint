require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const apiRoutes = require('./routes/api');

const app = express();

// Trust reverse proxy (Render, Heroku, Cloudflare, etc.) for rate limiting and HTTPS headers
app.set('trust proxy', 1);

// ==========================================
// SECURITY & PERFORMANCE MIDDLEWARE
// ==========================================

// Helmet sets HTTP headers securely to protect against well-known web vulnerabilities
app.use(
  helmet({
    contentSecurityPolicy: false, // Turn off CSP to avoid issues with inline scripts in a single-server deployment
    crossOriginEmbedderPolicy: false,
  })
);

// Compression Gzip-compresses responses to optimize response size and speed
app.use(compression());

// Logger: Combined standard in production, Dev logs in local development
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS configuration - Restrict to specific domain in production if specified
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Built-in body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiter to prevent spam and brute-force attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// ==========================================
// DATABASE CONNECTION
// ==========================================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/moodmint';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ==========================================
// ROUTES & HEALTH CHECKS
// ==========================================

// Health Check Endpoint for deployment platforms (Render, AWS, GCP, etc.)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// API routes
app.use('/api', apiRoutes);

// ==========================================
// STATIC FRONTEND SERVING (PRODUCTION ONLY)
// ==========================================
const frontendDistPath = path.join(__dirname, '../day planner/dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(frontendDistPath)) {
  console.log('Serving frontend static files from:', frontendDistPath);
  app.use(express.static(frontendDistPath));
  
  // Direct unmatched routes to frontend index.html for SPA client-side routing
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
  });
} else {
  // Simple welcome landing for standalone API mode
  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the MoodMint API Server' });
  });
}

// ==========================================
// GLOBAL ERROR HANDLING MIDDLEWARE
// ==========================================
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ==========================================
// SERVER INITIALIZATION & GRACEFUL SHUTDOWN
// ==========================================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle graceful shutdown signals from platforms like Render / Heroku / Kubernetes
const gracefulShutdown = () => {
  console.log('Received shutdown signal. Closing HTTP server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    mongoose.connection.close(false).then(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
