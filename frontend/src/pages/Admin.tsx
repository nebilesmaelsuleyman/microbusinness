import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import type { Category, ProviderProfile } from '../api/client';
import './Admin.css';

type Tab = 'providers' | 'categories' | 'plans' | 'stats';

export default function Admin() {
  const [tab, setTab] = useState<Tab>('providers');
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [jobStats, setJobStats] = useState<Record<string, number>>({});
  const [revenue, setRevenue] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState(0);
  const [planLeads, setPlanLeads] = useState(10);
  const [planDays, setPlanDays] = useState(30);

  const loadAll = () => {
    Promise.all([
      adminApi.providers().then((r) => setProviders(r.data || [])).catch(() => {}),
      adminApi.categories().then(setCategories).catch(() => {}),
      adminApi.jobStats().then(setJobStats).catch(() => {}),
      adminApi.revenueStats().then(setRevenue).catch(() => {}),
    ]).finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const handleVerify = async (providerId: string, status: 'approved' | 'rejected') => {
    try {
      await adminApi.setProviderVerification(providerId, status);
      setProviders((prev) =>
        prev.map((p) => (p._id === providerId ? { ...p, verificationStatus: status } : p)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const cat = await adminApi.createCategory({ name: newCatName.trim(), description: newCatDesc.trim() });
      setCategories((prev) => [...prev, cat]);
      setNewCatName('');
      setNewCatDesc('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;
    try {
      await adminApi.createPlan({
        name: planName.trim(),
        price: planPrice,
        leadLimit: planLeads,
        durationDays: planDays,
      });
      setPlanName('');
      setPlanPrice(0);
      setError('');
      alert('Plan created');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  };

  if (loading) return <p className="muted">Loading admin…</p>;

  return (
    <div className="admin-page">
      <h1 className="page-title">Admin panel</h1>
      {error && <p className="error-msg">{error}</p>}

      <div className="admin-tabs">
        {(['providers', 'categories', 'plans', 'stats'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`admin-tab ${tab === t ? 'admin-tab-active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'providers' && (
        <section className="admin-section">
          <h2>Provider verification</h2>
          {providers.length === 0 ? (
            <p className="muted">No providers.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => {
                  const u = p.userId;
                  const name = typeof u === 'object' && u && 'name' in u ? u.name || u.phoneNumber : '—';
                  return (
                    <tr key={p._id}>
                      <td>{name}</td>
                      <td>
                        <span className={`verify-badge verify-${p.verificationStatus}`}>
                          {p.verificationStatus}
                        </span>
                      </td>
                      <td>★ {p.ratingAverage.toFixed(1)} ({p.reviewCount})</td>
                      <td>
                        {p.verificationStatus !== 'approved' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleVerify(p._id, 'approved')}
                          >
                            Approve
                          </button>
                        )}
                        {p.verificationStatus !== 'rejected' && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleVerify(p._id, 'rejected')}
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      )}

      {tab === 'categories' && (
        <section className="admin-section">
          <h2>Service categories</h2>
          <ul className="admin-list">
            {categories.map((c) => (
              <li key={c._id}>
                <strong>{c.name}</strong>
                {c.description && <span className="muted"> — {c.description}</span>}
              </li>
            ))}
          </ul>
          <form onSubmit={handleCreateCategory} className="card admin-form">
            <h3>Add category</h3>
            <div className="input-group">
              <label htmlFor="cat-name">Name</label>
              <input
                id="cat-name"
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="cat-desc">Description</label>
              <input
                id="cat-desc"
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">Create</button>
          </form>
        </section>
      )}

      {tab === 'plans' && (
        <section className="admin-section">
          <h2>Subscription plans</h2>
          <form onSubmit={handleCreatePlan} className="card admin-form">
            <h3>Create plan</h3>
            <div className="input-group">
              <label htmlFor="plan-name">Name</label>
              <input
                id="plan-name"
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>
            <div className="input-row">
              <div className="input-group">
                <label htmlFor="plan-price">Price ($)</label>
                <input
                  id="plan-price"
                  type="number"
                  min="0"
                  value={planPrice}
                  onChange={(e) => setPlanPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="input-group">
                <label htmlFor="plan-leads">Lead limit</label>
                <input
                  id="plan-leads"
                  type="number"
                  min="1"
                  value={planLeads}
                  onChange={(e) => setPlanLeads(parseInt(e.target.value, 10) || 1)}
                />
              </div>
              <div className="input-group">
                <label htmlFor="plan-days">Duration (days)</label>
                <input
                  id="plan-days"
                  type="number"
                  min="1"
                  value={planDays}
                  onChange={(e) => setPlanDays(parseInt(e.target.value, 10) || 1)}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Create plan</button>
          </form>
        </section>
      )}

      {tab === 'stats' && (
        <section className="admin-section">
          <h2>Platform stats</h2>
          <div className="stats-grid">
            <div className="card">
              <h3>Jobs by status</h3>
              <ul className="admin-list">
                {Object.entries(jobStats).map(([status, count]) => (
                  <li key={status}>
                    <span>{status}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
                {Object.keys(jobStats).length === 0 && <li className="muted">No jobs yet</li>}
              </ul>
            </div>
            <div className="card">
              <h3>Revenue</h3>
              <ul className="admin-list">
                {Object.entries(revenue).map(([k, v]) => (
                  <li key={k}>
                    <span>{k}</span>
                    <strong>{String(v)}</strong>
                  </li>
                ))}
                {Object.keys(revenue).length === 0 && <li className="muted">No data</li>}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
