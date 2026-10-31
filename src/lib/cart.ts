import type { CartLine } from './types';
import { DEMO_COUPON, evaluateCoupon } from './coupons';

// Instant, in-browser ESTIMATE using the built-in sample coupon. The authoritative numbers come from the server
// (see src/lib/quote.ts), which uses the database's real coupons and prices. Same rules, same function.
export const MAX_QTY = 10;
export const subtotal = (lines: CartLine[]): number => lines.reduce((s, l) => s + l.pricePaise * l.qty, 0);
export function applyCoupon(code: string, sub: number): { ok: boolean; discount: number; message: string } {
  const normalized = code.trim().toUpperCase();
  const r = evaluateCoupon(normalized === DEMO_COUPON.code ? DEMO_COUPON : null, code, sub);
  return { ok: r.ok, discount: r.discountPaise, message: r.message };
}
