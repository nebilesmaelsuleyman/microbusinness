/* ==========================================================================
   API client — typed wrapper over the NestJS backend (global prefix /api).
   ========================================================================== */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const TOKEN_KEY = 'microbusiness_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message || data?.error;
    throw new ApiError(msg || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

/** Multipart/form-data POST (file uploads). Lets the browser set the boundary header itself. */
export async function apiForm<T>(path: string, form: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', body: form, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message || data?.error;
    throw new ApiError(msg || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

const qs = (params: Record<string, unknown>): string => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
};

/* ------------------------------------------------------------------- Types */

export type Role = 'customer' | 'provider' | 'admin';
export type JobStatus = 'requested' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type PricingModel = 'fixed' | 'hourly' | 'quote';

export interface GeoLocation {
  city?: string | null;
  formattedAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface AuthUser {
  id: string;
  phoneNumber: string;
  email?: string | null;
  name: string;
  role: Role;
  profilePhoto?: string | null;
  location?: GeoLocation | null;
}

export interface User {
  _id: string;
  phoneNumber: string;
  email?: string | null;
  name: string;
  role: Role;
  profilePhoto?: string | null;
  location?: GeoLocation | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
}

export interface AuditLog {
  _id: string;
  actorId: string | null;
  actorPhone: string;
  method: string;
  path: string;
  action: string;
  meta: Record<string, unknown>;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
}

/** userId may be a raw id or a populated user object depending on endpoint. */
export type PopulatedUser = string | {
  _id: string;
  name?: string;
  phoneNumber?: string;
  profilePhoto?: string | null;
  location?: GeoLocation | null;
};

export interface ProviderProfile {
  _id: string;
  userId: PopulatedUser;
  serviceCategories: Category[] | string[];
  serviceDescription: string;
  yearsOfExperience: number;
  serviceRadiusKm: number;
  pricingModel: PricingModel;
  availabilitySchedule?: Record<string, unknown>;
  verificationStatus: VerificationStatus;
  ratingAverage: number;
  reviewCount: number;
  coordinates?: { type: 'Point'; coordinates: [number, number] };
  createdAt?: string;
}

export interface VerificationDocument {
  _id: string;
  providerId: string | ProviderProfile;
  documentType: string;
  documentUrl: string;
  status: VerificationStatus;
  uploadedAt: string;
}

export interface Job {
  _id: string;
  customerId: PopulatedUser;
  providerId: string | { _id?: string; userId?: PopulatedUser; serviceDescription?: string };
  status: JobStatus;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  description?: string;
  scheduledDate?: string | null;
  completedAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface Lead {
  _id: string;
  customerId: PopulatedUser;
  providerId: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  customerId: PopulatedUser;
  providerId: string;
  jobId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Favorite {
  _id: string;
  customerId: string;
  providerId: ProviderProfile | string;
  createdAt: string;
}

export interface SubscriptionPlan {
  _id: string;
  name: string;
  price: number;
  leadLimit: number;
  visibilityBoost: boolean;
  durationDays: number;
}

export interface ProviderSubscription {
  _id: string;
  providerId: string;
  planId: SubscriptionPlan | string;
  startDate: string;
  endDate: string;
  leadUsed: number;
}

export interface JobStats {
  [status: string]: number;
}

export interface RevenueMetrics {
  totalSubscriptions: number;
  totalRevenue: number;
  activeSubscriptions: number;
}

/* ----------------------------------------------------------------- Auth API */

export const authApi = {
  sendOtp: (phoneNumber: string) =>
    api<{ message: string; isNewUser: boolean; devOtp?: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    }),
  verifyOtp: (body: { phoneNumber: string; otp: string; name?: string; role?: Role }) =>
    api<{ access_token: string; user: AuthUser }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  register: (body: { name?: string; email: string; password: string; phoneNumber: string; role: Role }) =>
    api<{ access_token: string; user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    api<{ access_token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  refresh: () =>
    api<{ access_token: string; user: AuthUser }>('/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    }),
  logout: () =>
    api<{ message: string }>('/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }),
  sessions: () => api<Array<{ _id: string; userAgent?: string; ip?: string; createdAt: string; expiresAt?: string; revoked: boolean }>>('/auth/sessions'),
  revokeSession: (id: string) => api('/auth/sessions/' + id, { method: 'DELETE' }),
  totpSetup: () => api<{ base32: string; otpauth_url: string }>('/auth/totp/setup', { method: 'POST' }),
  totpVerify: (token: string) => api<{ verified: boolean }>('/auth/totp/verify', { method: 'POST', body: JSON.stringify({ token }) }),
  totpDisable: () => api<{ ok: boolean }>('/auth/totp/disable', { method: 'POST' }),
  requestPasswordReset: (email: string) => api<{ sent: boolean; devToken?: string }>('/auth/password/request', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => api<{ ok: boolean }>('/auth/password/reset', { method: 'POST', body: JSON.stringify({ token, password }) }),
  requestEmailVerification: (email: string) => api<{ sent: boolean; devToken?: string }>('/auth/email/request', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyEmail: (token: string) => api<{ ok: boolean }>('/auth/email/verify', { method: 'POST', body: JSON.stringify({ token }) }),
};

/* ---------------------------------------------------------------- Users API */

export const usersApi = {
  me: () => api<User>('/users/me'),
  updateMe: (body: { name?: string; profilePhoto?: string; location?: GeoLocation }) =>
    api<User>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
  uploadPhoto: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiForm<User>('/users/me/photo', form);
  },
  byId: (id: string) => api<User>(`/users/${id}`),
};

/* ------------------------------------------------------------ Categories API */

export const categoriesApi = {
  list: () => api<Category[]>('/categories'),
  one: (id: string) => api<Category>(`/categories/${id}`),
};

/* ------------------------------------------------------------- Providers API */

export interface SearchParams {
  categoryId?: string;
  latitude?: number;
  longitude?: number;
  maxDistanceKm?: number;
  minRating?: number;
  limit?: number;
  skip?: number;
  cityName?: string;
}

export interface ProviderProfileInput {
  serviceCategories?: string[];
  serviceDescription?: string;
  yearsOfExperience?: number;
  serviceRadiusKm?: number;
  pricingModel?: PricingModel;
  city?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  location?: {
    city?: string;
    formattedAddress?: string;
    latitude?: number;
    longitude?: number;
  };
}

export const providersApi = {
  search: (params: SearchParams) => api<ProviderProfile[]>(`/providers/search${qs({ ...params })}`),
  getProfile: (userId: string) => api<ProviderProfile>(`/providers/${userId}/profile`),
  getMyProfile: () => api<ProviderProfile | null>('/providers/profile/me').catch(() => null),
  createProfile: (body: ProviderProfileInput) =>
    api<ProviderProfile>('/providers/profile', { method: 'POST', body: JSON.stringify(body) }),
  updateProfile: (body: ProviderProfileInput) =>
    api<ProviderProfile>('/providers/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  uploadDocument: (body: { documentType: string; documentUrl: string }) =>
    api<VerificationDocument>('/providers/verification-documents', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  uploadDocumentFile: (file: File, documentType: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('documentType', documentType);
    return apiForm<VerificationDocument>('/providers/verification-documents/upload', form);
  },
  myDocuments: () => api<VerificationDocument[]>('/providers/verification-documents/me'),
};

/* ---------------------------------------------------------------- Jobs API */

export const jobsApi = {
  myList: () => api<Job[]>('/jobs/me/list'),
  one: (id: string) => api<Job>(`/jobs/${id}`),
  create: (body: { providerId: string; description?: string; scheduledDate?: string; quoteAmount?: number; currency?: string }) =>
    api<Job>('/jobs', { method: 'POST', body: JSON.stringify(body) }),
  updateStatus: (id: string, status: JobStatus) =>
    api<Job>(`/jobs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updatePaymentStatus: (id: string, paymentStatus: 'pending' | 'paid' | 'refunded') =>
    api<Job>(`/jobs/${id}/payment`, { method: 'PATCH', body: JSON.stringify({ paymentStatus }) }),
};

/* ---------------------------------------------------------------- Leads API */

export const leadsApi = {
  contact: (providerId: string) =>
    api<{ phoneNumber: string; lead: Lead }>('/leads/contact', {
      method: 'POST',
      body: JSON.stringify({ providerId }),
    }),
  myLeads: () => api<Lead[]>('/leads/my-leads'),
};

/* -------------------------------------------------------------- Reviews API */

export const reviewsApi = {
  byProvider: (providerId: string) => api<Review[]>(`/reviews/provider/${providerId}`),
  create: (providerId: string, body: { jobId: string; rating: number; comment?: string }) =>
    api<Review>(`/reviews/provider/${providerId}`, { method: 'POST', body: JSON.stringify(body) }),
};

/* ------------------------------------------------------------- Messages API */

export interface Message {
  _id: string;
  senderId: string;
  recipientId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface Conversation {
  userId: string;
  name: string;
  profilePhoto?: string | null;
  role: Role;
  lastMessage: string;
  lastAt: string;
  unread: number;
  fromMe: boolean;
}

export const messagesApi = {
  conversations: () => api<Conversation[]>('/messages/conversations'),
  thread: (otherUserId: string) => api<Message[]>(`/messages/thread/${otherUserId}`),
  send: (recipientId: string, body: string) =>
    api<Message>('/messages', { method: 'POST', body: JSON.stringify({ recipientId, body }) }),
  unreadCount: () => api<{ count: number }>('/messages/unread-count'),
};

/* ------------------------------------------------------------ Favorites API */

export const favoritesApi = {
  list: () => api<Favorite[]>('/favorites'),
  add: (providerId: string) =>
    api<Favorite>('/favorites', { method: 'POST', body: JSON.stringify({ providerId }) }),
  remove: (providerId: string) =>
    api<{ deleted: boolean }>(`/favorites/${providerId}`, { method: 'DELETE' }),
};

/* -------------------------------------------------------- Subscriptions API */

export const subscriptionsApi = {
  plans: () => api<SubscriptionPlan[]>('/subscriptions/plans'),
  subscribe: (planId: string) =>
    api<ProviderSubscription>('/subscriptions/subscribe', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    }),
  me: () => api<ProviderSubscription | null>('/subscriptions/me').catch(() => null),
};

/* ---------------------------------------------------------------- Admin API */

export interface PlanInput {
  name: string;
  price: number;
  leadLimit: number;
  visibilityBoost: boolean;
  durationDays: number;
}

export const adminApi = {
  // Users
  users: (params: { skip?: number; limit?: number; role?: Role; search?: string } = {}) =>
    api<Paginated<User>>(`/admin/users${qs({ ...params })}`),
  setUserRole: (id: string, role: Role) =>
    api<User>(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  setUserStatus: (id: string, isActive: boolean) =>
    api<User>(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  updateUser: (id: string, body: { name?: string; phoneNumber?: string; email?: string }) =>
    api<User>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteUser: (id: string) =>
    api<{ deleted: boolean }>(`/admin/users/${id}`, { method: 'DELETE' }),

  // Providers
  providers: (params: { skip?: number; limit?: number } = {}) =>
    api<Paginated<ProviderProfile>>(`/admin/providers${qs({ ...params })}`),
  verifyProvider: (providerId: string, status: 'approved' | 'rejected') =>
    api<ProviderProfile>(`/admin/providers/${providerId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  verificationDocuments: () => api<VerificationDocument[]>('/admin/verification-documents'),
  setDocumentStatus: (docId: string, status: 'approved' | 'rejected') =>
    api<VerificationDocument>(`/admin/verification-documents/${docId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Reviews
  reviews: (params: { skip?: number; limit?: number } = {}) =>
    api<Paginated<Review>>(`/admin/reviews${qs({ ...params })}`),
  deleteReview: (id: string) =>
    api<{ deleted: boolean }>(`/admin/reviews/${id}`, { method: 'DELETE' }),

  // Jobs
  jobs: (params: { skip?: number; limit?: number; status?: JobStatus } = {}) =>
    api<Paginated<Job>>(`/admin/jobs${qs({ ...params })}`),

  // Categories
  categories: () => api<Category[]>('/admin/categories'),
  createCategory: (body: { name: string; description?: string }) =>
    api<Category>('/admin/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id: string, body: { name?: string; description?: string }) =>
    api<Category>(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCategory: (id: string) =>
    api<{ deleted: boolean }>(`/admin/categories/${id}`, { method: 'DELETE' }),

  // Stats
  jobStats: () => api<JobStats>('/admin/stats/jobs'),
  revenue: () => api<RevenueMetrics>('/admin/stats/revenue'),

  // Audit log
  auditLogs: (params: { skip?: number; limit?: number } = {}) =>
    api<Paginated<AuditLog>>(`/admin/audit-logs${qs({ ...params })}`),

  // Plans
  createPlan: (body: PlanInput) =>
    api<SubscriptionPlan>('/admin/plans', { method: 'POST', body: JSON.stringify(body) }),
  updatePlan: (id: string, body: Partial<PlanInput>) =>
    api<SubscriptionPlan>(`/admin/plans/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deletePlan: (id: string) =>
    api<{ deleted: boolean }>(`/admin/plans/${id}`, { method: 'DELETE' }),
};
