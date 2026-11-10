import { requireRole } from '@/lib/role-auth';
import { DashboardClient } from '@/components/admin/dashboard-client';
import { liveTotals } from '@/lib/dashboard-live';
import { isDemoMode } from '@/lib/demo-mode';

export const metadata = { title: 'Owner Dashboard' };

export default async function Dashboard() {
  await requireRole('owner');
  const live = await liveTotals();
  return <DashboardClient role="owner" isDemo={isDemoMode()} live={live} />;
}
