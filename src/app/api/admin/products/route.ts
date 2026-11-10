import { createProduct } from '@/db/admin-products';
import { adminRoute, ok } from '@/lib/admin-route';
import { refreshStore } from '@/lib/admin-revalidate';
import { productInputSchema } from '@/lib/admin-schemas';

export const POST = (req: Request) => adminRoute(req, productInputSchema, async ({ db, actor, body }) => {
  const r = await createProduct(db, body, actor); refreshStore([r.slug]); return ok({ id: r.id });
});
