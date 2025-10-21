import type { Metadata } from 'next';
import ProviderProfile from '../../../views/ProviderProfile';
import { getProviderProfileSSR, getReviewsSSR } from '../../../api/server';
import { providerName, categoryNames, providerPhoto } from '../../../lib/format';

interface PageProps {
  params: { userId: string };
}

// Per-provider <title>/description/OpenGraph for search + social previews.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const profile = await getProviderProfileSSR(params.userId);
  if (!profile) {
    return { title: 'Provider not found', robots: { index: false, follow: false } };
  }
  const name = providerName(profile);
  const cats = categoryNames(profile);
  const catText = cats.length ? cats.join(', ') : 'local services';
  const desc =
    (profile.serviceDescription && profile.serviceDescription.slice(0, 155)) ||
    `${name} offers ${catText} on Servio. ${profile.reviewCount} reviews, ${profile.ratingAverage.toFixed(1)}★ rating.`;
  const photo = providerPhoto(profile);

  return {
    title: `${name} — ${catText}`,
    description: desc,
    alternates: { canonical: `/provider/${params.userId}` },
    openGraph: {
      type: 'profile',
      title: `${name} — ${catText}`,
      description: desc,
      url: `/provider/${params.userId}`,
      images: photo ? [{ url: photo }] : undefined,
    },
  };
}

export default async function ProviderProfilePage({ params }: PageProps) {
  const profile = await getProviderProfileSSR(params.userId);
  const reviews = profile ? (await getReviewsSSR(profile._id)) ?? [] : [];

  // LocalBusiness structured data for rich results (only when verified data exists).
  const jsonLd = profile
    ? {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: providerName(profile),
        description: profile.serviceDescription || undefined,
        image: providerPhoto(profile) || undefined,
        ...(profile.reviewCount > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: profile.ratingAverage.toFixed(1),
                reviewCount: profile.reviewCount,
              },
            }
          : {}),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProviderProfile
        userId={params.userId}
        initialProfile={profile}
        initialReviews={reviews}
      />
    </>
  );
}
