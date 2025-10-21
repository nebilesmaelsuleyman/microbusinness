'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  adminApi, subscriptionsApi,
  type ProviderProfile, type VerificationDocument, type Category,
  type SubscriptionPlan, type JobStats, type RevenueMetrics, type User,
  type Review, type Job, type Role, type JobStatus, type AuditLog,
} from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { providerName, currency, relativeTime, userName, VERIFICATION_META, STATUS_META } from '../lib/format';
import { Avatar, Field, PageLoader, EmptyState, Modal, Badge } from '../components/ui';
import {
  IconGrid, IconShieldCheck, IconDoc, IconTag, IconSparkle,
  IconBriefcase, IconDollar, IconUsers, IconCheck, IconX, IconPlus, IconTrending,
  IconStar, IconShield, IconSettings,
} from '../components/icons';

type Tab = 'overview' | 'users' | 'providers' | 'documents' | 'reviews' | 'jobs' | 'categories' | 'plans' | 'audit';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <IconGrid /> },
  { key: 'users', label: 'Users', icon: <IconUsers /> },
  { key: 'providers', label: 'Providers', icon: <IconShieldCheck /> },
  { key: 'documents', label: 'Documents', icon: <IconDoc /> },
  { key: 'reviews', label: 'Reviews', icon: <IconStar /> },
  { key: 'jobs', label: 'Jobs', icon: <IconBriefcase /> },
  { key: 'categories', label: 'Categories', icon: <IconTag /> },
  { key: 'plans', label: 'Plans', icon: <IconSparkle /> },
  { key: 'audit', label: 'Audit Log', icon: <IconShield /> },
];

export default function Admin() {
  const [tab, setTab] = useState<Tab>('overview');
  return (
    <div className="page">
      <h1 className="page-title">Admin panel</h1>
      <p className="page-sub">Manage and moderate the marketplace.</p>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>{t.icon} {t.label}</button>
        ))}
      </div>
      {tab === 'overview' && <Overview />}
      {tab === 'users' && <Users />}
      {tab === 'providers' && <Providers />}
      {tab === 'documents' && <Documents />}
      {tab === 'reviews' && <Reviews />}
      {tab === 'jobs' && <Jobs />}
      {tab === 'categories' && <Categories />}
      {tab === 'plans' && <Plans />}
      {tab === 'audit' && <AuditLogView />}
    </div>
  );
}

