import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep auth-gated app areas out of the index.
      disallow: ['/account', '/admin', '/dashboard', '/my-jobs', '/favorites', '/login'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
