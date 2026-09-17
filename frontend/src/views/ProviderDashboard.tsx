'use client';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@/lib/router-compat';
import {
  providersApi, jobsApi, leadsApi, subscriptionsApi,
  type ProviderProfile, type Job, type Lead, type ProviderSubscription,
} from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { userName, relativeTime, formatDate, verificationMeta } from '../lib/format';
import { Avatar, PageLoader, EmptyState } from '../components/ui';
import {
  IconBriefcase, IconInbox, IconStar, IconClock, IconCheck, IconX,
  IconShieldCheck, IconAlert, IconUser, IconSparkle, IconArrowRight, IconPhone,
} from '../components/icons';

export default function ProviderDashboard() {
  const toast = useToast();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sub, setSub] = useState<ProviderSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      providersApi.getMyProfile().then(setProfile),
      jobsApi.myList().then(setJobs).catch(() => {}),
      leadsApi.myLeads().then(setLeads).catch(() => {}),
      subscriptionsApi.me().then(setSub).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const update = async (id: string, status: 'accepted' | 'rejected' | 'completed') => {
    setUpdating(id);
    try {
      const updated = await jobsApi.updateStatus(id, status);
      setJobs((prev) => prev.map((j) => (j._id === id ? { ...j, ...updated } : j)));
      toast.success(`Job ${status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className="page"><PageLoader /></div>;

  // Onboarding state — no profile yet
  if (!profile) {
    return (
      <div className="page-narrow">
        <div className="card card-pad center" style={{ padding: 40 }}>
          <div className="empty-icon" style={{ margin: '0 auto 16px', width: 56, height: 56, color: 'var(--primary)', background: 'var(--primary-50)' }}><IconSparkle /></div>
          <h1 style={{ fontSize: 24 }}>Set up your provider profile</h1>
          <p className="muted" style={{ maxWidth: 420, margin: '10px auto 22px' }}>
            Create your profile so customers can discover you. Once an admin verifies you, you’ll appear in search results.
          </p>
          <Link to="/dashboard/profile" className="btn btn-primary btn-lg">Create my profile <IconArrowRight /></Link>
        </div>
      </div>
    );
  }

  const pending = jobs.filter((j) => j.status === 'requested');
  const accepted = jobs.filter((j) => j.status === 'accepted');
  // Older profiles can have an empty verification status. Treat those safely as pending.
  const verif = verificationMeta(profile.verificationStatus);
  const publicProfileUserId = typeof profile.userId === 'string' ? profile.userId : profile.userId?._id;

  const stats = [
    { label: 'New requests', value: pending.length, icon: <IconInbox /> },
    { label: 'Active jobs', value: accepted.length, icon: <IconBriefcase /> },
    { label: 'Total leads', value: leads.length, icon: <IconPhone /> },
    { label: 'Rating', value: profile.reviewCount > 0 ? profile.ratingAverage.toFixed(1) : '—', icon: <IconStar /> },
  ];

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Manage your requests, leads, and profile.</p>

      {/* Verification banner */}
      {profile.verificationStatus !== 'approved' && (
        <div className={`banner ${profile.verificationStatus === 'rejected' ? 'banner-warn' : 'banner-info'} mb-16`}>
          <IconAlert />
          <div>
            <b>{profile.verificationStatus === 'rejected' ? 'Verification rejected' : 'Verification pending'}</b>
            <div className="small">You won’t appear in customer search until an admin verifies your account. Upload documents from your profile page.</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-stats mb-24">
        {stats.map((s) => (
          <div key={s.label} className="card stat">
            <div className="stat-label">{s.icon} {s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        {/* Job requests */}
        <div className="card card-pad">
          <div className="section-head"><h2>Job requests</h2><Link to="/my-jobs" className="btn-link small">View all</Link></div>
          {jobs.length === 0 ? (
            <EmptyState icon={<IconBriefcase />} title="No requests yet">Requests from customers will appear here.</EmptyState>
          ) : (
            jobs.slice(0, 5).map((j) => (
              <div key={j._id} className="list-row">
                <Avatar name={userName(j.customerId, 'Customer')} size="sm" />
                <div className="lr-main">
                  <div className="lr-title">{userName(j.customerId, 'Customer')}</div>
                  <div className="lr-sub">{j.description ? j.description.slice(0, 60) : 'No message'} · {relativeTime(j.createdAt)}</div>
                </div>
                {j.status === 'requested' ? (
                  <div className="lr-actions">
                    <button className="btn btn-success btn-sm btn-icon" title="Accept" onClick={() => update(j._id, 'accepted')} disabled={updating === j._id}><IconCheck /></button>
                    <button className="btn btn-ghost btn-sm btn-icon" title="Decline" onClick={() => update(j._id, 'rejected')} disabled={updating === j._id}><IconX /></button>
                  </div>
                ) : j.status === 'accepted' ? (
                  <div className="lr-actions">
                    <button className="btn btn-primary btn-sm btn-icon" title="Mark completed" onClick={() => update(j._id, 'completed')} disabled={updating === j._id}><IconCheck /></button>
                  </div>
                ) : (
                  <span className={`badge ${({ accepted: 'badge-success', completed: 'badge-primary', rejected: 'badge-danger', cancelled: 'badge', requested: 'badge-warning' } as Record<string, string>)[j.status]}`}>{j.status}</span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Leads */}
        <div className="card card-pad">
          <div className="section-head"><h2>Recent leads</h2></div>
          {leads.length === 0 ? (
            <EmptyState icon={<IconPhone />} title="No leads yet">When customers reveal your contact, they show up here.</EmptyState>
          ) : (
            leads.slice(0, 6).map((l) => (
              <div key={l._id} className="list-row">
                <Avatar name={userName(l.customerId, 'Customer')} size="sm" />
                <div className="lr-main">
                  <div className="lr-title">{userName(l.customerId, 'Customer')}</div>
                  <div className="lr-sub">Contacted you · {relativeTime(l.createdAt)}</div>
                </div>
                {typeof l.customerId === 'object' && l.customerId.phoneNumber && (
                  <a href={`tel:${l.customerId.phoneNumber}`} className="btn btn-soft btn-sm"><IconPhone /> Call</a>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Profile + subscription */}
      <div className="grid grid-2 mt-24">
        <div className="card card-pad">
          <div className="section-head"><h2>Your profile</h2><span className={`badge ${verif.cls}`}>{profile.verificationStatus === 'approved' && <IconShieldCheck />}{verif.label}</span></div>
          <p className="muted" style={{ marginTop: 0 }}>{profile.serviceDescription || 'No description yet.'}</p>
          <div className="row gap-8 wrap mt-8">
            <Link to="/dashboard/profile" className="btn btn-ghost btn-sm"><IconUser /> Edit profile</Link>
            {publicProfileUserId && <Link to={`/provider/${publicProfileUserId}`} className="btn btn-ghost btn-sm">View public page</Link>}
          </div>
        </div>

        <div className="card card-pad">
          <div className="section-head"><h2>Subscription</h2><Link to="/dashboard/subscription" className="btn-link small">Manage</Link></div>
          {sub && typeof sub.planId === 'object' ? (
            <div>
              <div className="row between">
                <b style={{ fontSize: 16 }}>{sub.planId.name}</b>
                <span className="badge badge-success badge-dot">Active</span>
              </div>
              <div className="muted small mt-8 row gap-6"><IconClock style={{ width: 14, height: 14 }} /> Renews / ends {formatDate(sub.endDate)}</div>
              <div className="muted small mt-8">Leads used: <b>{sub.leadUsed}</b> / {sub.planId.leadLimit}</div>
            </div>
          ) : (
            <EmptyState icon={<IconSparkle />} title="No active plan">Subscribe to get more leads and a visibility boost.</EmptyState>
          )}
        </div>
      </div>
    </div>
  );
}
