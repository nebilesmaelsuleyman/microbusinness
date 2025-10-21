import type { Metadata } from 'next';
import Protected from '@/components/Protected';
import Admin from '@/views/Admin';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Protected roles={['admin']}>
      <Admin />
    </Protected>
  );
}
