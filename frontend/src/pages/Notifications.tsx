import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../api/client';
import type { Notification } from '../api/client';
import './Notifications.css';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    notificationsApi.list().then(setNotifs).catch(() => setNotifs([])).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleClick = async (n: Notification) => {
    if (!n.read) {
      await notificationsApi.markRead(n._id);
      setNotifs((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
    }
    const data = n.data as { jobId?: string; conversationId?: string; invoiceId?: string };
    if (data.conversationId) navigate('/messages');
    else if (data.jobId) navigate('/my-jobs');
    else if (data.invoiceId) navigate('/payments');
  };

  const handleMarkAll = async () => {
    await notificationsApi.markAllRead();
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = async (id: string) => {
    await notificationsApi.delete(id);
    setNotifs((prev) => prev.filter((n) => n._id !== id));
  };

  if (loading) return <p className="muted">Loading notifications…</p>;

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <div className="notifications-page">
      <div className="notif-header">
        <h1 className="page-title">Notifications</h1>
        {unreadCount > 0 && (
          <button type="button" className="btn btn-ghost" onClick={handleMarkAll}>
            Mark all read ({unreadCount})
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <p className="muted">No notifications yet.</p>
      ) : (
        <ul className="notif-list">
          {notifs.map((n) => (
            <li key={n._id} className={`notif-item card ${n.read ? '' : 'notif-unread'}`}>
              <button type="button" className="notif-content" onClick={() => handleClick(n)}>
                <span className="notif-title">{n.title}</span>
                {n.body && <span className="notif-body">{n.body}</span>}
                <span className="notif-time">{new Date(n.createdAt).toLocaleString()}</span>
              </button>
              <button
                type="button"
                className="notif-delete"
                onClick={() => handleDelete(n._id)}
                aria-label="Delete notification"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
