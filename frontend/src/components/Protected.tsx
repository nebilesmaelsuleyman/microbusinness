'use client';
import { type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from '@/lib/router-compat';
import { PageLoader } from './ui';
import type { Role } from '../api/client';

/** Client-side route guard for auth-gated pages (mirrors the old <Protected>). */
export default function Protected({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { token, user, loading } = useAuth();
  if (loading) return <div className="page"><PageLoader /></div>;
  if (!token) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
