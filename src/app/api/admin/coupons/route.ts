import { after } from 'next/server';
import { createCoupon, getCoupon } from '@/db/admin-coupons';
import { adminRoute, ok } from '@/lib/admin-route';
import { couponInputSchema } from '@/lib/admin-schemas';
import { announceCoupon } from '@/lib/whatsapp';

export const POST = (req: Request) => adminRoute(req, couponInputSchema, async ({ db, actor, body }) => {
  const { id } = await createCoupon(db, body, actor);
  // A new live coupon is announced to every subscribed customer on WhatsApp (once each).
  after(async () => { const c = await getCoupon(db, id); if (c) await announceCoupon({ ...c, kind: c.kind as 'percent' | 'fixed' }).catch(console.error); });
  return ok({ id });
});
