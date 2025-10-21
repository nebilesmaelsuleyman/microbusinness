import type { Metadata } from 'next';
import '../index.css';
import Providers from '../components/Providers';
import Shell from '../components/Shell';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Servio — Find trusted local service providers',
    template: '%s · Servio',
  },
  icons: {
    icon: '/favicon.svg',
  },
  description:
    'Servio is a local marketplace to find verified service providers near you — compare ratings, contact directly, and get the job done.',
  keywords: ['local services', 'service providers', 'hire a pro', 'marketplace', 'verified providers'],
  openGraph: {
    type: 'website',
    siteName: 'Servio',
    title: 'Servio — Find trusted local service providers',
    description: 'Find verified local pros near you. Compare ratings, contact directly, get the job done.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Servio — Find trusted local service providers',
    description: 'Find verified local pros near you. Compare ratings, contact directly, get the job done.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
