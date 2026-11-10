import { after } from 'next/server';
import { z } from 'zod';
import { deleteCoupon, getCoupon, setCouponActive, updateCoupon } from '@/db/admin-coupons';
import { announceCoupon } from '@/lib/whatsapp';

const announce = (db: Parameters<typeof getCoupon>[0], id: number) => after(async () => { const c = await getCoupon(db, id); if (c) await announceCoupon({ ...c, kind: c.kind as 'percent' | 'fixed' }).catch(console.error); });
import { jsonError } from '@/lib/admin-auth';
import { adminRoute, idParam, ok } from '@/lib/admin-route';
import { couponInputSchema } from '@/lib/admin-schemas';

type P = { params: Promise<{ id: string }> };
export const PUT = async (req: Request, { params }: P) => { const id = idParam((await params).id); if (!id) return jsonError(404, 'Not found.');
  return adminRoute(req, couponInputSchema, async ({ db, actor, body }) => { await updateCoupon(db, id, body, actor); announce(db, id); return ok(); }); };
export const PATCH = async (req: Request, { params }: P) => { const id = idParam((await params).id); if (!id) return jsonError(404, 'Not found.');
  return adminRoute(req, z.object({ isActive: z.boolean() }), async ({ db, actor, body }) => { await setCouponActive(db, id, body.isActive, actor); if (body.isActive) announce(db, id); return ok(); }); };
export const DELETE = async (req: Request, { params }: P) => { const id = idParam((await params).id); if (!id) return jsonError(404, 'Not found.');
  return adminRoute(req, null, async ({ db, actor }) => { await deleteCoupon(db, id, actor); return ok(); }); };
