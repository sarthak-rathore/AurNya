import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';
import { resetRateLimits } from '@/lib/rate-limit';
import { POST } from './route';

const post = (body: unknown, headers: Record<string, string> = {}) => POST(new Request('http://localhost/api/cart/quote', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) }));
beforeEach(() => resetRateLimits());

describe('POST /api/cart/quote', () => {
  test('answers with server prices, never caching the answer', async () => {
    const r = await post({ lines: [{ productId: 1, variant: null, qty: 2, expectedUnitPricePaise: 1 }], coupon: 'aurdemo10' });
    assert.equal(r.status, 200); assert.equal(r.headers.get('cache-control'), 'no-store');
    const q = await r.json(); assert.equal(q.verified, true); assert.equal(q.subtotalPaise, 159800); assert.equal(q.discountPaise, 15980); assert.equal(q.totalPaise, 143820);
  });
  test('rejects things that are not a bag, with a 400 and a helpful message', async () => {
    for (const body of ['not json', '[]', '{"lines":"x"}', { lines: [{ productId: 'x', qty: 1 }] }, { lines: [{ productId: 1, qty: 0 }] }]) {
      const r = await post(body); assert.equal(r.status, 400, JSON.stringify(body)); assert.equal(typeof (await r.json()).error, 'string');
    }
  });
  test('rejects oversized requests', async () => {
    assert.equal((await post({ lines: [], coupon: '', pad: 'x'.repeat(20_000) })).status, 413);
    assert.equal((await post('{}', { 'content-length': '999999' })).status, 413);
  });
  test('slows down a visitor who asks far too often, and says how long to wait', async () => {
    let last = 200; let retry = '';
    for (let i = 0; i < 70; i++) { const r = await post({ lines: [], coupon: '' }, { 'x-forwarded-for': '203.0.113.9' }); last = r.status; retry = r.headers.get('retry-after') ?? retry; if (last === 429) break; }
    assert.equal(last, 429); assert.ok(Number(retry) >= 1);
    assert.equal((await post({ lines: [], coupon: '' }, { 'x-forwarded-for': '203.0.113.10' })).status, 200);   // someone else is unaffected
  });
  test('errors never reveal internals', async () => {
    const r = await post({ lines: [{ productId: 1, qty: 1 }] }); const text = await r.text();
    assert.ok(!/postgres|drizzle|stack|at \w+\./i.test(text));
  });
});
