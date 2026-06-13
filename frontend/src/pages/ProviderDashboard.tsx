import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi, leadsApi, providersApi, paymentsApi } from '../api/client';
import type { Job, Lead, ProviderProfile } from '../api/client';
import './ProviderDashboard.css';

function getCustomerName(j: Job): string {
  const c = j.customerId;
  if (!c || typeof c === 'string') return 'Customer';
  return (c as { name?: string }).name || (c as { phoneNumber?: string }).phoneNumber || 'Customer';
}

function getLeadCustomer(l: Lead): string {
  const c = l.customerId;
  if (!c || typeof c === 'string') return 'Customer';
  return (c as { name?: string }).name || (c as { phoneNumber?: string }).phoneNumber || 'Customer';
}

export default function ProviderDashboard() {
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [earnings, setEarnings] = useState<{ totalEarned: number; pendingAmount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      providersApi.getMyProfile().then((p) => setProfile(p ?? null)),
      jobsApi.myList().then(setJobs),
      leadsApi.myLeads().then(setLeads),
      paymentsApi.earnings().then(setEarnings).catch(() => setEarnings(null)),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="muted">Loading dashboard…</p>;

  return (
    <div className="provider-dashboard">
      <h1 className="page-title">Dashboard</h1>

      {!profile && (
        <div className="card dashboard-section">
          <h2>Provider profile</h2>
          <p className="muted">You haven't created a provider profile yet.</p>
          <Link to="/edit-profile" className="btn btn-primary">Create profile</Link>
        </div>
      )}

      {profile && (
        <div className="card dashboard-section">
          <h2>Your profile</h2>
          <p>{profile.serviceDescription || 'No description'}</p>
          <p className="meta">Categories: {Array.isArray(profile.serviceCategories)
            ? (profile.serviceCategories as { name: string }[]).map((c) => c.name).join(', ')
            : '—'}
          </p>
          <p className="meta">Status: <strong>{profile.verificationStatus}</strong> · ★ {profile.ratingAverage.toFixed(1)} ({profile.reviewCount} reviews)</p>
          <div className="dashboard-links">
            <Link to={`/provider/${(profile.userId as { _id?: string })?._id ?? profile.userId}`} className="dashboard-link">
              View public profile →
            </Link>
            <Link to="/edit-profile" className="dashboard-link">Edit profile →</Link>
            <Link to="/subscriptions" className="dashboard-link">Subscription →</Link>
          </div>
        </div>
      )}

      {earnings && (
        <div className="card dashboard-section">
          <h2>Earnings</h2>
          <div className="earnings-row">
            <div>
              <span className="meta">Total earned</span>
              <p className="earning-value">${earnings.totalEarned.toFixed(2)}</p>
            </div>
            <div>
              <span className="meta">Pending</span>
              <p className="earning-value">${earnings.pendingAmount.toFixed(2)}</p>
            </div>
          </div>
          <Link to="/payments" className="dashboard-link">View invoices & payments →</Link>
        </div>
      )}

      <div className="card dashboard-section">
        <h2>Job requests</h2>
        {jobs.length === 0 ? (
          <p className="muted">No job requests yet.</p>
        ) : (
          <ul className="dashboard-list">
            {jobs.map((j) => (
              <li key={j._id}>
                <span>{getCustomerName(j)}</span>
                <span className="status">{j.status}</span>
                <Link to="/my-jobs">Manage</Link>
              </li>
            ))}
          </ul>
        )}
        <Link to="/my-jobs" className="dashboard-link">Manage all jobs →</Link>
      </div>

      <div className="card dashboard-section">
        <h2>Leads</h2>
        {leads.length === 0 ? (
          <p className="muted">No leads yet. When customers contact you, they’ll appear here.</p>
        ) : (
          <ul className="dashboard-list">
            {leads.map((l) => (
              <li key={l._id}>
                <span>{getLeadCustomer(l)}</span>
                <span className="muted">{new Date(l.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
