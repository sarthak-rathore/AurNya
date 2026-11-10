import { z } from 'zod';
import { deleteProduct, setProductStatus, updateProduct } from '@/db/admin-products';
import { jsonError } from '@/lib/admin-auth';
import { adminRoute, idParam, ok } from '@/lib/admin-route';
import { refreshStore } from '@/lib/admin-revalidate';
import { productInputSchema } from '@/lib/admin-schemas';

type P = { params: Promise<{ id: string }> };
export const PUT = async (req: Request, { params }: P) => { const id = idParam((await params).id); if (!id) return jsonError(404, 'Not found.');
  return adminRoute(req, productInputSchema, async ({ db, actor, body }) => { const r = await updateProduct(db, id, body, actor); refreshStore([r.slug, r.previousSlug]); return ok({ slug: r.slug }); }); };
export const PATCH = async (req: Request, { params }: P) => { const id = idParam((await params).id); if (!id) return jsonError(404, 'Not found.');
  return adminRoute(req, z.object({ status: z.enum(['draft', 'active', 'archived']) }), async ({ db, actor, body }) => { const r = await setProductStatus(db, id, body.status, actor); refreshStore([r.slug]); return ok(); }); };
export const DELETE = async (req: Request, { params }: P) => { const id = idParam((await params).id); if (!id) return jsonError(404, 'Not found.');
  return adminRoute(req, null, async ({ db, actor }) => { const r = await deleteProduct(db, id, actor); refreshStore([r.slug]); return ok(); }); };
