import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyCoupon, subtotal } from './cart';
const line = (p: number, q: number) => ({ productId: 1, slug: 's', name: 'n', category: 'Rings' as const, pricePaise: p, variant: null, qty: q });
test('subtotal sums price x quantity', () => assert.equal(subtotal([line(100, 3), line(50, 2)]), 400));
test('valid coupon gives discount', () => assert.deepEqual(applyCoupon('aurdemo10', 100000), { ok: true, discount: 10000, message: '10% off applied (demo code).' }));
test('invalid coupon is rejected', () => { const r = applyCoupon('NOPE', 1000); assert.equal(r.ok, false); assert.equal(r.discount, 0); });
test('empty coupon is a no-op', () => assert.equal(applyCoupon('  ', 1000).message, ''));
