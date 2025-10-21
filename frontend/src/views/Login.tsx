'use client';
import { useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { authApi, type Role, type AuthUser } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Field } from '../components/ui';
import {
  IconBolt, IconShieldCheck, IconStar, IconBriefcase, IconUser, IconInfo, IconArrowRight, IconPhone,
} from '../components/icons';

type Tab = 'login' | 'signup';

function normalizePhoneNumber(value: string) {
  const trimmed = value.trim().replace(/[\s()-]/g, '');
  if (!trimmed) return '';
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);

  // Shared credential fields.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('customer');

  // Phone-OTP login sub-flow (an alternative to email+password under the Log in tab).
  const [phoneMode, setPhoneMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const finish = (user: AuthUser) => {
    toast.success(`Welcome${user.name ? `, ${user.name}` : ''}!`);
    navigate(user.role === 'provider' ? '/dashboard' : user.role === 'admin' ? '/admin' : '/');
  };

  const resetPhoneFlow = () => { setPhoneMode(false); setOtpSent(false); setOtp(''); setDevOtp(null); };
  const switchTab = (t: Tab) => { setTab(t); resetPhoneFlow(); };

  const errMsg = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login({ email: email.trim(), password });
      login(res.access_token, res.user);
      finish(res.user);
    } catch (err) {
      toast.error(errMsg(err, 'Could not log in'));
    } finally {
      setLoading(false);
    }
  };

  const doSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.register({
        name: name.trim() || undefined,
        email: email.trim(),
        password,
        phoneNumber: normalizePhoneNumber(phone),
        role,
      });
      login(res.access_token, res.user);
      finish(res.user);
    } catch (err) {
      toast.error(errMsg(err, 'Could not create account'));
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const normalizedPhone = normalizePhoneNumber(phone);
      const res = await authApi.sendOtp(normalizedPhone);
      setPhone(normalizedPhone);
      setDevOtp(res.devOtp ?? null);
      if (res.devOtp) setOtp(res.devOtp);
      setOtpSent(true);
      toast.success('Verification code sent');
    } catch (err) {
      toast.error(errMsg(err, 'Could not send code'));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.verifyOtp({ phoneNumber: normalizePhoneNumber(phone), otp: otp.trim() });
      login(res.access_token, res.user);
      finish(res.user);
    } catch (err) {
      toast.error(errMsg(err, 'Invalid code'));
    } finally {
      setLoading(false);
    }
  };

  const roleField = (
    <Field label="I want to">
      <div className="role-pick">
        <button type="button" className={`role-opt${role === 'customer' ? ' sel' : ''}`} onClick={() => setRole('customer')}>
          <span className="ro-ic"><IconUser /></span>
          <b>Hire a pro</b>
          <span>Find &amp; book local services</span>
        </button>
        <button type="button" className={`role-opt${role === 'provider' ? ' sel' : ''}`} onClick={() => setRole('provider')}>
          <span className="ro-ic"><IconBriefcase /></span>
          <b>Offer services</b>
          <span>Get jobs as a provider</span>
        </button>
      </div>
    </Field>
  );

  return (
    <div className="auth-wrap">
      {/* Brand panel */}
      <aside className="auth-aside">
        <div className="aa-content">
          <div className="logo" style={{ color: '#fff' }}>
            <span className="logo-mark"><IconBolt /></span> Servio
          </div>
          <h2 style={{ marginTop: 48 }}>Hire trusted local <span className="accent">pros</span>, or grow your service business.</h2>
          <p>Join thousands of customers and providers on the marketplace built for local services.</p>
          <div className="auth-feat">
            {[
              { ic: <IconShieldCheck />, t: 'Verified providers', d: 'Every pro is ID & document verified.' },
              { ic: <IconStar />, t: 'Trusted reviews', d: 'Real ratings from real customers.' },
              { ic: <IconBriefcase />, t: 'Get hired faster', d: 'Receive job requests and leads directly.' },
            ].map((f) => (
              <div key={f.t} className="af">
                <span className="af-ic">{f.ic}</span>
                <div><b>{f.t}</b><div><span>{f.d}</span></div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="aa-content small" style={{ opacity: 0.8 }}>© {new Date().getFullYear()} Servio</div>
      </aside>

      {/* Form panel */}
      <main className="auth-main">
        <div className="auth-card">
          <div className="tabs" role="tablist" aria-label="Log in or sign up">
            <button type="button" role="tab" aria-selected={tab === 'login'} className={`tab${tab === 'login' ? ' active' : ''}`} onClick={() => switchTab('login')}>Log in</button>
            <button type="button" role="tab" aria-selected={tab === 'signup'} className={`tab${tab === 'signup' ? ' active' : ''}`} onClick={() => switchTab('signup')}>Sign up</button>
          </div>

          {/* ---------------------------------------------------------- Log in */}
          {tab === 'login' && !phoneMode && (
            <>
              <h1>Welcome back</h1>
              <p className="sub">Log in to your Servio account.</p>
              <form onSubmit={doLogin}>
                <Field label="Email" htmlFor="email">
                  <input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
                </Field>
                <Field label="Password" htmlFor="password">
                  <input id="password" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required />
                </Field>
                <button className="btn btn-primary btn-block btn-lg" disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</button>
              </form>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--muted)', fontSize: 13, margin: '18px 0' }}>
                <span style={{ flex: 1, height: 1, background: 'var(--border)' }} /> or <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              <button type="button" className="btn btn-soft btn-block" onClick={() => { resetPhoneFlow(); setPhoneMode(true); }}>
                <IconPhone /> Continue with phone
              </button>
              <p className="sub" style={{ textAlign: 'center', marginTop: 18 }}>
                New to Servio? <button type="button" className="btn btn-link" style={{ display: 'inline', padding: 0 }} onClick={() => switchTab('signup')}>Create an account</button>
              </p>
            </>
          )}

          {/* ------------------------------------------- Log in → phone (OTP) */}
          {tab === 'login' && phoneMode && !otpSent && (
            <>
              <h1>Continue with phone</h1>
              <p className="sub">We'll text you a one-time code to sign in.</p>
              <form onSubmit={sendOtp}>
                <Field label="Phone number" hint="Use international format, e.g. +1234567890." htmlFor="phone">
                  <div className="input-icon">
                    <IconPhone />
                    <input id="phone" className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" required autoFocus />
                  </div>
                </Field>
                <button className="btn btn-primary btn-block btn-lg" disabled={loading}>
                  {loading ? 'Sending…' : <>Send code <IconArrowRight /></>}
                </button>
              </form>
              <button type="button" className="btn btn-link btn-block mt-8" onClick={() => setPhoneMode(false)}>← Back to email login</button>
            </>
          )}

          {tab === 'login' && phoneMode && otpSent && (
            <>
              <h1>Enter your code</h1>
              <p className="sub">We sent a code to <b>{phone}</b>.</p>
              {devOtp ? (
                <div className="otp-hint">
                  <IconInfo /> Test mode — your code is <b style={{ letterSpacing: '0.15em' }}>{devOtp}</b>. It's filled in below, just press <b>Sign in</b>.
                </div>
              ) : (
                <div className="otp-hint"><IconInfo /> In development the code is logged to the backend console (test mode uses <b>1234</b>).</div>
              )}
              <form onSubmit={verifyOtp}>
                <Field label="Verification code" htmlFor="otp">
                  <input id="otp" className="input" inputMode="numeric" value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="1234" required autoFocus style={{ letterSpacing: '0.3em', fontSize: 18, fontWeight: 600 }} />
                </Field>
                <button className="btn btn-primary btn-block btn-lg" disabled={loading}>{loading ? 'Verifying…' : 'Sign in'}</button>
                <button type="button" className="btn btn-link btn-block mt-8" onClick={() => { setOtpSent(false); setOtp(''); setDevOtp(null); }}>Use a different number</button>
              </form>
            </>
          )}

          {/* --------------------------------------------------------- Sign up */}
          {tab === 'signup' && (
            <>
              <h1>Create your account</h1>
              <p className="sub">Join Servio as a customer or a service provider.</p>
              <form onSubmit={doSignup}>
                <Field label="Your name" htmlFor="su-name">
                  <input id="su-name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
                </Field>
                <Field label="Email" htmlFor="su-email">
                  <input id="su-email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                </Field>
                <Field label="Password" hint="At least 8 characters." htmlFor="su-pass">
                  <input id="su-pass" className="input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" minLength={8} required />
                </Field>
                <Field label="Phone number" hint="Used so customers and providers can contact you." htmlFor="su-phone">
                  <div className="input-icon">
                    <IconPhone />
                    <input id="su-phone" className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" required />
                  </div>
                </Field>
                {roleField}
                <button className="btn btn-primary btn-block btn-lg" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
              </form>
              <p className="sub" style={{ textAlign: 'center', marginTop: 18 }}>
                Already have an account? <button type="button" className="btn btn-link" style={{ display: 'inline', padding: 0 }} onClick={() => switchTab('login')}>Log in</button>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
