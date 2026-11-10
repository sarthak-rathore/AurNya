import { requireRole } from '@/lib/role-auth';
import { AnalyticsClient } from '@/components/admin/analytics-client';

export const metadata = { title: 'Analytics & Reports' };

export default async function OwnerAnalytics() {
  await requireRole('owner');
  return <AnalyticsClient />;
}
