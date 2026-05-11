import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, loginUser, registerUser, logoutUser } from '@/api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    setUser(res.data.data.user);
    return res.data.data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await registerUser({ name, email, password });
    setUser(res.data.data.user);
    return res.data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await logoutUser(); } catch { /* ignore */ }
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await getMe();
      setUser(res.data.data.user);
    } catch { /* ignore */ }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
