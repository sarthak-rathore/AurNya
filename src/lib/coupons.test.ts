import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyCoupon } from './cart';
import { DEMO_COUPON, evaluateCoupon, normalizeCode, type Coupon } from './coupons';

const c = (over: Partial<Coupon> = {}): Coupon => ({ ...DEMO_COUPON, isDemo: false, ...over });
const now = new Date('2026-06-01T00:00:00Z');

test('codes are matched without caring about case or spaces', () => { assert.equal(normalizeCode('  aurdemo10 '), 'AURDEMO10'); });
test('percent discount is rounded to the nearest paisa-whole amount', () => {
  assert.equal(evaluateCoupon(c(), 'X', 69900, now).discountPaise, 6990);
  assert.equal(evaluateCoupon(c({ value: 15 }), 'X', 99999, now).discountPaise, 15000);   // 14999.85 -> 15000
  assert.equal(evaluateCoupon(c({ value: 33 }), 'X', 1, now).discountPaise, 0);
});
test('fixed discount is capped at the subtotal', () => {
  assert.equal(evaluateCoupon(c({ kind: 'fixed', value: 5000 }), 'X', 20000, now).discountPaise, 5000);
  assert.equal(evaluateCoupon(c({ kind: 'fixed', value: 5000 }), 'X', 3000, now).discountPaise, 3000);
});
test('every refusal has a reason and a plain message, and no discount', () => {
  const cases: [Coupon | null, string, number, string][] = [
    [null, 'NOPE', 1000, 'not_found'], [c({ isActive: false }), 'X', 1000, 'inactive'], [c({ startsAt: new Date('2027-01-01') }), 'X', 1000, 'not_started'],
    [c({ endsAt: new Date('2026-01-01') }), 'X', 1000, 'expired'], [c({ maxRedemptions: 3, redemptions: 3 }), 'X', 1000, 'used_up'], [c({ minSubtotalPaise: 5000 }), 'X', 1000, 'minimum'], [c(), '   ', 1000, 'empty'],
  ];
  for (const [coupon, code, sub, problem] of cases) { const r = evaluateCoupon(coupon, code, sub, now); assert.equal(r.ok, false, problem); assert.equal(r.problem, problem); assert.equal(r.discountPaise, 0); }
});
test('an inactive coupon looks the same as a missing one (nothing leaks about which codes exist)', () => {
  assert.equal(evaluateCoupon(c({ isActive: false }), 'X', 1, now).message, evaluateCoupon(null, 'X', 1, now).message);
});
test('boundaries are inclusive: exactly at the start, the end and the minimum', () => {
  assert.equal(evaluateCoupon(c({ startsAt: now }), 'X', 100, now).ok, true);
  assert.equal(evaluateCoupon(c({ endsAt: now }), 'X', 100, now).ok, true);
  assert.equal(evaluateCoupon(c({ minSubtotalPaise: 100 }), 'X', 100, now).ok, true);
  assert.equal(evaluateCoupon(c({ maxRedemptions: 3, redemptions: 2 }), 'X', 100, now).ok, true);
});
test('the browser estimate (applyCoupon) follows the same rules for the sample coupon', () => {
  assert.deepEqual(applyCoupon('aurdemo10', 69900), { ok: true, discount: 6990, message: '10% off applied (demo code).' });
  assert.deepEqual(applyCoupon('nope', 100), { ok: false, discount: 0, message: 'This code is not valid.' });
  assert.deepEqual(applyCoupon('', 100), { ok: false, discount: 0, message: '' });
});
