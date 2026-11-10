import { requireRole } from '@/lib/role-auth';
import { MarketingClient, type Campaign } from '@/components/admin/marketing-client';
import { getDb } from '@/db/client';
import { readSection } from '@/db/sections';
import { listSubscribers } from '@/db/whatsapp';
import { defaultCountryCode, readWhatsappConfig } from '@/lib/whatsapp-config';

export const metadata = { title: 'Marketing' };

export default async function Marketing() {
  await requireRole('owner');
  const saved = await readSection<Campaign[] | null>(getDb(), 'marketing', null);
  let subscribers = 0;
  try { subscribers = (await listSubscribers(getDb(), defaultCountryCode())).length; } catch { /* shown as 0 */ }
  return <MarketingClient saved={saved ?? undefined} wa={{ configured: readWhatsappConfig().ok, subscribers }} />;
}
