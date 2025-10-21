'use client';
/* Shared UI primitives. */
import { ReactNode, useEffect } from 'react';
import { IconStar, IconStarOutline, IconX } from './icons';
import { initials } from '../lib/format';

/* --------------------------------------------------------------- Spinner */
export function Spinner({ large }: { large?: boolean }) {
  return <span className={`spinner${large ? ' spinner-lg' : ''}`} aria-label="Loading" />;
}

export function PageLoader() {
  return <div className="center-spin"><Spinner large /></div>;
}

/* --------------------------------------------------------------- Avatar */
export function Avatar({
  name, src, size = 'md',
}: { name: string; src?: string | null; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  return (
    <span className={`avatar avatar-${size}`} aria-hidden>
      {src ? <img src={src} alt="" /> : initials(name)}
    </span>
  );
}

/* --------------------------------------------------------------- Stars */
export function Stars({ value, large }: { value: number; large?: boolean }) {
  const full = Math.round(value);
  return (
    <span className={`stars${large ? ' stars-lg' : ''}`} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (n <= full ? <IconStar key={n} /> : <IconStarOutline key={n} style={{ color: '#d6dae3' }} />))}
    </span>
  );
}

export function StarsInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <span className="stars stars-lg stars-input" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} role="radio" aria-checked={n === value} onClick={() => onChange(n)}>
          {n <= value ? <IconStar /> : <IconStarOutline style={{ color: '#d6dae3' }} />}
        </span>
      ))}
    </span>
  );
}

/* --------------------------------------------------------------- Empty */
export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      {icon && <div className="empty-icon">{icon}</div>}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

/* --------------------------------------------------------------- Skeleton */
export function ProviderCardSkeleton() {
  return (
    <div className="card pcard">
      <div className="pcard-top">
        <span className="skel" style={{ width: 46, height: 46, borderRadius: '50%' }} />
        <div className="grow stack gap-6">
          <span className="skel" style={{ height: 14, width: '70%' }} />
          <span className="skel" style={{ height: 11, width: '40%' }} />
        </div>
      </div>
      <span className="skel" style={{ height: 12, width: '100%', marginTop: 16 }} />
      <span className="skel" style={{ height: 12, width: '80%', marginTop: 8 }} />
      <span className="skel" style={{ height: 32, width: '100%', marginTop: 18, borderRadius: 12 }} />
    </div>
  );
}

/* --------------------------------------------------------------- Modal */
export function Modal({
  title, onClose, children, large,
}: { title: string; onClose: () => void; children: ReactNode; large?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal${large ? ' modal-lg' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close"><IconX /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Field */
export function Field({
  label, hint, error, children, htmlFor,
}: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? <span className="err">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

/* --------------------------------------------------------------- Badge */
export function Badge({ kind, children, icon }: { kind?: string; children: ReactNode; icon?: ReactNode }) {
  return <span className={`badge ${kind ?? ''}`}>{icon}{children}</span>;
}
