/* ==========================================================================
   Server-side fetch helpers — used by Server Components for SSR/SEO.
   Only hits PUBLIC backend endpoints (no auth token on the server).
   ========================================================================== */
import type { ProviderProfile, Review, Category } from './client';

// On the server we can talk to the backend over an internal URL; falls back to
// the public URL, then localhost for dev.
const API_BASE =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

async function serverGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      // Revalidate at most once a minute — fresh enough for listings, cheap for crawlers.
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function getProviderProfileSSR(userId: string) {
  return serverGet<ProviderProfile>(`/providers/${userId}/profile`);
}

export function getReviewsSSR(providerId: string) {
  return serverGet<Review[]>(`/reviews/provider/${providerId}`);
}

export function searchProvidersSSR(query = '') {
  return serverGet<ProviderProfile[]>(`/providers/search${query}`);
}

export function listCategoriesSSR() {
  return serverGet<Category[]>(`/categories`);
}
