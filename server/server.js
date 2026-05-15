import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { generalLimiter } from './middleware/rateLimiter.js';
import connectDB from './config/db.js';
import { initSocket } from './socket/socketHandler.js';
import errorHandler from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import pollRoutes from './routes/pollRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import systemRoutes from './routes/systemRoutes.js';

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
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/system', systemRoutes);

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

const PORT = process.env.PORT || 8000;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`[server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

export { app, server };
