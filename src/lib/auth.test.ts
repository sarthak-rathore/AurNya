import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hashPassword, verifyPassword, signToken, verifyToken } from './auth';

test('auth: password hashing and verification', async () => {
  const plain = 'SecretPass123!';
  const hash = await hashPassword(plain);
  assert.notEqual(hash, plain);
  assert.ok(hash.includes(':'));

  const ok = await verifyPassword(plain, hash);
  assert.equal(ok, true);

  const bad = await verifyPassword('WrongPassword', hash);
  assert.equal(bad, false);
});

test('auth: JWT token signing and verification', async () => {
  const payload = { sub: 'user-uuid-1234', email: 'test@example.com' };
  const token = await signToken(payload);
  assert.ok(typeof token === 'string');
  assert.equal(token.split('.').length, 3);

  const verified = await verifyToken(token);
  assert.deepEqual(verified, payload);

  const tampered = token.slice(0, -5) + 'abcde';
  const invalid = await verifyToken(tampered);
  assert.equal(invalid, null);

  const junk = await verifyToken('not-a-token');
  assert.equal(junk, null);
});
