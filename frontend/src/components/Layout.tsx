import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notificationsApi, messagesApi } from '../api/client';
import './Layout.css';

export default function Layout() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);

  useEffect(() => {
    if (!token) {
      setUnreadNotifs(0);
      setUnreadMsgs(0);
      return;
    }
    const load = () => {
      notificationsApi.unreadCount().then((r) => setUnreadNotifs(r.count)).catch(() => {});
      messagesApi.unreadCount().then((r) => setUnreadMsgs(r.count)).catch(() => {});
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [token, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo">
          <span className="logo-serif">Microbusiness</span>
        </Link>
        <nav className="nav">
          {token && user?.role === 'customer' && (
            <>
              <Link to="/my-jobs" className="nav-link">My jobs</Link>
              <Link to="/favorites" className="nav-link">Favorites</Link>
              <Link to="/payments" className="nav-link">Payments</Link>
            </>
          )}
          {token && user?.role === 'provider' && (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/my-jobs" className="nav-link">Jobs</Link>
              <Link to="/payments" className="nav-link">Payments</Link>
            </>
          )}
          {token && user?.role === 'admin' && (
            <Link to="/admin" className="nav-link">Admin</Link>
          )}
          {token && (
            <>
              <Link to="/messages" className="nav-link nav-badge">
                Messages
                {unreadMsgs > 0 && <span className="badge">{unreadMsgs}</span>}
              </Link>
              <Link to="/notifications" className="nav-link nav-badge">
                Notifications
                {unreadNotifs > 0 && <span className="badge">{unreadNotifs}</span>}
              </Link>
            </>
          )}
          {token ? (
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>
              Sign out
            </button>
          ) : (
            <Link to="/login" className="btn btn-primary">Sign in</Link>
          )}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
