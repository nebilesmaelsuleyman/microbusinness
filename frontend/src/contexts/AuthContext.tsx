'use client';
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { AuthUser, authApi } from '../api/client';

const TOKEN_KEY = 'microbusiness_token';
const USER_KEY = 'microbusiness_user';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  setUser: (u: AuthUser | null) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Start empty so server and first client render match (no hydration mismatch);
  // hydrate from localStorage in an effect.
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const t = localStorage.getItem(TOKEN_KEY);
      const raw = localStorage.getItem(USER_KEY);
      if (t) setToken(t);
      if (raw) setUserState(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
    setLoading(false);
  }, []);

  // After initial hydration, if there's no token try to refresh using httpOnly cookie.
  useEffect(() => {
    if (loading) return;
    if (token) return; // already signed in
    let mounted = true;
    (async () => {
      try {
        const res = await authApi.refresh();
        if (!mounted) return;
        setToken(res.access_token);
        setUserState(res.user);
      } catch {
        // ignore; not authenticated
      }
    })();
    return () => { mounted = false; };
  }, [loading, token]);

  // Persist changes only after the initial load, so we don't clobber storage.
  useEffect(() => {
    if (loading) return;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token, loading]);

  useEffect(() => {
    if (loading) return;
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user, loading]);

  const login = useCallback((t: string, u: AuthUser) => {
    setToken(t);
    setUserState(u);
  }, []);

  const logout = useCallback(() => {
    // Fire-and-forget server logout to clear refresh cookie
    try { void authApi.logout(); } catch { /* ignore */ }
    setToken(null);
    setUserState(null);
  }, []);

  const setUser = useCallback((u: AuthUser | null) => {
    setUserState(u);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}
