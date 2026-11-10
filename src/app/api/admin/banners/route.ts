import { writeSetting } from '@/db/settings';
import { audit } from '@/db/admin-audit';
import { adminRoute, ok } from '@/lib/admin-route';
import { refreshSettings } from '@/lib/admin-revalidate';
import { heroImagesSchema } from '@/lib/admin-schemas';

export const PUT = (req: Request) => adminRoute(req, heroImagesSchema, async ({ db, actor, body }) => {
  await writeSetting(db, 'hero_images', body); await audit(db, actor, 'update', 'banners', null, 'Home page pictures updated'); refreshSettings(); return ok();
});
