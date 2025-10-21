import type { MetadataRoute } from 'next';
import { searchProvidersSSR } from '../api/server';
import { providerUserId } from '../lib/format';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

// Lists public, indexable URLs: the home page plus every verified provider profile.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const providers = (await searchProvidersSSR('?limit=100')) ?? [];

  const providerUrls: MetadataRoute.Sitemap = providers
    .map((p) => providerUserId(p))
    .filter(Boolean)
    .map((userId) => ({
      url: `${SITE_URL}/provider/${userId}`,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    ...providerUrls,
  ];
}
