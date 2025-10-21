'use client';
import { useState, useEffect } from 'react';
import { Link } from '@/lib/router-compat';
import { jobsApi, type Job, type JobStatus } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { userName, relativeTime, formatDate, STATUS_META } from '../lib/format';
import { Avatar, PageLoader, EmptyState } from '../components/ui';
import { IconBriefcase, IconCheck, IconX, IconCalendar, IconInbox } from '../components/icons';

const FILTERS: { key: string; label: string; match: (s: JobStatus) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'active', label: 'Active', match: (s) => s === 'requested' || s === 'accepted' },
  { key: 'requested', label: 'Requested', match: (s) => s === 'requested' },
  { key: 'accepted', label: 'Accepted', match: (s) => s === 'accepted' },
  { key: 'closed', label: 'Closed', match: (s) => s === 'completed' || s === 'rejected' || s === 'cancelled' },
];

export default function MyJobs() {
  const { user } = useAuth();
  const toast = useToast();
  const isProvider = user?.role === 'provider';

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    jobsApi.myList().then(setJobs).catch(() => setJobs([])).finally(() => setLoading(false));
  }, []);

  const update = async (id: string, status: JobStatus) => {
    setUpdating(id);
    try {
      const updated = await jobsApi.updateStatus(id, status);
      setJobs((prev) => prev.map((j) => (j._id === id ? { ...j, ...updated } : j)));
      toast.success(`Job ${status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update job');
    } finally {
      setUpdating(null);
    }
  };

  const providerUid = (j: Job): string | null => {
    const p = j.providerId;
    if (p && typeof p === 'object' && p.userId) {
      return typeof p.userId === 'string' ? p.userId : p.userId._id;
    }
    return null;
  };

  // The other party in the job, used to open a direct chat about it.
  const counterparty = (j: Job): { id: string; name: string } | null => {
    if (isProvider) {
      const c = j.customerId;
      if (c && typeof c === 'object') return { id: c._id, name: c.name || 'Customer' };
      return null;
    }
    const uid = providerUid(j);
    if (!uid) return null;
    const p = j.providerId;
    const name =
      p && typeof p === 'object' && p.userId && typeof p.userId === 'object' && p.userId.name
        ? p.userId.name
        : 'Provider';
    return { id: uid, name };
  };

  const visible = jobs.filter((j) => FILTERS.find((f) => f.key === filter)!.match(j.status));

  if (loading) return <div className="page"><PageLoader /></div>;

  return (
    <div className="page">
      <h1 className="page-title">{isProvider ? 'Job requests' : 'My jobs'}</h1>
      <p className="page-sub">{isProvider ? 'Requests customers have sent you. Accept or decline below.' : 'Track the jobs you’ve requested from providers.'}</p>

      <div className="cat-scroll mb-16">
        {FILTERS.map((f) => (
          <button key={f.key} className={`chip${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card card-pad">
          <EmptyState icon={<IconBriefcase />} title="No jobs here">
            {isProvider
              ? 'When customers request jobs, they’ll show up here.'
              : <>You haven’t requested any jobs yet. <Link to="/">Find a provider</Link> to get started.</>}
          </EmptyState>
        </div>
      ) : (
        <div className="card card-pad">
          {visible.map((j) => {
            const meta = STATUS_META[j.status];
            const uid = providerUid(j);
            return (
              <div key={j._id} className="list-row">
                <Avatar name={isProvider ? userName(j.customerId, 'Customer') : 'P'} size="md" />
                <div className="lr-main">
                  <div className="lr-title">
                    {isProvider ? userName(j.customerId, 'Customer') : (uid ? <Link to={`/provider/${uid}`}>View provider</Link> : 'Provider')}
                  </div>
                  {j.description && <div className="lr-sub" style={{ color: 'var(--ink-2)' }}>{j.description}</div>}
                  <div className="lr-sub row gap-12 wrap">
                    <span className={`badge ${meta.cls}`}>{meta.label}</span>
                    <span>Requested {relativeTime(j.createdAt)}</span>
                    {j.scheduledDate && <span className="row gap-4"><IconCalendar style={{ width: 13, height: 13 }} /> {formatDate(j.scheduledDate)}</span>}
                  </div>
                </div>
                <div className="lr-actions">
                  {(() => {
                    const cp = counterparty(j);
                    return cp ? (
                      <Link
                        to={`/messages?to=${cp.id}&name=${encodeURIComponent(cp.name)}`}
                        className="btn btn-soft btn-sm"
                        title={`Message ${cp.name}`}
                      >
                        <IconInbox /> Message
                      </Link>
                    ) : null;
                  })()}
                  {isProvider && j.status === 'requested' && (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => update(j._id, 'accepted')} disabled={updating === j._id}><IconCheck /> Accept</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => update(j._id, 'rejected')} disabled={updating === j._id}><IconX /> Decline</button>
                    </>
                  )}
                  {!isProvider && (j.status === 'requested' || j.status === 'accepted') && (
                    <button className="btn btn-danger btn-sm" onClick={() => update(j._id, 'cancelled')} disabled={updating === j._id}>Cancel</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
