import type { Metadata } from 'next';
import Protected from '@/components/Protected';
import MyJobs from '@/views/MyJobs';

export const metadata: Metadata = { title: 'My jobs', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Protected roles={['customer','provider']}>
      <MyJobs />
    </Protected>
  );
}
