import { after } from 'next/server';
import { announceBar } from '@/lib/whatsapp';
import { writeSetting } from '@/db/settings';
import { audit } from '@/db/admin-audit';
import { adminRoute, ok } from '@/lib/admin-route';
import { refreshSettings } from '@/lib/admin-revalidate';
import { announcementSchema } from '@/lib/admin-schemas';

export const PUT = (req: Request) => adminRoute(req, announcementSchema, async ({ db, actor, body }) => {
  await writeSetting(db, 'announcement', body); await audit(db, actor, 'update', 'announcement', null, body.visible ? 'Announcement bar updated' : 'Announcement bar switched off'); refreshSettings();
  // A new live announcement (a sale, a launch) is sent to every subscribed customer once. A scheduled bar is announced when it is saved only if it is already live.
  const live = body.visible && !!body.message && (!body.start || new Date(body.start).getTime() <= Date.now()) && (!body.end || new Date(body.end).getTime() > Date.now());
  if (live) after(() => announceBar(body.message, body.href).then(() => undefined).catch(console.error));
  return ok();
});
