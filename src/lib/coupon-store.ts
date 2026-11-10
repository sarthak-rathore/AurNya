import { createDbCouponStore } from '@/db/coupons';
import { getDb } from '@/db/client';
import { DEMO_COUPON, normalizeCode } from './coupons';
import type { CouponStore } from './quote';
import { isDemoMode } from './demo-mode';

// Same idea as the catalogue: the database's coupons when DATABASE_URL is set, otherwise the one built-in sample coupon.
export const memoryCouponStore: CouponStore = {
  async find(code) {
    if (!isDemoMode()) return null;
    return normalizeCode(code) === DEMO_COUPON.code ? DEMO_COUPON : null;
  }
};
const db = getDb();
export const couponStore: CouponStore = db ? createDbCouponStore(db) : memoryCouponStore;
