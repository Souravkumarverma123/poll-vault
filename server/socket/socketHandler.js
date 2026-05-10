const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Poll = require('../models/Poll');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Handle joining a poll room (creator's analytics dashboard)
    socket.on('join:poll', async (data) => {
      try {
        const { pollId, token } = data;

        if (!token || !pollId) {
          socket.emit('error', { message: 'Missing pollId or token' });
          return;
        }

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify user is creator of the poll
        const poll = await Poll.findById(pollId).lean();
        if (!poll) {
          socket.emit('error', { message: 'Poll not found' });
          return;
        }

        if (poll.creator.toString() !== decoded.id) {
          socket.emit('error', { message: 'Not authorized to view live analytics' });
          return;
        }

        // Join the room
        socket.join(`poll_${pollId}`);
        console.log(`User ${decoded.id} joined room poll_${pollId}`);
        socket.emit('joined:poll', { pollId, message: 'Joined poll room' });
      } catch (error) {
        console.error('Socket join:poll error:', error.message);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // Handle leaving a poll room
    socket.on('leave:poll', (data) => {
      const { pollId } = data;
      if (pollId) {
        socket.leave(`poll_${pollId}`);
        console.log(`Socket ${socket.id} left room poll_${pollId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = { initSocket, getIO };
