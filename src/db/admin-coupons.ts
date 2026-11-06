import { desc, eq } from 'drizzle-orm';
import type { CouponInput } from '@/lib/admin-schemas';
import { audit } from './admin-audit';
import { AdminError, friendlyDbError } from './admin-errors';
import type { Db } from './client';
import { coupons } from './schema';

export const listAllCoupons = (db: Db) => db.select().from(coupons).orderBy(desc(coupons.createdAt), desc(coupons.id));

export async function createCoupon(db: Db, c: CouponInput, actor: string): Promise<{ id: number }> {
  try {
    const [r] = await db.insert(coupons).values({ code: c.code, kind: c.kind, value: c.value, minSubtotalPaise: c.minSubtotalPaise, startsAt: c.startsAt, endsAt: c.endsAt, maxRedemptions: c.maxRedemptions, isActive: c.isActive }).returning({ id: coupons.id });
    await audit(db, actor, 'create', 'coupon', r.id, `Created coupon ${c.code}`);
    return r;
  } catch (e) { return friendlyDbError(e); }
}

/** The code itself cannot change (orders refer to it); everything else can. */
export async function updateCoupon(db: Db, id: number, c: CouponInput, actor: string): Promise<void> {
  try {
    const [old] = await db.select({ code: coupons.code, redemptions: coupons.redemptions }).from(coupons).where(eq(coupons.id, id)).limit(1);
    if (!old) throw new AdminError(404, 'That coupon no longer exists.');
    if (c.code !== old.code) throw new AdminError(400, 'A coupon code cannot be changed. Create a new coupon instead.');
    if (c.maxRedemptions !== null && c.maxRedemptions < old.redemptions) throw new AdminError(400, `This coupon has already been used ${old.redemptions} times, so the limit cannot be lower than that.`);
    await db.update(coupons).set({ kind: c.kind, value: c.value, minSubtotalPaise: c.minSubtotalPaise, startsAt: c.startsAt, endsAt: c.endsAt, maxRedemptions: c.maxRedemptions, isActive: c.isActive }).where(eq(coupons.id, id));
    await audit(db, actor, 'update', 'coupon', id, `Edited coupon ${old.code}`);
  } catch (e) { return friendlyDbError(e); }
}

export async function setCouponActive(db: Db, id: number, isActive: boolean, actor: string): Promise<void> {
  const [r] = await db.update(coupons).set({ isActive }).where(eq(coupons.id, id)).returning({ code: coupons.code });
  if (!r) throw new AdminError(404, 'That coupon no longer exists.');
  await audit(db, actor, 'status', 'coupon', id, `Coupon ${r.code} ${isActive ? 'switched on' : 'switched off'}`);
}

export async function deleteCoupon(db: Db, id: number, actor: string): Promise<void> {
  const [r] = await db.delete(coupons).where(eq(coupons.id, id)).returning({ code: coupons.code });
  if (!r) throw new AdminError(404, 'That coupon no longer exists.');
  await audit(db, actor, 'delete', 'coupon', id, `Deleted coupon ${r.code}`);
}
