const dotenv = require('dotenv');
dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { initSocket } = require('./socket/socketHandler');
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
    },
  },
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Rate Limiters ─────────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV !== 'production';

// In development, use a passthrough middleware (no rate limiting)
// In production, enforce strict limits
const authLimiter = isDev
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20,                   // 20 login/register attempts per window
      message: { success: false, message: 'Too many attempts. Please try again after 15 minutes.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

const responseLimiter = isDev
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10,
      message: { success: false, message: 'Too many submissions. Please wait a moment before trying again.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

const generalLimiter = isDev
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    });

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(generalLimiter);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/polls', require('./routes/pollRoutes'));

// Response-specific limiter attached inside pollRoutes for the POST endpoint
// but we apply it globally here for the responses sub-route
app.use('/api/polls/:pollId/responses', responseLimiter);

// ── Serve frontend in production ──────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
  });
}

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = { app, server };
