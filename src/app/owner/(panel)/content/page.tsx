import { requireRole } from '@/lib/role-auth';
import { ContentClient } from '@/components/admin/content-client';
import { getDb } from '@/db/client';
import { readSection } from '@/db/sections';
import { readSetting } from '@/db/settings';
import { site } from '@/config/site';
import { parseAnnouncement } from '@/lib/announcement';

export const metadata = { title: 'Content Management' };

export default async function Content() {
  await requireRole('owner');
  const db = getDb();
  let a = site.announcement;
  if (db) { try { const raw = await readSetting(db, 'announcement'); a = raw === null ? site.announcement : parseAnnouncement(raw, site.announcement); } catch { /* use the default */ } }
  const saved = await readSection<{ badges?: { title: string; desc: string }[]; pages?: never[] }>(db, 'content', {});
  return <ContentClient announcement={{ visible: a.visible, message: a.message, href: a.href, linkText: a.linkText }} saved={saved as never} />;
}
