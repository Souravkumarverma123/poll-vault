import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, loginUser, registerUser, logoutUser } from '@/api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // kept for socket auth only
  const [loading, setLoading] = useState(true);

  // On mount, validate session via httpOnly cookie
  useEffect(() => {
    const validateSession = async () => {
      try {
        const res = await getMe();
        setUser(res.data.data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    validateSession();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await loginUser({ email, password });
    const { user: userData, token: newToken } = res.data.data;
    setToken(newToken); // keep in memory for socket auth handshake
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await registerUser({ name, email, password });
    const { user: userData, token: newToken } = res.data.data;
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try { await logoutUser(); } catch { /* ignore */ }
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await getMe();
      setUser(res.data.data.user);
    } catch { /* ignore */ }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
