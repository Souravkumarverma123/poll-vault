const dotenv = require('dotenv');
dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { generalLimiter } = require('./middleware/rateLimiter');
const connectDB = require('./config/db');
const { initSocket } = require('./socket/socketHandler');
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();
app.set('trust proxy', 1);
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

// ── CORS & CSRF ──────────────────────────────────────────────────────────────
// CSRF Protection: We rely on httpOnly cookies with SameSite=Lax/Strict.
// Modern browsers enforce SameSite, preventing cross-site requests from attaching
// the authentication cookie. This avoids the need for a separate CSRF token.
const isDev = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: isDev ? /^http:\/\/localhost:\d+$/ : (process.env.CLIENT_URL || 'http://localhost:5173'),
  credentials: true,
}));

// ── Rate Limiters ─────────────────────────────────────────────────────────────
// Limiters are now imported from middleware/rateLimiter.js

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Health Check (No strict rate limiting) ────────────────────────────────────
// Placed before generalLimiter so wait-on doesn't trip rate limits during startup
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use(generalLimiter);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/polls', require('./routes/pollRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/system', require('./routes/systemRoutes'));

// Response-specific limiter is now attached inside pollRoutes.js

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
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`[server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

module.exports = { app, server };
