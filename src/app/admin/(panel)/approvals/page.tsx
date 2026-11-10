import { ApprovalsClient } from '@/components/admin/approvals-client';
import { requireAdminPage } from '@/lib/admin-auth';

export const metadata = { title: 'My Requests' };
export default async function Page() {
  await requireAdminPage();
  return <ApprovalsClient role="admin" />;
}
