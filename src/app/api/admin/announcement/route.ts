import { writeSetting } from '@/db/settings';
import { audit } from '@/db/admin-audit';
import { adminRoute, ok } from '@/lib/admin-route';
import { refreshSettings } from '@/lib/admin-revalidate';
import { announcementSchema } from '@/lib/admin-schemas';

export const PUT = (req: Request) => adminRoute(req, announcementSchema, async ({ db, actor, body }) => {
  await writeSetting(db, 'announcement', body); await audit(db, actor, 'update', 'announcement', null, body.visible ? 'Announcement bar updated' : 'Announcement bar switched off'); refreshSettings(); return ok();
});
