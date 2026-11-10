import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOtp, verifyOtp, isDemoMode } from './otp-store';

test('OTP functionality and demo mode', async (t) => {
  await t.test('demo mode detection', () => {
    // In our test environment, DEMO_MODE or !DATABASE_URL triggers demo mode
    assert.equal(typeof isDemoMode(), 'boolean');
  });

  await t.test('generates valid 6-digit code or demo 000000', () => {
    const code = generateOtp('test@example.com', 'user');
    assert.equal(code.length, 6);
    assert.match(code, /^[0-9]{6}$/);
  });

  await t.test('verifies correct OTP code', () => {
    const email = 'verify@example.com';
    const code = generateOtp(email, 'user');
    const ok = verifyOtp(email, 'user', code);
    assert.equal(ok, true);
  });

  await t.test('rejects incorrect OTP code', () => {
    const email = 'wrong@example.com';
    generateOtp(email, 'user');
    const ok = verifyOtp(email, 'user', '999999');
    assert.equal(ok, false);
  });

  await t.test('role isolation: OTP generated for owner does not verify for user', () => {
    const email = 'isolated@example.com';
    const code = generateOtp(email, 'owner');
    const userAttempt = verifyOtp(email, 'user', code);
    assert.equal(userAttempt, false);
    const ownerAttempt = verifyOtp(email, 'owner', code);
    assert.equal(ownerAttempt, true);
  });

  await t.test('OTP is one-time use only (cannot be reused)', () => {
    const email = 'onetime@example.com';
    const code = generateOtp(email, 'admin');
    assert.equal(verifyOtp(email, 'admin', code), true);
    // Second try must fail
    assert.equal(verifyOtp(email, 'admin', code), false);
  });
});
