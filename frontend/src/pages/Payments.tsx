import { useEffect, useState } from 'react';
import { paymentsApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Invoice, Transaction } from '../api/client';
import './Payments.css';

export default function Payments() {
  const { user } = useAuth();
  const isProvider = user?.role === 'provider';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [earnings, setEarnings] = useState<{
    totalEarned: number;
    pendingAmount: number;
    invoiceCount: number;
    paidInvoices: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [tab, setTab] = useState<'invoices' | 'transactions'>('invoices');

  useEffect(() => {
    const loads: Promise<unknown>[] = [
      paymentsApi.listInvoices().then(setInvoices).catch(() => setInvoices([])),
      paymentsApi.listTransactions().then(setTransactions).catch(() => setTransactions([])),
    ];
    if (isProvider) {
      loads.push(paymentsApi.earnings().then(setEarnings).catch(() => setEarnings(null)));
    }
    Promise.all(loads).finally(() => setLoading(false));
  }, [isProvider]);

  const handlePay = async (inv: Invoice) => {
    setPaying(inv._id);
    try {
      await paymentsApi.recordPayment({
        type: 'job_payment',
        amount: inv.total,
        invoiceId: inv._id,
        jobId: typeof inv.jobId === 'string' ? inv.jobId : inv.jobId?._id,
        description: `Payment for invoice ${inv.invoiceNumber}`,
      });
      setInvoices((prev) =>
        prev.map((i) => (i._id === inv._id ? { ...i, status: 'paid', paidAt: new Date().toISOString() } : i)),
      );
      paymentsApi.listTransactions().then(setTransactions).catch(() => {});
    } finally {
      setPaying(null);
    }
  };

  if (loading) return <p className="muted">Loading payments…</p>;

  return (
    <div className="payments-page">
      <h1 className="page-title">Payments</h1>

      {isProvider && earnings && (
        <div className="earnings-grid">
          <div className="stat-card card">
            <span className="stat-label">Total earned</span>
            <span className="stat-value">${earnings.totalEarned.toFixed(2)}</span>
          </div>
          <div className="stat-card card">
            <span className="stat-label">Pending</span>
            <span className="stat-value">${earnings.pendingAmount.toFixed(2)}</span>
          </div>
          <div className="stat-card card">
            <span className="stat-label">Invoices</span>
            <span className="stat-value">{earnings.paidInvoices}/{earnings.invoiceCount} paid</span>
          </div>
        </div>
      )}

      <div className="pay-tabs">
        <button
          type="button"
          className={`pay-tab ${tab === 'invoices' ? 'pay-tab-active' : ''}`}
          onClick={() => setTab('invoices')}
        >
          Invoices ({invoices.length})
        </button>
        <button
          type="button"
          className={`pay-tab ${tab === 'transactions' ? 'pay-tab-active' : ''}`}
          onClick={() => setTab('transactions')}
        >
          Transactions ({transactions.length})
        </button>
      </div>

      {tab === 'invoices' && (
        invoices.length === 0 ? (
          <p className="muted">No invoices yet.</p>
        ) : (
          <ul className="pay-list">
            {invoices.map((inv) => (
              <li key={inv._id} className="pay-item card">
                <div className="pay-main">
                  <span className="pay-ref">{inv.invoiceNumber}</span>
                  <span className="pay-amount">{inv.currency} {inv.total.toFixed(2)}</span>
                  <span className={`pay-status pay-status-${inv.status}`}>{inv.status}</span>
                  {inv.dueDate && (
                    <span className="pay-meta">Due {new Date(inv.dueDate).toLocaleDateString()}</span>
                  )}
                  {inv.lineItems.length > 0 && (
                    <ul className="pay-lines">
                      {inv.lineItems.map((li, i) => (
                        <li key={i}>
                          {li.description} × {li.quantity} — {inv.currency} {li.total.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {!isProvider && inv.status === 'pending' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handlePay(inv)}
                    disabled={paying === inv._id}
                  >
                    {paying === inv._id ? 'Processing…' : 'Pay now'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )
      )}

      {tab === 'transactions' && (
        transactions.length === 0 ? (
          <p className="muted">No transactions yet.</p>
        ) : (
          <ul className="pay-list">
            {transactions.map((tx) => (
              <li key={tx._id} className="pay-item card">
                <div className="pay-main">
                  <span className="pay-ref">{tx.type.replace('_', ' ')}</span>
                  <span className="pay-amount">
                    {tx.payerId === user?.id ? '−' : '+'} {tx.currency} {tx.amount.toFixed(2)}
                  </span>
                  <span className={`pay-status pay-status-${tx.status}`}>{tx.status}</span>
                  {tx.description && <span className="pay-meta">{tx.description}</span>}
                  <span className="pay-meta">{new Date(tx.createdAt).toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
