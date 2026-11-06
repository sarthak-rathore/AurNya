import { z } from 'zod';
import { deleteCoupon, setCouponActive, updateCoupon } from '@/db/admin-coupons';
import { jsonError } from '@/lib/admin-auth';
import { adminRoute, idParam, ok } from '@/lib/admin-route';
import { couponInputSchema } from '@/lib/admin-schemas';

type P = { params: Promise<{ id: string }> };
export const PUT = async (req: Request, { params }: P) => { const id = idParam((await params).id); if (!id) return jsonError(404, 'Not found.');
  return adminRoute(req, couponInputSchema, async ({ db, actor, body }) => { await updateCoupon(db, id, body, actor); return ok(); }); };
export const PATCH = async (req: Request, { params }: P) => { const id = idParam((await params).id); if (!id) return jsonError(404, 'Not found.');
  return adminRoute(req, z.object({ isActive: z.boolean() }), async ({ db, actor, body }) => { await setCouponActive(db, id, body.isActive, actor); return ok(); }); };
export const DELETE = async (req: Request, { params }: P) => { const id = idParam((await params).id); if (!id) return jsonError(404, 'Not found.');
  return adminRoute(req, null, async ({ db, actor }) => { await deleteCoupon(db, id, actor); return ok(); }); };
