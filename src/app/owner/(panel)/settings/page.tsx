import { SettingsClient, type SavedSettings } from '@/components/admin/settings-client';
import { getDb } from '@/db/client';
import { readSection } from '@/db/sections';
import { requireRole } from '@/lib/role-auth';

export const metadata = { title: 'Settings' };

export default async function OwnerSettings() {
  await requireRole('owner');
  return <SettingsClient saved={await readSection<SavedSettings>(getDb(), 'settings', {})} />;
}
