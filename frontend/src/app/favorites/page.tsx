import type { Metadata } from 'next';
import Protected from '@/components/Protected';
import Favorites from '@/views/Favorites';

export const metadata: Metadata = { title: 'Saved providers', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Protected roles={['customer']}>
      <Favorites />
    </Protected>
  );
}
