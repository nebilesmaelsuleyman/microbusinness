import { useEffect, useState } from 'react';
import { subscriptionsApi } from '../api/client';
import type { SubscriptionPlan, ProviderSubscription } from '../api/client';
import './Subscriptions.css';

export default function Subscriptions() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [current, setCurrent] = useState<ProviderSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    Promise.all([
      subscriptionsApi.plans().then(setPlans),
      subscriptionsApi.mine().then(setCurrent).catch(() => setCurrent(null)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    setError('');
    try {
      const sub = await subscriptionsApi.subscribe(planId);
      setCurrent(sub);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to subscribe');
    } finally {
      setSubscribing(null);
    }
  };

  const isActive = current && new Date(current.endDate) > new Date();
  const currentPlanId = current
    ? typeof current.planId === 'string'
      ? current.planId
      : current.planId._id
    : null;

  if (loading) return <p className="muted">Loading plans…</p>;

  return (
    <div className="subscriptions-page">
      <h1 className="page-title">Subscription plans</h1>

      {error && <p className="error-msg">{error}</p>}

      {isActive && current && (
        <div className="card current-sub">
          <h3>Active subscription</h3>
          <p>
            {typeof current.planId === 'object' ? current.planId.name : 'Plan'} · Expires{' '}
            {new Date(current.endDate).toLocaleDateString()} · Leads used: {current.leadUsed}
          </p>
        </div>
      )}

      {plans.length === 0 ? (
        <p className="muted">No plans available yet.</p>
      ) : (
        <div className="plan-grid">
          {plans.map((p) => {
            const isCurrent = currentPlanId === p._id && isActive;
            return (
              <div key={p._id} className={`plan-card card ${isCurrent ? 'plan-current' : ''}`}>
                <h3 className="plan-name">{p.name}</h3>
                <p className="plan-price">
                  ${p.price.toFixed(0)}
                  <span className="plan-period">/{p.durationDays} days</span>
                </p>
                <ul className="plan-features">
                  <li>{p.leadLimit} leads included</li>
                  {p.visibilityBoost && <li>★ Visibility boost</li>}
                  <li>{p.durationDays} days access</li>
                </ul>
                {isCurrent ? (
                  <span className="plan-badge">Current plan</span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={() => handleSubscribe(p._id)}
                    disabled={subscribing === p._id}
                  >
                    {subscribing === p._id ? 'Processing…' : 'Subscribe'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
