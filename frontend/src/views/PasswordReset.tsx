'use client';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from '@/lib/router-compat';
import { authApi } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { Field } from '../components/ui';

export default function PasswordReset() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If token present, focus password field
  }, [token]);

  const request = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.requestPasswordReset(email.trim());
      if (res.devToken) {
        toast.success(`DEV token: ${res.devToken}`);
      }
      toast.success('If that email exists, a reset link has been sent');
      navigate('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not request');
    } finally { setLoading(false); }
  };

  const doReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password updated — please sign in');
      navigate('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not reset');
    } finally { setLoading(false); }
  };

  if (token) {
    return (
      <div className="page-narrow">
        <h1>Reset password</h1>
        <p className="sub">Enter a new password for your account.</p>
        <form className="card card-pad" onSubmit={doReset}>
          <Field label="New password">
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          </Field>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Resetting…' : 'Reset password'}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="page-narrow">
      <h1>Forgot password</h1>
      <p className="sub">Enter your email and we'll send a link to reset your password.</p>
      <form className="card card-pad" onSubmit={request}>
        <Field label="Email">
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</button>
      </form>
    </div>
  );
}
