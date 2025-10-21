import type { Metadata } from 'next';
import Protected from '@/components/Protected';
import Subscription from '@/views/Subscription';

export const metadata: Metadata = { title: 'Subscription', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Protected roles={['provider']}>
      <Subscription />
    </Protected>
  );
}
