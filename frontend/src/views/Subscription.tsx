'use client';
import { useState, useEffect } from 'react';
import { Link } from '@/lib/router-compat';
import {
  subscriptionsApi, type SubscriptionPlan, type ProviderSubscription,
} from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { currency, formatDate } from '../lib/format';
import { PageLoader, EmptyState } from '../components/ui';
import { IconCheck, IconBolt, IconSparkle, IconClock, IconInbox } from '../components/icons';

export default function Subscription() {
  const toast = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [current, setCurrent] = useState<ProviderSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const load = () => {
    Promise.all([
      subscriptionsApi.plans().then(setPlans).catch(() => setPlans([])),
      subscriptionsApi.me().then(setCurrent).catch(() => setCurrent(null)),
    ]).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const subscribe = async (plan: SubscriptionPlan) => {
    setSubscribing(plan._id);
    try {
      const sub = await subscriptionsApi.subscribe(plan._id);
      setCurrent(sub);
      toast.success(`Subscribed to ${plan.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not subscribe');
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) return <div className="page"><PageLoader /></div>;

  const currentPlanId = current && typeof current.planId === 'object' ? current.planId._id : current?.planId;

  return (
    <div className="page">
      <Link to="/dashboard" className="btn-link small">← Back to dashboard</Link>
      <h1 className="page-title mt-8">Subscription plans</h1>
      <p className="page-sub">Boost your visibility and unlock more leads.</p>

      {current && typeof current.planId === 'object' && (
        <div className="card card-pad mb-24" style={{ background: 'linear-gradient(120deg, var(--primary-50), #fff)' }}>
          <div className="between wrap">
            <div className="row gap-16">
              <span className="empty-icon" style={{ margin: 0, color: 'var(--primary)', background: '#fff' }}><IconBolt /></span>
              <div>
                <div className="row gap-8"><b style={{ fontSize: 18 }}>{current.planId.name}</b><span className="badge badge-success badge-dot">Active</span></div>
                <div className="muted small mt-8 row gap-16 wrap">
                  <span className="row gap-6"><IconClock style={{ width: 14, height: 14 }} /> Ends {formatDate(current.endDate)}</span>
                  <span className="row gap-6"><IconInbox style={{ width: 14, height: 14 }} /> {current.leadUsed} / {current.planId.leadLimit} leads used</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="card card-pad">
          <EmptyState icon={<IconSparkle />} title="No plans available">Check back soon — plans are configured by the marketplace admin.</EmptyState>
        </div>
      ) : (
        <div className="grid grid-providers">
          {plans.map((plan, i) => {
            const isCurrent = currentPlanId === plan._id;
            const featured = plan.visibilityBoost || i === 1;
            return (
              <div key={plan._id} className={`card plan${featured ? ' featured' : ''}`}>
                {featured && <span className="badge badge-primary plan-tag"><IconBolt style={{ width: 12, height: 12 }} /> Most popular</span>}
                <div className="plan-name">{plan.name}</div>
                <div className="plan-price">{currency(plan.price)}<small> / {plan.durationDays}d</small></div>
                <ul>
                  <li><IconCheck /> {plan.leadLimit} leads included</li>
                  <li><IconCheck /> {plan.durationDays}-day duration</li>
                  {plan.visibilityBoost && <li><IconCheck /> Priority placement in search</li>}
                  <li><IconCheck /> Verified provider badge</li>
                </ul>
                <button
                  className={`btn ${isCurrent ? 'btn-ghost' : featured ? 'btn-primary' : 'btn-dark'} btn-block`}
                  disabled={isCurrent || subscribing === plan._id}
                  onClick={() => subscribe(plan)}
                >
                  {isCurrent ? 'Current plan' : subscribing === plan._id ? 'Subscribing…' : 'Choose plan'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
