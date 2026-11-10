import { adjustStock } from '@/db/admin-products';
import { adminRoute, ok } from '@/lib/admin-route';
import { refreshStore } from '@/lib/admin-revalidate';
import { stockAdjustSchema } from '@/lib/admin-schemas';

export const PATCH = (req: Request) => adminRoute(req, stockAdjustSchema, async ({ db, actor, body }) => {
  const r = await adjustStock(db, body, actor); refreshStore([r.slug]); return ok({ stock: r.stock });
});
