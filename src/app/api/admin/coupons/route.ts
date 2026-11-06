import { createCoupon } from '@/db/admin-coupons';
import { adminRoute, ok } from '@/lib/admin-route';
import { couponInputSchema } from '@/lib/admin-schemas';

export const POST = (req: Request) => adminRoute(req, couponInputSchema, async ({ db, actor, body }) => ok({ id: (await createCoupon(db, body, actor)).id }));
