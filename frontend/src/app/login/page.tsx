'use client';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from '@/lib/router-compat';
import Login from '../../views/Login';

export default function LoginPage() {
  const { token, loading } = useAuth();
  if (!loading && token) return <Navigate to="/" replace />;
  return <Login />;
}
