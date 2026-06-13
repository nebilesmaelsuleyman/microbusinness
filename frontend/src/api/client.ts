const API_BASE = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'microbusiness_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || data.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

export const authApi = {
  sendOtp: (phoneNumber: string) =>
    api<{ message: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    }),
  verifyOtp: (body: { phoneNumber: string; otp: string; name?: string; role?: string }) =>
    api<{ access_token: string; user: AuthUser }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export interface AuthUser {
  id: string;
  phoneNumber: string;
  name: string;
  role: 'customer' | 'provider' | 'admin';
  profilePhoto?: string;
  location?: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
}

export interface ProviderProfile {
  _id: string;
  userId: string | { _id: string; name?: string; phoneNumber?: string; profilePhoto?: string; location?: string };
  serviceCategories: Category[] | string[];
  serviceDescription: string;
  yearsOfExperience: number;
  serviceRadiusKm: number;
  pricingModel: 'fixed' | 'hourly' | 'quote';
  verificationStatus: string;
  ratingAverage: number;
  reviewCount: number;
}

export interface Job {
  _id: string;
  customerId: string | { _id: string; name?: string; phoneNumber?: string };
  providerId: string | { _id?: string; userId?: string };
  status: string;
  description?: string;
  scheduledDate?: string;
  createdAt: string;
}

export interface Lead {
  _id: string;
  customerId: string | { _id: string; name?: string; phoneNumber?: string };
  providerId: string;
  createdAt: string;
}

export const categoriesApi = {
  list: () => api<Category[]>('/categories'),
  one: (id: string) => api<Category>(`/categories/${id}`),
};

export const providersApi = {
  search: (params: {
    categoryId?: string;
    latitude?: number;
    longitude?: number;
    maxDistanceKm?: number;
    minRating?: number;
    limit?: number;
    skip?: number;
  }) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') q.set(k, String(v));
    });
    return api<ProviderProfile[]>(`/providers/search?${q}`);
  },
  getProfile: (userId: string) => api<ProviderProfile>(`/providers/${userId}/profile`),
  getMyProfile: () => api<ProviderProfile | null>('/providers/profile/me'),
};

export const jobsApi = {
  myList: () => api<Job[]>('/jobs/me/list'),
  one: (id: string) => api<Job>(`/jobs/${id}`),
  create: (body: { providerId: string; description?: string; scheduledDate?: string }) =>
    api<Job>('/jobs', { method: 'POST', body: JSON.stringify(body) }),
  updateStatus: (id: string, status: string) =>
    api<Job>(`/jobs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export const leadsApi = {
  contact: (providerId: string) =>
    api<unknown>('/leads/contact', { method: 'POST', body: JSON.stringify({ providerId }) }),
  myLeads: () => api<Lead[]>('/leads/my-leads'),
};

// ---------- Reviews ----------
export interface Review {
  _id: string;
  customerId: string | { _id: string; name?: string };
  providerId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const reviewsApi = {
  listByProvider: (providerId: string) => api<Review[]>(`/reviews/provider/${providerId}`),
  create: (providerId: string, body: { rating: number; comment?: string }) =>
    api<Review>(`/reviews/provider/${providerId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// ---------- Favorites ----------
export interface Favorite {
  _id: string;
  customerId: string;
  providerId: string | ProviderProfile;
  createdAt: string;
}

export const favoritesApi = {
  list: () => api<Favorite[]>('/favorites'),
  add: (providerId: string) =>
    api<Favorite>('/favorites', { method: 'POST', body: JSON.stringify({ providerId }) }),
  remove: (providerId: string) =>
    api<unknown>(`/favorites/${providerId}`, { method: 'DELETE' }),
};

// ---------- Notifications ----------
export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  list: (unreadOnly = false) =>
    api<Notification[]>(`/notifications?unreadOnly=${unreadOnly}`),
  unreadCount: () => api<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) =>
    api<Notification>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => api<{ modified: number }>('/notifications/read-all', { method: 'PATCH' }),
  delete: (id: string) => api<unknown>(`/notifications/${id}`, { method: 'DELETE' }),
};

// ---------- Messages ----------
export interface Conversation {
  _id: string;
  participants: Array<string | { _id: string; name?: string; phoneNumber?: string; profilePhoto?: string }>;
  jobId: string | null;
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  text: string;
  readBy: string[];
  createdAt: string;
}

export const messagesApi = {
  conversations: () => api<Conversation[]>('/messages/conversations'),
  getMessages: (conversationId: string, before?: string) => {
    const q = before ? `?before=${encodeURIComponent(before)}` : '';
    return api<Message[]>(`/messages/conversations/${conversationId}${q}`);
  },
  send: (body: { conversationId?: string; recipientId?: string; jobId?: string; text: string }) =>
    api<Message>('/messages', { method: 'POST', body: JSON.stringify(body) }),
  markRead: (conversationId: string) =>
    api<{ modified: number }>(`/messages/conversations/${conversationId}/read`, { method: 'PATCH' }),
  unreadCount: () => api<{ count: number }>('/messages/unread-count'),
};

// ---------- Payments / Invoices ----------
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  jobId: string | Job;
  providerId: string | ProviderProfile;
  customerId: string | { _id: string; name?: string; phoneNumber?: string };
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  notes: string;
  createdAt: string;
}

