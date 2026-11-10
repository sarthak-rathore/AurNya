import { ApprovalsClient } from '@/components/admin/approvals-client';
import { requireRole } from '@/lib/role-auth';

export const metadata = { title: 'Approvals' };
export default async function Page() {
  await requireRole('owner');
  return <ApprovalsClient role="owner" />;
}
