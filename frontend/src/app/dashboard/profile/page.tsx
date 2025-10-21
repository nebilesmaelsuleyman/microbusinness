import type { Metadata } from 'next';
import Protected from '@/components/Protected';
import ProviderProfileEdit from '@/views/ProviderProfileEdit';

export const metadata: Metadata = { title: 'Edit profile', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Protected roles={['provider']}>
      <ProviderProfileEdit />
    </Protected>
  );
}