export interface Transaction {
  _id: string;
  payerId: string;
  payeeId: string | null;
  jobId: string | null;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  paidAt: string | null;
  createdAt: string;
}

export const paymentsApi = {
  listInvoices: () => api<Invoice[]>('/payments/invoices'),
  getInvoice: (id: string) => api<Invoice>(`/payments/invoices/${id}`),
  createInvoice: (body: {
    jobId: string;
    lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;
    tax?: number;
    dueDate?: string;
    notes?: string;
  }) => api<Invoice>('/payments/invoices', { method: 'POST', body: JSON.stringify(body) }),
  recordPayment: (body: {
    type: 'job_payment' | 'subscription' | 'deposit';
    amount: number;
    invoiceId?: string;
    jobId?: string;
    payeeId?: string;
    description?: string;
  }) => api<Transaction>('/payments/transactions', { method: 'POST', body: JSON.stringify(body) }),
  listTransactions: () => api<Transaction[]>('/payments/transactions'),
  earnings: () =>
    api<{ totalEarned: number; pendingAmount: number; invoiceCount: number; paidInvoices: number }>(
      '/payments/earnings',
    ),
};

// ---------- Portfolio ----------
export interface PortfolioItem {
  _id: string;
  providerId: string;
  title: string;
  description: string;
  imageUrls: string[];
  categoryId: string | { _id: string; name: string } | null;
  completedAt: string | null;
  displayOrder: number;
  createdAt: string;
}

export const portfolioApi = {
  listByProvider: (providerId: string) =>
    api<PortfolioItem[]>(`/portfolio/provider/${providerId}`),
  listMine: () => api<PortfolioItem[]>('/portfolio/me'),
  create: (body: {
    title: string;
    description?: string;
    imageUrls?: string[];
    categoryId?: string;
    completedAt?: string;
  }) => api<PortfolioItem>('/portfolio', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{
    title: string;
    description: string;
    imageUrls: string[];
    categoryId: string;
    completedAt: string;
    displayOrder: number;
  }>) => api<PortfolioItem>(`/portfolio/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => api<unknown>(`/portfolio/${id}`, { method: 'DELETE' }),
};

// ---------- Subscriptions ----------
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
  planId: string | SubscriptionPlan;
  startDate: string;
  endDate: string;
  leadUsed: number;
}

export const subscriptionsApi = {
  plans: () => api<SubscriptionPlan[]>('/subscriptions/plans'),
  subscribe: (planId: string) =>
    api<ProviderSubscription>('/subscriptions/subscribe', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    }),
  mine: () => api<ProviderSubscription | null>('/subscriptions/me'),
};

// ---------- Provider profile mutations ----------
export const providerProfileApi = {
  create: (body: {
    serviceCategories: string[];
    serviceDescription: string;
    yearsOfExperience?: number;
    serviceRadiusKm?: number;
    pricingModel?: 'fixed' | 'hourly' | 'quote';
    latitude?: number;
    longitude?: number;
  }) => api<ProviderProfile>('/providers/profile', { method: 'POST', body: JSON.stringify(body) }),
  update: (body: Partial<{
    serviceCategories: string[];
    serviceDescription: string;
    yearsOfExperience: number;
    serviceRadiusKm: number;
    pricingModel: 'fixed' | 'hourly' | 'quote';
    latitude: number;
    longitude: number;
  }>) => api<ProviderProfile>('/providers/profile', { method: 'PATCH', body: JSON.stringify(body) }),
};

// ---------- Jobs (extended) ----------
export const jobsExtApi = {
  setQuote: (id: string, quotedPrice: number) =>
    api<Job>(`/jobs/${id}/quote`, { method: 'PATCH', body: JSON.stringify({ quotedPrice }) }),
  complete: (id: string, body: { finalPrice?: number; completionNotes?: string }) =>
    api<Job>(`/jobs/${id}/complete`, { method: 'PATCH', body: JSON.stringify(body) }),
};

// ---------- Admin ----------
export const adminApi = {
  users: (page = 1, limit = 20) =>
    api<{ data: AuthUser[]; total: number; page: number }>(`/admin/users?page=${page}&limit=${limit}`),
  providers: (page = 1, limit = 20) =>
    api<{ data: ProviderProfile[]; total: number; page: number }>(`/admin/providers?page=${page}&limit=${limit}`),
  setProviderVerification: (providerId: string, status: 'approved' | 'rejected') =>
    api<ProviderProfile>(`/admin/providers/${providerId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  pendingDocs: () => api<unknown[]>('/admin/verification-documents'),
  setDocStatus: (docId: string, status: 'approved' | 'rejected') =>
    api<unknown>(`/admin/verification-documents/${docId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  categories: () => api<Category[]>('/admin/categories'),
  createCategory: (body: { name: string; description?: string }) =>
    api<Category>('/admin/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id: string, body: { name?: string; description?: string }) =>
    api<Category>(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  jobStats: () => api<Record<string, number>>('/admin/stats/jobs'),
  revenueStats: () => api<Record<string, unknown>>('/admin/stats/revenue'),
  createPlan: (body: {
    name: string;
    price: number;
    leadLimit: number;
    durationDays: number;
    visibilityBoost?: boolean;
  }) => api<SubscriptionPlan>('/admin/plans', { method: 'POST', body: JSON.stringify(body) }),
};
