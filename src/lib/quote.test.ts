import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { products } from '@/data/products';
import { createMemoryCatalog } from './catalog-memory';
import { memoryCouponStore } from './coupon-store';
import { LIMITS, parseQuoteRequest, quote, type QuoteInput } from './quote';

const catalog = createMemoryCatalog(products);
const q = (input: QuoteInput) => quote(catalog, memoryCouponStore, input);

describe('reading an untrusted request', () => {
  const bad = (body: unknown) => { const r = parseQuoteRequest(body); assert.equal(r.ok, false, JSON.stringify(body)); return r.ok ? '' : r.error; };
  test('wrong shapes', () => { for (const b of [null, 5, 'x', [], {}, { lines: 'x' }, { lines: {} }]) bad(b); });
  test('too many lines', () => { bad({ lines: Array.from({ length: LIMITS.maxLines + 1 }, () => ({ productId: 1, qty: 1 })) }); });
  test('product id must be a positive whole number', () => { for (const productId of [0, -1, 1.5, '1', null, NaN, Infinity, 2 ** 60]) bad({ lines: [{ productId, qty: 1 }] }); });
  test('quantity must be a whole number from 1 to the limit', () => { for (const qty of [0, -1, 1.5, '2', null, LIMITS.maxQtyPerLine + 1, NaN]) bad({ lines: [{ productId: 1, qty }] }); });
  test('size must be short, non-empty text', () => { for (const variant of ['', 'x'.repeat(21), 7, {}, []]) bad({ lines: [{ productId: 1, qty: 1, variant }] }); });
  test('coupon must be short text', () => { for (const coupon of [5, {}, 'x'.repeat(41)]) bad({ lines: [], coupon }); });
  test('expected price must be a whole number', () => { bad({ lines: [{ productId: 1, qty: 1, expectedUnitPricePaise: 1.5 }] }); });
  test('valid requests are accepted, with missing optional parts filled in', () => {
    const r = parseQuoteRequest({ lines: [{ productId: 5, variant: '7', qty: 2, expectedUnitPricePaise: 100 }, { productId: 1, qty: 1 }] });
    assert.ok(r.ok); if (r.ok) { assert.equal(r.value.coupon, ''); assert.equal(r.value.lines[1].variant, null); assert.equal(r.value.lines.length, 2); }
  });
  test('extra or dangerous fields are ignored, not passed through', () => {
    const r = parseQuoteRequest({ lines: [{ productId: 1, qty: 1, pricePaise: 1, __proto__: { x: 1 }, constructor: 'x' }], pricePaise: 1, admin: true });
    assert.ok(r.ok); if (r.ok) { assert.deepEqual(Object.keys(r.value.lines[0]).sort(), ['productId', 'qty', 'variant']); assert.deepEqual(Object.keys(r.value).sort(), ['coupon', 'lines']); }
  });
});

describe('what the server decides', () => {
  test('prices come from the catalogue, never from the request', async () => {
    const r = await q({ lines: [{ productId: 1, variant: null, qty: 2, expectedUnitPricePaise: 1 }], coupon: '' });
    assert.equal(r.subtotalPaise, 159800); assert.equal(r.lines[0].unitPricePaise, 79900); assert.deepEqual(r.lines[0].issues, ['price_changed']);
  });
  test('quantity is limited by the stock of that size and by the per-line maximum', async () => {
    const a = await q({ lines: [{ productId: 5, variant: '9', qty: 5 }], coupon: '' });   // only 1 left in size 9
    assert.equal(a.lines[0].qty, 1); assert.deepEqual(a.lines[0].issues, ['qty_reduced']); assert.equal(a.subtotalPaise, 69900);
    const b = await q({ lines: [{ productId: 6, variant: null, qty: 500 }], coupon: '' });   // plenty in stock, limit is 10
    assert.equal(b.lines[0].qty, 10);
  });
  test('sold-out sizes and products are left out of the total', async () => {
    const r = await q({ lines: [{ productId: 9, variant: '7', qty: 1 }, { productId: 1, variant: null, qty: 1 }], coupon: '' });
    assert.equal(r.lines[0].counted, false); assert.deepEqual(r.lines[0].issues, ['out_of_stock']); assert.equal(r.subtotalPaise, 79900); assert.equal(r.hasIssues, true);
  });
  test('missing, unknown or wrongly-sized products are left out with a reason', async () => {
    const r = await q({ lines: [{ productId: 9999, variant: null, qty: 1 }, { productId: 4, variant: null, qty: 1 }, { productId: 4, variant: '12', qty: 1 }, { productId: 1, variant: '7', qty: 1 }], coupon: '' });
    assert.deepEqual(r.lines.map((l) => l.issues[0]), ['unavailable', 'variant_required', 'unknown_variant', 'unknown_variant']);
    assert.equal(r.subtotalPaise, 0); assert.ok(r.lines.every((l) => !l.counted && l.lineTotalPaise === 0));
  });
  test('the same item listed twice is counted once with the quantities added up', async () => {
    const r = await q({ lines: [{ productId: 6, variant: null, qty: 2 }, { productId: 6, variant: null, qty: 3 }], coupon: '' });
    assert.equal(r.lines.length, 1); assert.equal(r.lines[0].qty, 5);
  });
  test('different sizes of the same ring are separate lines', async () => {
    const r = await q({ lines: [{ productId: 4, variant: '6', qty: 1 }, { productId: 4, variant: '7', qty: 1 }], coupon: '' });
    assert.equal(r.lines.length, 2); assert.equal(r.subtotalPaise, 59900 * 2);
  });
  test('coupon: applied to the verified subtotal; unknown code and empty bag give clear messages', async () => {
    const ok = await q({ lines: [{ productId: 5, variant: '7', qty: 2 }], coupon: ' aurdemo10 ' });
    assert.equal(ok.coupon.ok, true); assert.equal(ok.discountPaise, 13980); assert.equal(ok.totalPaise, 139800 - 13980); assert.equal(ok.coupon.code, 'AURDEMO10');
    const bad = await q({ lines: [{ productId: 1, variant: null, qty: 1 }], coupon: 'NOPE' });
    assert.equal(bad.coupon.ok, false); assert.equal(bad.discountPaise, 0); assert.equal(bad.coupon.message, 'This code is not valid.');
    const empty = await q({ lines: [], coupon: 'AURDEMO10' });
    assert.equal(empty.coupon.ok, false); assert.equal(empty.totalPaise, 0);
  });
  test('a coupon is judged on what is actually counted, not on what was asked for', async () => {
    const r = await q({ lines: [{ productId: 9, variant: '7', qty: 5 }], coupon: 'AURDEMO10' });   // sold out: subtotal 0
    assert.equal(r.subtotalPaise, 0); assert.equal(r.discountPaise, 0); assert.equal(r.totalPaise, 0);
  });
  test('shipping and tax are explicitly not calculated yet', async () => {
    const r = await q({ lines: [{ productId: 1, variant: null, qty: 1 }], coupon: '' });
    assert.equal(r.shippingPaise, null); assert.equal(r.taxPaise, null); assert.equal(r.verified, true);
  });
  test('totals are always whole, non-negative paise', async () => {
    for (const coupon of ['', 'AURDEMO10']) for (const productId of [1, 2, 3, 6, 8]) {
      const r = await q({ lines: [{ productId, variant: null, qty: 3 }], coupon });
      for (const n of [r.subtotalPaise, r.discountPaise, r.totalPaise]) { assert.ok(Number.isInteger(n) && n >= 0); }
      assert.equal(r.totalPaise, r.subtotalPaise - r.discountPaise);
    }
  });
});
