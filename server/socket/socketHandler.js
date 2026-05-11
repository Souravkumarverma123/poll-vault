const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Poll = require('../models/Poll');

let io;

/**
 * Parse cookies from a cookie string header.
 */
const parseCookies = (cookieHeader = '') => {
  const cookies = {};
  cookieHeader.split(';').forEach(pair => {
    const [key, ...rest] = pair.split('=');
    if (key) cookies[key.trim()] = decodeURIComponent(rest.join('=').trim());
  });
  return cookies;
};

const initSocket = (server) => {
  const isDev = process.env.NODE_ENV !== 'production';

  io = new Server(server, {
    cors: {
      origin: isDev ? /^http:\/\/localhost:\d+$/ : (process.env.CLIENT_URL || 'http://localhost:5173'),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── Auth middleware for socket connections ───────────────────────────────────
  io.use((socket, next) => {
    try {
      // Try httpOnly cookie first
      const cookieHeader = socket.request.headers.cookie || '';
      const cookies = parseCookies(cookieHeader);
      const cookieToken = cookies['pollvault_access_token'];

      // Fallback: token passed via socket.auth (for programmatic use)
      const authToken = socket.handshake.auth?.token;

      const token = cookieToken || authToken;

      if (!token) {
        // Allow unauthenticated connections (for public respondents)
        socket.user = null;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.id };
      next();
    } catch {
      socket.user = null;
      next(); // Don't block — unauthenticated sockets are valid for public polls
    }
  });

  io.on('connection', (socket) => {
    console.log(`[socket] Connected: ${socket.id} (user: ${socket.user?.id || 'anonymous'})`);

    // Creator joins their poll room for live analytics
    socket.on('join:poll', async (data) => {
      try {
        const { pollId } = data;
        if (!pollId) {
          socket.emit('error', { message: 'Missing pollId' });
          return;
        }
        if (!socket.user) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        const poll = await Poll.findById(pollId).lean();
        if (!poll) {
          socket.emit('error', { message: 'Poll not found' });
          return;
        }
        if (poll.creator.toString() !== socket.user.id) {
          socket.emit('error', { message: 'Not authorized to view live analytics' });
          return;
        }

        socket.join(`poll_${pollId}`);
        console.log(`[socket] User ${socket.user.id} joined room poll_${pollId}`);
        socket.emit('joined:poll', { pollId, message: 'Joined poll room' });
      } catch (error) {
        console.error('[socket] join:poll error:', error.message);
        socket.emit('error', { message: 'Failed to join poll room' });
      }
    });

    socket.on('leave:poll', (data) => {
      const { pollId } = data;
      if (pollId) {
        socket.leave(`poll_${pollId}`);
        console.log(`[socket] ${socket.id} left room poll_${pollId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[socket] Disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

module.exports = { initSocket, getIO };
