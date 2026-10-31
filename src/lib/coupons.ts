import { formatINR } from './money';

// Coupon rules live here, once. The bag uses them for an instant estimate in the browser, and the server uses the very same
// function (with the database's coupons) when it checks the bag. Pure functions only, so they are safe in the browser too.

export type CouponKind = 'percent' | 'fixed';
export interface Coupon {
  code: string; kind: CouponKind; value: number; minSubtotalPaise: number;
  startsAt: Date | null; endsAt: Date | null; maxRedemptions: number | null; redemptions: number; isActive: boolean; isDemo: boolean;
}
export type CouponProblem = 'empty' | 'not_found' | 'inactive' | 'not_started' | 'expired' | 'used_up' | 'minimum';
export interface CouponResult { ok: boolean; discountPaise: number; message: string; problem?: CouponProblem; code?: string }

export const normalizeCode = (code: string): string => code.trim().toUpperCase();

/** The built-in sample coupon: 10% off. Also what the demo (no database) mode uses. */
export const DEMO_COUPON: Coupon = {
  code: 'AURDEMO10', kind: 'percent', value: 10, minSubtotalPaise: 0, startsAt: null, endsAt: null, maxRedemptions: null, redemptions: 0, isActive: true, isDemo: true,
};

export function evaluateCoupon(coupon: Coupon | null, input: string, subtotalPaise: number, now: Date = new Date()): CouponResult {
  const code = normalizeCode(input);
  const no = (problem: CouponProblem, message: string): CouponResult => ({ ok: false, discountPaise: 0, message, problem, code });
  if (!code) return no('empty', '');
  if (!coupon) return no('not_found', 'This code is not valid.');
  if (!coupon.isActive) return no('inactive', 'This code is not valid.');
  if (coupon.startsAt && now < coupon.startsAt) return no('not_started', 'This code is not active yet.');
  if (coupon.endsAt && now > coupon.endsAt) return no('expired', 'This code has expired.');
  if (coupon.maxRedemptions !== null && coupon.redemptions >= coupon.maxRedemptions) return no('used_up', 'This code has been fully used.');
  if (subtotalPaise < coupon.minSubtotalPaise) return no('minimum', `Spend ${formatINR(coupon.minSubtotalPaise)} or more to use this code.`);
  const raw = coupon.kind === 'percent' ? Math.round((subtotalPaise * coupon.value) / 100) : coupon.value;
  const discountPaise = Math.max(0, Math.min(raw, subtotalPaise));   // a discount can never exceed what is being bought
  const what = coupon.kind === 'percent' ? `${coupon.value}% off` : `${formatINR(coupon.value)} off`;
  return { ok: true, discountPaise, message: `${what} applied${coupon.isDemo ? ' (demo code)' : ''}.`, code };
}
