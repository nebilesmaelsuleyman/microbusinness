'use client';
import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from '@/lib/router-compat';
import { useAuth } from '../contexts/AuthContext';
import { messagesApi } from '../api/client';
import { Avatar } from './ui';
import {
  IconBolt, IconBriefcase, IconHeart, IconLayout, IconShield,
  IconUser, IconSettings, IconLogout, IconChevronDown, IconSearch, IconInbox,
  IconWrench, IconZap, IconPaintbrush, IconHammer, IconTree, IconCamera,
  IconTruck, IconScissors, IconActivity, IconDroplets, IconSun, IconWifi,
  IconArrowRight,
} from './icons';

/* ── Service mega-menu data ── */
const SERVICE_CATEGORIES = [
  { icon: <IconWrench />, label: 'Plumbing', desc: 'Pipes, leaks & drainage', color: '#0ea5e9' },
  { icon: <IconZap />, label: 'Electrical', desc: 'Wiring, panels & outlets', color: '#f59e0b' },
  { icon: <IconPaintbrush />, label: 'Painting', desc: 'Interior & exterior', color: '#8b5cf6' },
  { icon: <IconHammer />, label: 'Carpentry', desc: 'Furniture & woodwork', color: '#d97706' },
  { icon: <IconTree />, label: 'Landscaping', desc: 'Gardens & lawn care', color: '#16a34a' },
  { icon: <IconCamera />, label: 'Photography', desc: 'Events & portraits', color: '#ec4899' },
  { icon: <IconTruck />, label: 'Moving', desc: 'Packing & relocation', color: '#6366f1' },
  { icon: <IconScissors />, label: 'Hair & Beauty', desc: 'Salon & grooming', color: '#f43f5e' },
  { icon: <IconActivity />, label: 'Healthcare', desc: 'Nursing & wellness', color: '#14b8a6' },
  { icon: <IconDroplets />, label: 'Cleaning', desc: 'Home & office cleaning', color: '#3b82f6' },
  { icon: <IconSun />, label: 'HVAC', desc: 'Heating, cooling & air', color: '#f97316' },
  { icon: <IconWifi />, label: 'IT & Tech', desc: 'Repairs & networking', color: '#64748b' },
];

/* ── Mega-dropdown ── */
function ServicesMegaMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="mega-menu" role="menu">
      <div className="mega-inner">
        <div className="mega-grid">
          {SERVICE_CATEGORIES.map((s) => (
            <Link
              key={s.label}
              to={`/?service=${encodeURIComponent(s.label)}`}
              className="mega-item"
              onClick={onClose}
              role="menuitem"
            >
              <span className="mega-ic" style={{ '--ic-color': s.color } as React.CSSProperties}>
                {s.icon}
              </span>
              <span className="mega-text">
                <span className="mega-label">{s.label}</span>
                <span className="mega-desc">{s.desc}</span>
              </span>
            </Link>
          ))}
        </div>
        <div className="mega-footer">
          <Link to="/" className="mega-all" onClick={onClose}>
            View all services <IconArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Services nav button ── */
function ServicesNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="services-nav" ref={ref}>
      <button
        className={`nav-link services-btn${open ? ' open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 17, height: 17 }}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
        Services
        <IconChevronDown
          style={{
            width: 14, height: 14,
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      {open && <ServicesMegaMenu onClose={() => setOpen(false)} />}
    </div>
  );
}

/* ── User dropdown ── */
function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  const go = (path: string) => { setOpen(false); navigate(path); };

  return (
    <div className="usermenu" ref={ref}>
      <button className="usermenu-btn" onClick={() => setOpen((o) => !o)}>
        <Avatar name={user.name || 'U'} src={user.profilePhoto} size="sm" />
        <IconChevronDown style={{ width: 15, height: 15 }} />
      </button>
      {open && (
        <div className="usermenu-pop">
          <div className="usermenu-head">
            <div className="name">{user.name || 'Welcome'}</div>
            <div className="role">{user.role}</div>
          </div>
          {user.role === 'customer' && (
            <>
              <button className="mi" onClick={() => go('/my-jobs')}><IconBriefcase /> My jobs</button>
              <button className="mi" onClick={() => go('/favorites')}><IconHeart /> Saved providers</button>
            </>
          )}
          {user.role === 'provider' && (
            <>
              <button className="mi" onClick={() => go('/dashboard')}><IconLayout /> Dashboard</button>
              <button className="mi" onClick={() => go('/dashboard/profile')}><IconUser /> My profile</button>
            </>
          )}
          {user.role === 'admin' && (
            <button className="mi" onClick={() => go('/admin')}><IconShield /> Admin panel</button>
          )}
          <button className="mi" onClick={() => go('/account')}><IconSettings /> Account settings</button>
          <button className="mi" onClick={() => { logout(); navigate('/login'); }}><IconLogout /> Sign out</button>
        </div>
      )}
    </div>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [unread, setUnread] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!token) { setUnread(0); return; }
    let alive = true;
    const tick = () => messagesApi.unreadCount().then((r) => { if (alive) setUnread(r.count); }).catch(() => {});
    tick();
    const id = setInterval(tick, 10000);
    return () => { alive = false; clearInterval(id); };
  }, [token]);

  return (
    <div className="layout">
      <header className={`header${scrolled ? ' header-scrolled' : ''}`}>
        <div className="header-inner">
          <Link to="/" className="logo">
            <span className="logo-mark"><IconBolt /></span>
            Servio
          </Link>

          <nav className="nav">
            <NavLink to="/" end className="nav-link">
              <IconSearch style={{ width: 17, height: 17 }} /> Find pros
            </NavLink>

            {/* Services mega-menu */}
            <ServicesNav />

            {token && user?.role === 'customer' && (
              <>
                <NavLink to="/my-jobs" className="nav-link"><IconBriefcase /> My jobs</NavLink>
                <NavLink to="/favorites" className="nav-link"><IconHeart /> Saved</NavLink>
              </>
            )}
            {token && user?.role === 'provider' && (
              <NavLink to="/dashboard" className="nav-link"><IconLayout /> Dashboard</NavLink>
            )}
            {token && user?.role === 'admin' && (
              <NavLink to="/admin" className="nav-link"><IconShield /> Admin</NavLink>
            )}

            {token && (
              <NavLink to="/messages" className="nav-link">
                <IconInbox /> Messages
                {unread > 0 && <span className="badge badge-primary" style={{ marginLeft: 4 }}>{unread}</span>}
              </NavLink>
            )}

            {token ? (
              <UserMenu />
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm" style={{ marginLeft: 6 }}>Sign in</Link>
                <Link to="/login" className="btn btn-primary btn-sm" style={{ marginLeft: 4 }}>Join free</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="main">{children}</main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand footer-intro">
            <Link to="/" className="logo" style={{ fontSize: 18 }}>
              <span className="logo-mark"><IconBolt /></span>
              Servio
            </Link>
            <p className="footer-tagline">A simpler way to find dependable local professionals, right where you live.</p>
          </div>
          <div className="footer-column">
            <strong>Explore</strong>
            <Link to="/">Find a professional</Link>
            <Link to="/login">Create an account</Link>
          </div>
          <div className="footer-column">
            <strong>For professionals</strong>
            <Link to="/login">Join Servio</Link>
            <Link to="/dashboard">Manage your profile</Link>
          </div>
          <div className="footer-column footer-cities">
            <strong>Serving Ethiopia</strong>
            <span>Addis Ababa · Jimma · Hawassa</span>
            <span>Bahir Dar · Dire Dawa · Adama</span>
          </div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Servio. All rights reserved.</span><span>Verified local professionals · Built for Ethiopia</span></div>
      </footer>
    </div>
  );
}
