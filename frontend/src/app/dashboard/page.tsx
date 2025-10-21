import type { Metadata } from 'next';
import Protected from '@/components/Protected';
import ProviderDashboard from '@/views/ProviderDashboard';

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Protected roles={['provider']}>
      <ProviderDashboard />
    </Protected>
  );
}
