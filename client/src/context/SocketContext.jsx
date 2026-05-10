import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

/**
 * Singleton Socket.IO instance — created once, shared across the whole app.
 * Authenticated via httpOnly cookie (sent automatically with withCredentials).
 *
 * Key resilience settings:
 * - reconnectionDelay: exponential backoff, starting at 1s
 * - reconnectionAttempts: limited to avoid infinite spam when server is down
 * - autoConnect: true but with proper backoff
 */
export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // In development, bypass Vite proxy and connect directly to the backend 
    // to avoid flaky WebSocket proxy issues (ECONNRESET).
    // In production, `undefined` connects to the same origin (handled by Nginx/host).
    const backendUrl = import.meta.env.DEV ? 'http://localhost:8000' : undefined;

    const socket = io(backendUrl, {
      withCredentials: true,       // sends httpOnly cookie
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,    // stop after 10 attempts (not infinite)
      reconnectionDelay: 1000,     // start at 1s
      reconnectionDelayMax: 30000, // cap at 30s (exponential backoff)
      randomizationFactor: 0.5,
      timeout: 10000,              // connection timeout 10s
      transports: ['websocket', 'polling'], // try websocket first
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[socket] Connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[socket] Disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      // Log only once per error type to avoid console spam
      console.warn('[socket] Connection error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // single connection for the lifetime of the app

  return (
    <SocketContext.Provider value={{ socketRef, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context.socketRef.current;
}

export function useSocketConnected() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocketConnected must be used within a SocketProvider');
  return context.connected;
}