/* ----------------------------------------------------------------- Overview */
function Overview() {
  const [jobs, setJobs] = useState<JobStats | null>(null);
  const [rev, setRev] = useState<RevenueMetrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.jobStats().then(setJobs).catch(() => {}),
      adminApi.revenue().then(setRev).catch(() => {}),
      adminApi.users({ limit: 200 }).then((r) => { setUsers(r.items); setUserTotal(r.total); }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const totalJobs = jobs ? Object.values(jobs).reduce((a, b) => a + b, 0) : 0;
  const providerCount = users.filter((u) => u.role === 'provider').length;
  const customerCount = users.filter((u) => u.role === 'customer').length;
  const suspendedCount = users.filter((u) => u.isActive === false).length;

  const cards = [
    { label: 'Total revenue', value: currency(rev?.totalRevenue ?? 0), icon: <IconDollar /> },
    { label: 'Active subscriptions', value: rev?.activeSubscriptions ?? 0, icon: <IconTrending /> },
    { label: 'Total jobs', value: totalJobs, icon: <IconBriefcase /> },
    { label: 'Users', value: userTotal, icon: <IconUsers /> },
  ];

  return (
    <div className="stack gap-24">
      <div className="grid grid-stats">
        {cards.map((c) => (
          <div key={c.label} className="card stat">
            <div className="stat-label">{c.icon} {c.label}</div>
            <div className="stat-value">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card card-pad">
          <h2 style={{ fontSize: 17, marginBottom: 14 }}>Jobs by status</h2>
          {jobs && Object.keys(jobs).length > 0 ? (
            Object.entries(jobs).map(([status, count]) => (
              <div key={status} className="row between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ textTransform: 'capitalize' }}>{status}</span>
                <b>{count}</b>
              </div>
            ))
          ) : <p className="muted">No job data.</p>}
        </div>
        <div className="card card-pad">
          <h2 style={{ fontSize: 17, marginBottom: 14 }}>Community</h2>
          <div className="row between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}><span>Providers</span><b>{providerCount}</b></div>
          <div className="row between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}><span>Customers</span><b>{customerCount}</b></div>
          <div className="row between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}><span>Suspended accounts</span><b>{suspendedCount}</b></div>
          <div className="row between" style={{ padding: '8px 0' }}><span>Total subscriptions</span><b>{rev?.totalSubscriptions ?? 0}</b></div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- Users */
const ROLES: Role[] = ['customer', 'provider', 'admin'];

function Users() {
  const toast = useToast();
  const [list, setList] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'' | Role>('');

  const load = useCallback(() => {
    setLoading(true);
    adminApi.users({ limit: 100, search: search.trim() || undefined, role: roleFilter || undefined })
      .then((r) => { setList(r.items); setTotal(r.total); })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [search, roleFilter]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const changeRole = async (id: string, role: Role) => {
    setBusy(id);
    try {
      const updated = await adminApi.setUserRole(id, role);
      setList((prev) => prev.map((u) => (u._id === id ? { ...u, role: updated.role } : u)));
      toast.success('Role updated');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update role'); }
    finally { setBusy(null); }
  };

  const toggleActive = async (u: User) => {
    setBusy(u._id);
    const next = !(u.isActive ?? true);
    try {
      await adminApi.setUserStatus(u._id, next);
      setList((prev) => prev.map((x) => (x._id === u._id ? { ...x, isActive: next } : x)));
      toast.success(next ? 'Account reactivated' : 'Account suspended');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update'); }
    finally { setBusy(null); }
  };

  const remove = async (u: User) => {
    if (!window.confirm(`Permanently delete ${u.name || u.phoneNumber}? This also removes their provider profile and cannot be undone.`)) return;
    setBusy(u._id);
    try {
      await adminApi.deleteUser(u._id);
      setList((prev) => prev.filter((x) => x._id !== u._id));
      setTotal((t) => t - 1);
      toast.success('User deleted');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not delete'); }
    finally { setBusy(null); }
  };

  return (
    <div className="stack gap-16">
      <div className="row gap-12 wrap">
        <div className="input-icon grow" style={{ minWidth: 220 }}>
          <IconUsers style={{ width: 16, height: 16 }} />
          <input className="input" placeholder="Search by name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as '' | Role)} aria-label="Filter by role" style={{ width: 180 }}>
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading ? <PageLoader /> : list.length === 0 ? (
        <div className="card card-pad"><EmptyState icon={<IconUsers />} title="No users found" /></div>
      ) : (
        <div className="card card-pad">
          <div className="muted small mb-16">{total} user{total !== 1 ? 's' : ''} total</div>
          {list.map((u) => {
            const active = u.isActive ?? true;
            return (
              <div key={u._id} className="list-row">
                <Avatar name={u.name || 'U'} src={u.profilePhoto} size="md" />
                <div className="lr-main">
                  <div className="lr-title">{u.name || 'Unnamed'} {!active && <Badge kind="badge-danger">Suspended</Badge>}</div>
                  <div className="lr-sub">{u.phoneNumber} · joined {u.createdAt ? relativeTime(u.createdAt) : '—'}</div>
                </div>
                <select
                  className="select" value={u.role} disabled={busy === u._id}
                  onChange={(e) => changeRole(u._id, e.target.value as Role)}
                  aria-label="Role" style={{ width: 130 }}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="lr-actions">
                  <button className={`btn btn-sm ${active ? 'btn-ghost' : 'btn-success'}`} onClick={() => toggleActive(u)} disabled={busy === u._id}>
                    <IconShield /> {active ? 'Suspend' : 'Activate'}
                  </button>
                  <button className="btn btn-ghost btn-sm btn-danger" onClick={() => remove(u)} disabled={busy === u._id}><IconX /> Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Providers */
function Providers() {
  const toast = useToast();
  const [list, setList] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { adminApi.providers({ limit: 100 }).then(setList).catch(() => setList([])).finally(() => setLoading(false)); }, []);

  const verify = async (id: string, status: 'approved' | 'rejected') => {
    setBusy(id);
    try {
      const updated = await adminApi.verifyProvider(id, status);
      setList((prev) => prev.map((p) => (p._id === id ? { ...p, verificationStatus: updated.verificationStatus } : p)));
      toast.success(`Provider ${status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update');
    } finally { setBusy(null); }
  };

  if (loading) return <PageLoader />;
  if (list.length === 0) return <div className="card card-pad"><EmptyState icon={<IconShieldCheck />} title="No providers yet" /></div>;

  return (
    <div className="card card-pad">
      {list.map((p) => {
        const verif = VERIFICATION_META[p.verificationStatus];
        return (
          <div key={p._id} className="list-row">
            <Avatar name={providerName(p)} size="md" />
            <div className="lr-main">
              <div className="lr-title">{providerName(p)}</div>
              <div className="lr-sub">{p.serviceDescription ? p.serviceDescription.slice(0, 70) : 'No description'}</div>
            </div>
            <span className={`badge ${verif.cls}`}>{verif.label}</span>
            <div className="lr-actions">
              {p.verificationStatus !== 'approved' && (
                <button className="btn btn-success btn-sm" onClick={() => verify(p._id, 'approved')} disabled={busy === p._id}><IconCheck /> Approve</button>
              )}
              {p.verificationStatus !== 'rejected' && (
                <button className="btn btn-ghost btn-sm" onClick={() => verify(p._id, 'rejected')} disabled={busy === p._id}><IconX /> Reject</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- Documents */
function Documents() {
  const toast = useToast();
  const [list, setList] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { adminApi.verificationDocuments().then(setList).catch(() => setList([])).finally(() => setLoading(false)); }, []);

  const decide = async (id: string, status: 'approved' | 'rejected') => {
    setBusy(id);
    try {
      await adminApi.setDocumentStatus(id, status);
      setList((prev) => prev.filter((d) => d._id !== id));
      toast.success(`Document ${status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update');
    } finally { setBusy(null); }
  };

  if (loading) return <PageLoader />;
  if (list.length === 0) return <div className="card card-pad"><EmptyState icon={<IconDoc />} title="No pending documents" >Verification documents awaiting review will appear here.</EmptyState></div>;

  return (
    <div className="card card-pad">
      {list.map((d) => (
        <div key={d._id} className="list-row">
          <span className="empty-icon" style={{ margin: 0, width: 40, height: 40 }}><IconDoc /></span>
          <div className="lr-main">
            <div className="lr-title" style={{ textTransform: 'capitalize' }}>{d.documentType.replace(/_/g, ' ')}</div>
            <div className="lr-sub"><a href={d.documentUrl} target="_blank" rel="noreferrer">{d.documentUrl}</a> · {relativeTime(d.uploadedAt)}</div>
          </div>
          <div className="lr-actions">
            <button className="btn btn-success btn-sm" onClick={() => decide(d._id, 'approved')} disabled={busy === d._id}><IconCheck /> Approve</button>
            <button className="btn btn-ghost btn-sm" onClick={() => decide(d._id, 'rejected')} disabled={busy === d._id}><IconX /> Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Reviews */
function Reviews() {
  const toast = useToast();
  const [list, setList] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    adminApi.reviews({ limit: 50 }).then((r) => { setList(r.items); setTotal(r.total); }).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

  const remove = async (id: string) => {
    if (!window.confirm('Delete this review? The provider rating will be recalculated.')) return;
    setBusy(id);
    try {
      await adminApi.deleteReview(id);
      setList((prev) => prev.filter((r) => r._id !== id));
      setTotal((t) => t - 1);
      toast.success('Review deleted');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not delete'); }
    finally { setBusy(null); }
  };

  if (loading) return <PageLoader />;
  if (list.length === 0) return <div className="card card-pad"><EmptyState icon={<IconStar />} title="No reviews yet" /></div>;

  return (
    <div className="card card-pad">
      <div className="muted small mb-16">{total} review{total !== 1 ? 's' : ''} total</div>
      {list.map((r) => (
        <div key={r._id} className="list-row">
          <Avatar name={userName(r.customerId, 'Customer')} size="md" />
          <div className="lr-main">
            <div className="lr-title">{userName(r.customerId, 'Customer')} · <span style={{ color: '#d97706' }}>{'★'.repeat(r.rating)}</span></div>
            <div className="lr-sub">{r.comment ? `"${r.comment}"` : <em>No comment</em>} · {relativeTime(r.createdAt)}</div>
          </div>
          <button className="btn btn-ghost btn-sm btn-danger" onClick={() => remove(r._id)} disabled={busy === r._id}><IconX /> Delete</button>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------------- Jobs */
const JOB_STATUSES: JobStatus[] = ['requested', 'accepted', 'completed', 'rejected', 'cancelled'];

function jobProviderName(j: Job): string {
  const p = j.providerId;
  if (typeof p === 'string') return 'Provider';
  const u = p?.userId;
  if (u && typeof u === 'object' && u.name) return u.name;
  return 'Provider';
}

function Jobs() {
  const [list, setList] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'' | JobStatus>('');

  useEffect(() => {
    setLoading(true);
    adminApi.jobs({ limit: 50, status: statusFilter || undefined })
      .then((r) => { setList(r.items); setTotal(r.total); })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="stack gap-16">
      <div className="row between wrap gap-12">
        <h2 style={{ fontSize: 17 }}>{total} job{total !== 1 ? 's' : ''}</h2>
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as '' | JobStatus)} aria-label="Filter by status" style={{ width: 180 }}>
          <option value="">All statuses</option>
          {JOB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <PageLoader /> : list.length === 0 ? (
        <div className="card card-pad"><EmptyState icon={<IconBriefcase />} title="No jobs found" /></div>
      ) : (
        <div className="card card-pad">
          {list.map((j) => {
            const meta = STATUS_META[j.status];
            return (
              <div key={j._id} className="list-row">
                <span className="empty-icon" style={{ margin: 0, width: 40, height: 40 }}><IconBriefcase /></span>
                <div className="lr-main">
                  <div className="lr-title">{userName(j.customerId, 'Customer')} → {jobProviderName(j)}</div>
                  <div className="lr-sub">{j.description ? j.description.slice(0, 80) : 'No description'} · {relativeTime(j.createdAt)}</div>
                </div>
                <span className={`badge ${meta?.cls ?? 'badge'}`}>{meta?.label ?? j.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- Audit log */
const AUDIT_METHOD_CLS: Record<string, string> = {
  POST: 'badge-success',
  PATCH: 'badge-warning',
  DELETE: 'badge-danger',
};

function metaSummary(meta: Record<string, unknown>): string {
  const params = (meta?.params as Record<string, unknown>) || {};
  const body = (meta?.body as Record<string, unknown>) || {};
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) parts.push(`${k}=${String(v)}`);
  for (const [k, v] of Object.entries(body)) parts.push(`${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
  return parts.join(' · ');
}

function AuditLogView() {
  const PAGE = 50;
  const [list, setList] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi.auditLogs({ skip, limit: PAGE })
      .then((r) => {
        setTotal(r.total);
        setList((prev) => (skip === 0 ? r.items : [...prev, ...r.items]));
      })
      .catch(() => { if (skip === 0) setList([]); })
      .finally(() => setLoading(false));
  }, [skip]);

  return (
    <div className="stack gap-16">
      <div className="row between wrap gap-12">
        <h2 style={{ fontSize: 17 }}>{total} admin action{total !== 1 ? 's' : ''}</h2>
      </div>

      {loading && list.length === 0 ? <PageLoader /> : list.length === 0 ? (
        <div className="card card-pad"><EmptyState icon={<IconShield />} title="No audit entries yet">State-changing admin actions are recorded here.</EmptyState></div>
      ) : (
        <>
          <div className="card card-pad">
            {list.map((l) => {
              const summary = metaSummary(l.meta || {});
              return (
                <div key={l._id} className="list-row">
                  <span className="empty-icon" style={{ margin: 0, width: 40, height: 40 }}><IconShield /></span>
                  <div className="lr-main">
                    <div className="lr-title">
                      <span className={`badge ${AUDIT_METHOD_CLS[l.method] ?? 'badge'}`}>{l.method}</span>{' '}
                      <code style={{ fontSize: 13 }}>{l.path}</code>
                    </div>
                    <div className="lr-sub">
                      {l.actorPhone || 'unknown actor'} · {relativeTime(l.createdAt)}
                      {summary ? ` · ${summary}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {list.length < total && (
            <button className="btn btn-ghost" disabled={loading} onClick={() => setSkip(list.length)}>
              {loading ? 'Loading…' : `Load more (${total - list.length} left)`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- Categories */
function Categories() {
  const toast = useToast();
  const [list, setList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; cat?: Category } | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => { adminApi.categories().then(setList).catch(() => setList([])).finally(() => setLoading(false)); };
  useEffect(load, []);

  const open = (mode: 'create' | 'edit', cat?: Category) => {
    setModal({ mode, cat });
    setName(cat?.name || '');
    setDesc(cat?.description || '');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal?.mode === 'edit' && modal.cat) {
        const updated = await adminApi.updateCategory(modal.cat._id, { name: name.trim(), description: desc.trim() });
        setList((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      } else {
        const created = await adminApi.createCategory({ name: name.trim(), description: desc.trim() || undefined });
        setList((prev) => [...prev, created]);
      }
      toast.success('Category saved');
      setModal(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally { setSaving(false); }
  };

  const remove = async (c: Category) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    setBusy(c._id);
    try {
      await adminApi.deleteCategory(c._id);
      setList((prev) => prev.filter((x) => x._id !== c._id));
      toast.success('Category deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete');
    } finally { setBusy(null); }
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <div className="between mb-16">
        <h2 style={{ fontSize: 17 }}>{list.length} categories</h2>
        <button className="btn btn-primary btn-sm" onClick={() => open('create')}><IconPlus /> New category</button>
      </div>
      <div className="card card-pad">
        {list.length === 0 ? <EmptyState icon={<IconTag />} title="No categories yet">Create the first service category.</EmptyState> : (
          list.map((c) => (
            <div key={c._id} className="list-row">
              <span className="empty-icon" style={{ margin: 0, width: 38, height: 38, color: 'var(--primary)', background: 'var(--primary-50)' }}><IconTag /></span>
              <div className="lr-main">
                <div className="lr-title">{c.name}</div>
                <div className="lr-sub">{c.description || 'No description'}</div>
              </div>
              <div className="lr-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => open('edit', c)}><IconSettings /> Edit</button>
                <button className="btn btn-ghost btn-sm btn-danger" onClick={() => remove(c)} disabled={busy === c._id}><IconX /> Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {modal && (
        <Modal title={modal.mode === 'edit' ? 'Edit category' : 'New category'} onClose={() => setModal(null)}>
          <form onSubmit={save}>
            <Field label="Name" htmlFor="cname"><input id="cname" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Plumbing" required /></Field>
            <Field label="Description (optional)" htmlFor="cdesc"><textarea id="cdesc" className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} /></Field>
            <button className="btn btn-primary btn-block" disabled={saving}>{saving ? 'Saving…' : 'Save category'}</button>
          </form>
        </Modal>
      )}
    </>
  );
}

/* -------------------------------------------------------------------- Plans */
function Plans() {
  const toast = useToast();
  const [list, setList] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; plan?: SubscriptionPlan } | null>(null);
  const [form, setForm] = useState({ name: '', price: '', leadLimit: '', durationDays: '', visibilityBoost: false });
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => { subscriptionsApi.plans().then(setList).catch(() => setList([])).finally(() => setLoading(false)); };
  useEffect(load, []);

  const open = (mode: 'create' | 'edit', plan?: SubscriptionPlan) => {
    setModal({ mode, plan });
    setForm({
      name: plan?.name ?? '',
      price: plan ? String(plan.price) : '',
      leadLimit: plan ? String(plan.leadLimit) : '',
      durationDays: plan ? String(plan.durationDays) : '',
      visibilityBoost: plan?.visibilityBoost ?? false,
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      name: form.name.trim(),
      price: Number(form.price),
      leadLimit: Number(form.leadLimit),
      durationDays: Number(form.durationDays),
      visibilityBoost: form.visibilityBoost,
    };
    try {
      if (modal?.mode === 'edit' && modal.plan) {
        const updated = await adminApi.updatePlan(modal.plan._id, body);
        setList((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
        toast.success('Plan updated');
      } else {
        const created = await adminApi.createPlan(body);
        setList((prev) => [...prev, created]);
        toast.success('Plan created');
      }
      setModal(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save plan');
    } finally { setSaving(false); }
  };

  const remove = async (p: SubscriptionPlan) => {
    if (!window.confirm(`Delete plan "${p.name}"?`)) return;
    setBusy(p._id);
    try {
      await adminApi.deletePlan(p._id);
      setList((prev) => prev.filter((x) => x._id !== p._id));
      toast.success('Plan deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete');
    } finally { setBusy(null); }
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <div className="between mb-16">
        <h2 style={{ fontSize: 17 }}>{list.length} plans</h2>
        <button className="btn btn-primary btn-sm" onClick={() => open('create')}><IconPlus /> New plan</button>
      </div>
      {list.length === 0 ? (
        <div className="card card-pad"><EmptyState icon={<IconSparkle />} title="No plans yet">Create subscription plans for providers.</EmptyState></div>
      ) : (
        <div className="grid grid-providers">
          {list.map((p) => (
            <div key={p._id} className={`card plan${p.visibilityBoost ? ' featured' : ''}`}>
              <div className="plan-name">{p.name}</div>
              <div className="plan-price">{currency(p.price)}<small> / {p.durationDays}d</small></div>
              <ul>
                <li><IconCheck /> {p.leadLimit} leads</li>
                <li><IconCheck /> {p.durationDays}-day duration</li>
                {p.visibilityBoost && <li><IconCheck /> Visibility boost</li>}
              </ul>
              <div className="row gap-8" style={{ marginTop: 12 }}>
                <button className="btn btn-ghost btn-sm grow" onClick={() => open('edit', p)}><IconSettings /> Edit</button>
                <button className="btn btn-ghost btn-sm btn-danger" onClick={() => remove(p)} disabled={busy === p._id}><IconX /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal.mode === 'edit' ? 'Edit plan' : 'New subscription plan'} onClose={() => setModal(null)}>
          <form onSubmit={save}>
            <Field label="Plan name" htmlFor="pname"><input id="pname" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Pro" required /></Field>
            <div className="grid grid-2">
              <Field label="Price ($)" htmlFor="pprice"><input id="pprice" className="input" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></Field>
              <Field label="Duration (days)" htmlFor="pdur"><input id="pdur" className="input" type="number" min={1} value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} required /></Field>
            </div>
            <Field label="Lead limit" htmlFor="plead"><input id="plead" className="input" type="number" min={0} value={form.leadLimit} onChange={(e) => setForm({ ...form, leadLimit: e.target.value })} required /></Field>
            <label className={`check-card${form.visibilityBoost ? ' sel' : ''}`} style={{ marginBottom: 16 }} onClick={() => setForm({ ...form, visibilityBoost: !form.visibilityBoost })}>
              <span className="tick">{form.visibilityBoost && <IconCheck />}</span>
              Visibility boost (priority placement)
            </label>
            <button className="btn btn-primary btn-block" disabled={saving}>{saving ? 'Saving…' : modal.mode === 'edit' ? 'Save plan' : 'Create plan'}</button>
          </form>
        </Modal>
      )}
    </>
  );
}
