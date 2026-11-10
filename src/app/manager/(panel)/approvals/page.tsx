import { ApprovalsClient } from '@/components/admin/approvals-client';
import { requireRole } from '@/lib/role-auth';

export const metadata = { title: 'My Requests' };
export default async function Page() {
  await requireRole('manager');
  return <ApprovalsClient role="manager" />;
}
