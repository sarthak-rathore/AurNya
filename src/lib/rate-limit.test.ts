import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { clientKey, rateLimit, resetRateLimits } from './rate-limit';

beforeEach(() => resetRateLimits());

test('allows up to the limit, then refuses with a wait time', () => {
  for (let i = 0; i < 3; i++) assert.equal(rateLimit('a', 3, 60_000, 1000 + i).ok, true);
  const r = rateLimit('a', 3, 60_000, 1003);
  assert.equal(r.ok, false); assert.ok(r.retryAfterSec >= 1 && r.retryAfterSec <= 60);
});
test('refused requests do not extend the wait', () => {
  for (let i = 0; i < 3; i++) rateLimit('a', 3, 1000, 0);
  for (let i = 0; i < 50; i++) rateLimit('a', 3, 1000, 500);
  assert.equal(rateLimit('a', 3, 1000, 1001).ok, true);
});
test('the window slides: old requests stop counting', () => {
  for (let i = 0; i < 3; i++) rateLimit('a', 3, 1000, 0);
  assert.equal(rateLimit('a', 3, 1000, 999).ok, false);
  assert.equal(rateLimit('a', 3, 1000, 1000).ok, true);
});
test('visitors are counted separately', () => {
  for (let i = 0; i < 3; i++) rateLimit('a', 3, 1000, 0);
  assert.equal(rateLimit('a', 3, 1000, 1).ok, false); assert.equal(rateLimit('b', 3, 1000, 1).ok, true);
});
test('the visitor is identified from the forwarding header, falling back safely', () => {
  assert.equal(clientKey(new Request('http://x', { headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' } })), '1.2.3.4');
  assert.equal(clientKey(new Request('http://x', { headers: { 'x-real-ip': '5.6.7.8' } })), '5.6.7.8');
  assert.equal(clientKey(new Request('http://x')), 'unknown');
});
