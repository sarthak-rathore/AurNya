import { requireAdminPage } from '@/lib/admin-auth';
import { AnalyticsClient } from '@/components/admin/analytics-client';

export const metadata = { title: 'Analytics & Reports' };

export default async function AdminAnalytics() {
  await requireAdminPage();
  return <AnalyticsClient />;
}
