import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateShipping, estimatedDeliveryRange, FREE_SHIPPING_THRESHOLD_PAISE, FLAT_RATE_PAISE, COD_SURCHARGE_PAISE } from './shipping';
import { verifyPassword } from './auth';
import { getUserByEmail } from '@/db/accounts';

test('shipping: free shipping threshold', () => {
  // Below threshold
  const below = calculateShipping(50000, 'razorpay'); // ₹500
  assert.equal(below.isFreeShipping, false);
  assert.equal(below.shippingPaise, FLAT_RATE_PAISE);

  // Exact threshold
  const exact = calculateShipping(FREE_SHIPPING_THRESHOLD_PAISE, 'razorpay'); // ₹999
  assert.equal(exact.isFreeShipping, true);
  assert.equal(exact.shippingPaise, 0);

  // Above threshold
  const above = calculateShipping(150000, 'razorpay'); // ₹1,500
  assert.equal(above.isFreeShipping, true);
  assert.equal(above.shippingPaise, 0);
});

test('shipping: COD surcharge applied correctly', () => {
  // Below threshold + COD
  const belowCod = calculateShipping(50000, 'cod');
  assert.equal(belowCod.shippingPaise, FLAT_RATE_PAISE + COD_SURCHARGE_PAISE);
  assert.equal(belowCod.codSurchargePaise, COD_SURCHARGE_PAISE);

  // Above threshold + COD
  const aboveCod = calculateShipping(120000, 'cod');
  assert.equal(aboveCod.isFreeShipping, true);
  assert.equal(aboveCod.shippingPaise, COD_SURCHARGE_PAISE);
});

test('shipping: estimated delivery is 3 to 7 business days', () => {
  const range = estimatedDeliveryRange(new Date('2026-11-02T10:00:00Z')); // Monday
  assert.ok(range.from);
  assert.ok(range.to);
  assert.notEqual(range.from, range.to);
});

test('demo user: exists and authenticates with AurNya@123', async () => {
  const user = await getUserByEmail('demo@aurnya.com');
  assert.ok(user, 'Demo user should be present in memory/db');
  assert.equal(user.firstName, 'Priya');
  assert.equal(user.email, 'demo@aurnya.com');

  const ok = await verifyPassword('AurNya@123', user.passwordHash);
  assert.equal(ok, true, 'AurNya@123 must verify against demo user passwordHash');

  const bad = await verifyPassword('WrongPassword', user.passwordHash);
  assert.equal(bad, false, 'Wrong password must fail');
});
