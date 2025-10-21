import type { Metadata } from 'next';
import Protected from '@/components/Protected';
import Account from '@/views/Account';

export const metadata: Metadata = { title: 'Account settings', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Protected>
      <Account />
    </Protected>
  );
}
