import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi, jobsExtApi, paymentsApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Job } from '../api/client';
import './MyJobs.css';

function getProviderLink(j: Job): string {
  const p = j.providerId;
  if (!p) return '#';
  const uid = typeof p === 'object' && p && 'userId' in p ? (p as { userId: string }).userId : null;
  if (uid) return `/provider/${uid}`;
  return '#';
}

function getCustomerName(j: Job): string {
  const c = j.customerId;
  if (!c || typeof c === 'string') return 'Customer';
  return (c as { name?: string }).name || (c as { phoneNumber?: string }).phoneNumber || 'Customer';
}

export default function MyJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    jobsApi.myList().then(setJobs).catch(() => setJobs([])).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const updated = await jobsApi.updateStatus(id, status);
      setJobs((prev) => prev.map((j) => (j._id === id ? updated : j)));
    } finally {
      setUpdating(null);
    }
  };

  const handleComplete = async (id: string) => {
    const priceStr = prompt('Final price (optional):');
    const notes = prompt('Completion notes (optional):') || undefined;
    setUpdating(id);
    try {
      const finalPrice = priceStr ? parseFloat(priceStr) : undefined;
      const updated = await jobsExtApi.complete(id, { finalPrice, completionNotes: notes });
      setJobs((prev) => prev.map((j) => (j._id === id ? updated : j)));
    } finally {
      setUpdating(null);
    }
  };

  const handleQuote = async (id: string) => {
    const priceStr = prompt('Quoted price:');
    if (!priceStr) return;
    const price = parseFloat(priceStr);
    if (isNaN(price) || price < 0) return;
    setUpdating(id);
    try {
      const updated = await jobsExtApi.setQuote(id, price);
      setJobs((prev) => prev.map((j) => (j._id === id ? updated : j)));
    } finally {
      setUpdating(null);
    }
  };

  const handleInvoice = async (id: string) => {
    const desc = prompt('Invoice line description:') || 'Service';
    const amountStr = prompt('Amount:');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;
    setUpdating(id);
    try {
      await paymentsApi.createInvoice({
        jobId: id,
        lineItems: [{ description: desc, quantity: 1, unitPrice: amount }],
      });
      alert('Invoice created');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <p className="muted">Loading your jobs…</p>;

  return (
    <div className="my-jobs">
      <h1 className="page-title">My jobs</h1>
      {jobs.length === 0 ? (
        <p className="muted">No jobs yet. <Link to="/">Find a provider</Link> and request a job.</p>
      ) : (
        <ul className="job-list">
          {jobs.map((j) => (
            <li key={j._id} className="job-card card">
              <div className="job-main">
                {user?.role === 'customer' && (
                  <Link to={getProviderLink(j)} className="job-provider-link">
                    View provider →
                  </Link>
                )}
                {user?.role === 'provider' && (
                  <span className="job-customer">From: {getCustomerName(j)}</span>
                )}
                {j.description && <p className="job-desc">{j.description}</p>}
                <p className="job-meta">
                  Status: <strong>{j.status}</strong>
                  {j.scheduledDate && ` · ${new Date(j.scheduledDate).toLocaleDateString()}`}
                </p>
              </div>
              <div className="job-actions">
                {user?.role === 'provider' && j.status === 'requested' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => updateStatus(j._id, 'accepted')}
                      disabled={updating === j._id}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => handleQuote(j._id)}
                      disabled={updating === j._id}
                    >
                      Quote
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => updateStatus(j._id, 'rejected')}
                      disabled={updating === j._id}
                    >
                      Reject
                    </button>
                  </>
                )}
                {user?.role === 'provider' && j.status === 'accepted' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleComplete(j._id)}
                      disabled={updating === j._id}
                    >
                      Mark complete
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => handleInvoice(j._id)}
                      disabled={updating === j._id}
                    >
                      Invoice
                    </button>
                  </>
                )}
                {user?.role === 'provider' && j.status === 'completed' && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => handleInvoice(j._id)}
                    disabled={updating === j._id}
                  >
                    Invoice
                  </button>
                )}
                {user?.role === 'customer' && j.status === 'requested' && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => updateStatus(j._id, 'cancelled')}
                    disabled={updating === j._id}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
