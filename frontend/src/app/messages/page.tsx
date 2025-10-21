import type { Metadata } from 'next';
import Protected from '@/components/Protected';
import Messages from '@/views/Messages';

export const metadata: Metadata = { title: 'Messages', robots: { index: false, follow: false } };
// Reads the ?to= query param on the client, so keep this route dynamic.
export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Protected roles={['customer', 'provider', 'admin']}>
      <Messages />
    </Protected>
  );
}
