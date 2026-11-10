import { requireAdminPage } from '@/lib/admin-auth';
import { DashboardClient } from '@/components/admin/dashboard-client';
import { liveTotals } from '@/lib/dashboard-live';
import { isDemoMode } from '@/lib/demo-mode';

export const metadata = { title: 'Admin Dashboard' };

export default async function Dashboard() {
  await requireAdminPage();
  const live = await liveTotals();
  return <DashboardClient role="admin" isDemo={isDemoMode()} live={live} />;
}
