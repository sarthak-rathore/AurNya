import { eq } from 'drizzle-orm';
import type { Coupon } from '@/lib/coupons';
import { normalizeCode } from '@/lib/coupons';
import type { CouponStore } from '@/lib/quote';
import type { Db } from './client';
import { coupons } from './schema';
import { isDemoMode } from '@/lib/demo-mode';

export function createDbCouponStore(db: Db): CouponStore {
  return {
    async find(code) {
      const [r] = await db.select().from(coupons).where(eq(coupons.code, normalizeCode(code))).limit(1);
      if (!r) return null;
      if (!isDemoMode() && r.isDemo) return null;
      const c: Coupon = { code: r.code, kind: r.kind, value: r.value, minSubtotalPaise: r.minSubtotalPaise, startsAt: r.startsAt, endsAt: r.endsAt, maxRedemptions: r.maxRedemptions, redemptions: r.redemptions, isActive: r.isActive, isDemo: r.isDemo };
      return c;
    },
  };
}
