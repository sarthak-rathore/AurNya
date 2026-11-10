import { requireRole } from '@/lib/role-auth';
import { DashboardClient } from '@/components/admin/dashboard-client';
import { liveTotals } from '@/lib/dashboard-live';
import { isDemoMode } from '@/lib/demo-mode';

export const metadata = { title: 'Manager Dashboard' };

export default async function Dashboard() {
  await requireRole('manager');
  const live = await liveTotals();
  return <DashboardClient role="manager" isDemo={isDemoMode()} live={live} />;
}
