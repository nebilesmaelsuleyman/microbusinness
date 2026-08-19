import type { JobStatus, PopulatedUser, ProviderProfile, Category } from '../api/client';

// Keyword → emoji for category cards. First match wins; falls back to a wrench.
const CATEGORY_EMOJI: [RegExp, string][] = [
  [/plumb/i, '🚰'],
  [/electric/i, '💡'],
  [/clean/i, '🧹'],
  [/landscap|garden|lawn/i, '🌿'],
  [/paint/i, '🎨'],
  [/carpen|woodwork/i, '🪚'],
  [/hvac|air|heating/i, '❄️'],
  [/appliance/i, '🔌'],
  [/mov|haul/i, '📦'],
  [/pest/i, '🐜'],
  [/roof/i, '🏠'],
  [/handy/i, '🛠️'],
  [/tutor|teach|lesson/i, '📚'],
  [/photo/i, '📸'],
  [/cater|chef|food|meal/i, '🍽️'],
  [/hair|beauty|makeup|nail/i, '💇'],
  [/train|fitness|gym|coach/i, '🏋️'],
  [/auto|car |mechanic|vehicle/i, '🚗'],
  [/web|design|brand|logo/i, '💻'],
  [/pet|dog|cat/i, '🐾'],
  [/legal|law/i, '⚖️'],
  [/account|tax|book/i, '🧮'],
];

export function categoryEmoji(name: string): string {
  for (const [re, emoji] of CATEGORY_EMOJI) if (re.test(name)) return emoji;
  return '🔧';
}

/** Extract the owning user id from a (possibly populated) provider profile. */
export function providerUserId(p: ProviderProfile): string {
  const u = p.userId;
  return typeof u === 'string' ? u : u?._id ?? '';
}

export function providerName(p: ProviderProfile): string {
  const u = p.userId;
  if (typeof u === 'object' && u?.name) return u.name;
  return 'Service provider';
}

export function providerPhoto(p: ProviderProfile): string | null {
  const u = p.userId;
  if (typeof u === 'object') return u?.profilePhoto ?? null;
  return null;
}

export function userName(u: PopulatedUser, fallback = 'User'): string {
  if (!u || typeof u === 'string') return fallback;
  return u.name || u.phoneNumber || fallback;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function categoryNames(p: ProviderProfile): string[] {
  const cats = p.serviceCategories;
  if (!Array.isArray(cats)) return [];
  return (cats as Array<Category | string>)
    .map((c) => (typeof c === 'string' ? '' : c.name))
    .filter(Boolean);
}

export function relativeTime(date: string | number | Date): string {
  const d = new Date(date).getTime();
  const diff = Date.now() - d;
  const sec = Math.round(diff / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 60) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDate(date?: string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function currency(n: number): string {
  return `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
}

export const PRICING_LABEL: Record<string, string> = {
  fixed: 'Fixed price',
  hourly: 'Hourly rate',
  quote: 'Custom quote',
};

export const STATUS_META: Record<JobStatus, { label: string; cls: string }> = {
  requested: { label: 'Requested', cls: 'badge-warning' },
  accepted: { label: 'Accepted', cls: 'badge-success' },
  completed: { label: 'Completed', cls: 'badge-primary' },
  rejected: { label: 'Rejected', cls: 'badge-danger' },
  cancelled: { label: 'Cancelled', cls: 'badge' },
};

export const VERIFICATION_META: Record<string, { label: string; cls: string }> = {
  approved: { label: 'Verified', cls: 'badge-success' },
  pending: { label: 'Pending review', cls: 'badge-warning' },
  rejected: { label: 'Rejected', cls: 'badge-danger' },
};

/** Safely render verification data from both current and older provider records. */
export function verificationMeta(status?: string | null) {
  return VERIFICATION_META[status ?? ''] ?? VERIFICATION_META.pending;
}
