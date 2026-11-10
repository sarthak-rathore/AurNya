import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { eq } from 'drizzle-orm';
import { couponInputSchema, productInputSchema, type ProductInput } from '@/lib/admin-schemas';
import { createCoupon, deleteCoupon, listAllCoupons, setCouponActive, updateCoupon } from './admin-coupons';
import { AdminError } from './admin-errors';
import { exportOrders, getOrderDetail, listOrders, saveAdminNote, transitionOrder, updateTracking } from './admin-orders';
import { adjustStock, createProduct, deleteProduct, getProduct, listProducts, setProductStatus, stockLines, updateProduct } from './admin-products';
import { dashboardStats, startOfIstDay } from './admin-stats';
import { recentActivity } from './admin-audit';
import type { Db } from './client';
import { countCouponUse, OutOfStockError, releaseExpiredOrders, reserveStock } from './inventory';
import { placeOrder, CouponUsedUpError, type PlaceOrderInput } from './place-order';
import { coupons, orderEvents, orders, productVariants, products } from './schema';
import { seedDemo } from './seed';
import { backends, openTestDb, type Backend } from './test-db';

const input = (over: Record<string, unknown> = {}): ProductInput => productInputSchema.parse({
  name: 'Moon Ring', sku: 'MOON-1', category: 'Rings', price: '899', short: 'A ring.', stock: 7, status: 'active', ...over,
});
const stockOf = async (db: Db, slug: string) => (await db.select().from(products).where(eq(products.slug, slug)))[0].stock;
const variantStock = async (db: Db, productId: number, value: string) => (await db.select().from(productVariants).where(eq(productVariants.productId, productId))).find((v) => v.optionValue === value)!.stock;
const addr = { recipientName: 'Asha', line1: '1 Road', line2: null, city: 'Pune', state: 'Maharashtra', pincode: '411001', country: 'India', phone: null };
const order = (over: Partial<PlaceOrderInput> = {}): PlaceOrderInput => ({
  email: 'a@b.co', phone: null, shippingAddress: addr, paymentMethod: 'razorpay', couponCode: null,
  lines: [{ productId: 6, variant: null, name: 'Everyday Hoops', unitPricePaise: 49900, qty: 2, lineTotalPaise: 99800 }],
  subtotalPaise: 99800, discountPaise: 0, shippingPaise: 0, taxPaise: 0, totalPaise: 99800, idempotencyKey: null, userId: null, ...over,
});

for (const kind of backends()) {
  describe(`admin data layer (${kind})`, () => {
    let db: Db; let close: () => Promise<void>;
    before(async () => { ({ db, close } = await openTestDb(kind as Backend)); await seedDemo(db); });
    after(() => close());

    describe('products', () => {
      test('create, read back, list and filter', async () => {
        const made = await createProduct(db, input({ collections: ['gifts'], tags: ['new'], images: [{ src: '/images/a.png', alt: 'one' }, { src: '/images/b.png', alt: '' }] }), 'tester');
        assert.equal(made.slug, 'moon-ring');
        const p = (await getProduct(db, made.id))!;
        assert.equal(p.pricePaise, 89900); assert.equal(p.stock, 7); assert.deepEqual(p.collections, ['gifts']); assert.deepEqual(p.tags, ['new']);
        assert.equal(p.images.length, 2); assert.equal((await db.select().from(products).where(eq(products.id, made.id)))[0].image, '/images/a.png');
        assert.equal((await listProducts(db, { q: 'moon' })).total, 1);
        assert.equal((await listProducts(db, { q: 'MOON-1' })).total, 1);
        assert.equal((await listProducts(db, { status: 'draft' })).rows.some((r) => r.id === made.id), false);
        assert.ok((await listProducts(db, { category: 'Rings' })).total >= 1);
      });
      test('a duplicate slug or SKU gives a plain message', async () => {
        await assert.rejects(() => createProduct(db, input({ sku: 'NEW-SKU' }), 't'), (e: unknown) => e instanceof AdminError && /web address/i.test(e.message));
        await assert.rejects(() => createProduct(db, input({ name: 'Other', sku: 'MOON-1' }), 't'), (e: unknown) => e instanceof AdminError && /SKU/.test(e.message));
      });
      test('unknown collection is refused and nothing is saved', async () => {
        await assert.rejects(() => createProduct(db, input({ name: 'Ghost', sku: 'GHOST-1', collections: ['nope'] }), 't'), (e: unknown) => e instanceof AdminError && /collection/i.test(e.message));
        assert.equal((await db.select().from(products).where(eq(products.slug, 'ghost'))).length, 0);
      });
      test('sizes: created with stock, and editing the form never overwrites existing stock', async () => {
        const made = await createProduct(db, input({ name: 'Sized Ring', sku: 'SZ-1', variants: { label: 'Size', options: [{ value: '6', stock: 3 }, { value: '7', stock: 4 }] } }), 't');
        assert.equal((await getProduct(db, made.id))!.stock, 0);
        await db.update(productVariants).set({ stock: 1 }).where(eq(productVariants.sku, 'SZ-1-6'));   // a sale happened
        await updateProduct(db, made.id, input({ name: 'Sized Ring', sku: 'SZ-1', price: '950', variants: { label: 'Size', options: [{ value: '6', stock: 99 }, { value: '8', stock: 5 }] } }), 't');
        assert.equal(await variantStock(db, made.id, '8'), 5, 'new size gets the typed stock');
        const p = (await getProduct(db, made.id))!;
        assert.deepEqual(p.variants!.options.map((o) => o.value), ['6', '8'], 'size 7 was removed');
        assert.equal(await variantStock(db, made.id, '6'), 1, 'existing size keeps its real stock');
        assert.equal(p.pricePaise, 95000);
      });
      test('removing all sizes uses the single stock number; adding sizes zeroes the product stock', async () => {
        const made = await createProduct(db, input({ name: 'Plain', sku: 'PL-1', stock: 9 }), 't');
        await updateProduct(db, made.id, input({ name: 'Plain', sku: 'PL-1', stock: 9, variants: { label: 'Size', options: [{ value: 'S', stock: 2 }] } }), 't');
        assert.equal((await getProduct(db, made.id))!.stock, 0);
        await updateProduct(db, made.id, input({ name: 'Plain', sku: 'PL-1', stock: 11 }), 't');
        const p = (await getProduct(db, made.id))!; assert.equal(p.variants, null); assert.equal(p.stock, 11);
      });
      test('changing the slug reports the old one so the old page can be refreshed', async () => {
        const made = await createProduct(db, input({ name: 'Rename Me', sku: 'RN-1' }), 't');
        const r = await updateProduct(db, made.id, input({ name: 'Rename Me', sku: 'RN-1', slug: 'renamed-thing' }), 't');
        assert.equal(r.slug, 'renamed-thing'); assert.equal(r.previousSlug, 'rename-me');
      });
      test('status changes hide a product from the shop; delete removes it', async () => {
        const made = await createProduct(db, input({ name: 'Hide Me', sku: 'HM-1' }), 't');
        await setProductStatus(db, made.id, 'archived', 't');
        assert.equal((await getProduct(db, made.id))!.status, 'archived');
        await deleteProduct(db, made.id, 't');
        assert.equal(await getProduct(db, made.id), null);
        await assert.rejects(() => deleteProduct(db, made.id, 't'), AdminError);
      });
    });

    describe('inventory', () => {
      test('set and add; never below zero; sizes must be changed per size', async () => {
        const [hoops] = await db.select().from(products).where(eq(products.slug, 'everyday-hoops'));
        const before = hoops.stock;
        assert.equal((await adjustStock(db, { productId: hoops.id, variantId: null, mode: 'add', value: 5 }, 't')).stock, before + 5);
        assert.equal((await adjustStock(db, { productId: hoops.id, variantId: null, mode: 'set', value: 3 }, 't')).stock, 3);
        await assert.rejects(() => adjustStock(db, { productId: hoops.id, variantId: null, mode: 'add', value: -4 }, 't'), (e: unknown) => e instanceof AdminError && e.status === 409);
        assert.equal(await stockOf(db, 'everyday-hoops'), 3, 'a refused change leaves stock alone');
        const [ring] = await db.select().from(products).where(eq(products.slug, 'solitaire-ring'));
        await assert.rejects(() => adjustStock(db, { productId: ring.id, variantId: null, mode: 'set', value: 4 }, 't'), /sizes/);
        const v = (await db.select().from(productVariants).where(eq(productVariants.productId, ring.id)))[0];
        assert.equal((await adjustStock(db, { productId: ring.id, variantId: v.id, mode: 'set', value: 12 }, 't')).stock, 12);
        await assert.rejects(() => adjustStock(db, { productId: hoops.id, variantId: v.id, mode: 'set', value: 1 }, 't'), AdminError);   // a size of another product
      });
      test('stock lines list sizes separately and filter low / out', async () => {
        const out = await stockLines(db, { filter: 'out' }); assert.ok(out.every((l) => l.stock === 0));
        assert.ok(out.some((l) => l.name === 'Twist Band Ring' && l.option === 'Size 6'));
        const low = await stockLines(db, { filter: 'low' }); assert.ok(low.every((l) => l.stock > 0 && l.stock <= 5));
        assert.ok((await stockLines(db, { q: 'solitaire' })).length === 4);
      });
    });

    describe('checkout holds stock and coupon uses', () => {
      before(async () => { await db.update(products).set({ stock: 500 }).where(eq(products.id, 6)); });
      test('placing an order takes stock; the line records the real SKU and size', async () => {
        const hoopsBefore = await stockOf(db, 'everyday-hoops');
        const sizedBefore = await variantStock(db, 5, '8');
        const r = await placeOrder(db, order({ lines: [
          { productId: 6, variant: null, name: 'Everyday Hoops', unitPricePaise: 49900, qty: 2, lineTotalPaise: 99800 },
          { productId: 5, variant: '8', name: 'Solitaire Ring', unitPricePaise: 69900, qty: 1, lineTotalPaise: 69900 }], subtotalPaise: 169700, totalPaise: 169700 }));
        assert.equal(await stockOf(db, 'everyday-hoops'), hoopsBefore - 2); assert.equal(await variantStock(db, 5, '8'), sizedBefore - 1);
        const d = (await getOrderDetail(db, r.id))!;
        assert.equal(d.order.stockHeld, true); assert.equal(d.items.find((i) => i.productId === 5)!.skuSnapshot, 'DEMO-005-8'); assert.equal(d.items.find((i) => i.productId === 5)!.optionLabelSnapshot, 'Size');
        assert.ok(d.items.find((i) => i.productId === 5)!.variantId);
      });
      test('not enough stock refuses the whole order and takes nothing', async () => {
        const hoops = await stockOf(db, 'everyday-hoops'); const n = (await listOrders(db)).total;
        await assert.rejects(() => placeOrder(db, order({ lines: [
          { productId: 6, variant: null, name: 'Everyday Hoops', unitPricePaise: 49900, qty: 1, lineTotalPaise: 49900 },
          { productId: 7, variant: null, name: 'Charm Link Bracelet', unitPricePaise: 89900, qty: 99, lineTotalPaise: 89900 * 99 }], subtotalPaise: 49900 + 89900 * 99, totalPaise: 49900 + 89900 * 99 })), OutOfStockError);
        assert.equal(await stockOf(db, 'everyday-hoops'), hoops, 'the first line was rolled back too'); assert.equal((await listOrders(db)).total, n);
      });
      test('the last piece can only be bought once', async () => {
        await adjustStock(db, { productId: 8, variantId: null, mode: 'set', value: 1 }, 't');
        const one = () => placeOrder(db, order({ lines: [{ productId: 8, variant: null, name: 'Star Choker', unitPricePaise: 74900, qty: 1, lineTotalPaise: 74900 }], subtotalPaise: 74900, totalPaise: 74900 }));
        const results = await Promise.allSettled([one(), one()]);
        assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1); assert.equal(await stockOf(db, 'star-choker'), 0);
      });
      test('a draft product cannot be bought even by a stale bag', async () => {
        await setProductStatus(db, 10, 'draft', 't');
        await assert.rejects(() => reserveStock(db, [{ productId: 10, variant: null, qty: 1 }]), OutOfStockError);
        await setProductStatus(db, 10, 'active', 't');
      });
      test('same idempotency key gives back the same order, and takes stock only once', async () => {
        const before = await stockOf(db, 'charm-link-bracelet');
        const o = () => order({ idempotencyKey: 'key-1', lines: [{ productId: 7, variant: null, name: 'Charm', unitPricePaise: 89900, qty: 1, lineTotalPaise: 89900 }], subtotalPaise: 89900, totalPaise: 89900 });
        const a = await placeOrder(db, o()); const b = await placeOrder(db, o()).catch((e) => e);
        assert.equal(await stockOf(db, 'charm-link-bracelet'), before - 1);
        if (!(b instanceof Error)) assert.equal(b.id, a.id);
      });
      test('coupon uses are counted, capped, and a used-up coupon refuses the order', async () => {
        await createCoupon(db, couponInputSchema.parse({ code: 'ONCE', kind: 'percent', value: '10', maxRedemptions: 1 }), 't');
        const withCoupon = () => order({ couponCode: 'ONCE', discountPaise: 9980, totalPaise: 89820 });
        const a = await placeOrder(db, withCoupon()); assert.equal((await getOrderDetail(db, a.id))!.order.couponCounted, true);
        const hoops = await stockOf(db, 'everyday-hoops');
        await assert.rejects(() => placeOrder(db, withCoupon()), CouponUsedUpError);
        assert.equal(await stockOf(db, 'everyday-hoops'), hoops, 'stock of the refused order was returned');
        assert.equal((await db.select().from(coupons).where(eq(coupons.code, 'ONCE')))[0].redemptions, 1);
        assert.equal(await countCouponUse(db, 'ONCE'), false);
      });
      test('a user id that does not exist becomes a guest order instead of failing', async () => {
        const r = await placeOrder(db, order({ userId: '00000000-0000-0000-0000-000000000001' }));
        assert.equal((await getOrderDetail(db, r.id))!.order.userId, null);
      });
    });

    describe('order status changes', () => {
      before(async () => { await db.update(products).set({ stock: 500 }).where(eq(products.id, 6)); });
      const place = async (over: Partial<PlaceOrderInput> = {}) => (await placeOrder(db, order(over))).id;
      test('the normal online journey, with a timeline entry for every step', async () => {
        const id = await place();
        await transitionOrder(db, id, { action: 'status', to: 'paid', note: null, courier: null, trackingNumber: null, trackingUrl: null, paymentId: 'pay_123', restock: false, refundOnline: false }, 'o');
        await transitionOrder(db, id, { action: 'status', to: 'packed', note: null, courier: null, trackingNumber: null, trackingUrl: null, paymentId: null, restock: false, refundOnline: false }, 'o');
        const r = await transitionOrder(db, id, { action: 'status', to: 'shipped', note: null, courier: 'Delhivery', trackingNumber: 'AWB1', trackingUrl: 'https://t.example/AWB1', paymentId: null, restock: false, refundOnline: false }, 'o');
        assert.equal(r.courier, 'Delhivery');
        await transitionOrder(db, id, { action: 'status', to: 'delivered', note: null, courier: null, trackingNumber: null, trackingUrl: null, paymentId: null, restock: false, refundOnline: false }, 'o');
        const d = (await getOrderDetail(db, id))!;
        assert.equal(d.order.status, 'delivered'); assert.equal(d.order.paymentId, 'pay_123'); assert.equal(d.order.trackingNumber, 'AWB1');
        assert.deepEqual(d.events.map((e) => e.status), ['pending_payment', 'paid', 'packed', 'shipped', 'delivered']);
        assert.match(d.events[3].note!, /Delhivery.*AWB1/);
      });
      const go = (id: string, to: 'paid' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded', extra: Record<string, unknown> = {}) =>
        transitionOrder(db, id, { action: 'status', to, note: null, courier: null, trackingNumber: null, trackingUrl: null, paymentId: null, restock: false, refundOnline: false, ...extra }, 'o');
      test('impossible moves are refused', async () => {
        const id = await place();
        for (const to of ['packed', 'shipped', 'delivered', 'refunded'] as const) await assert.rejects(() => go(id, to), (e: unknown) => e instanceof AdminError && e.status === 409, to);
        await go(id, 'paid');
        await assert.rejects(() => go(id, 'shipped'), AdminError);   // must be packed first
        await go(id, 'packed');
        await assert.rejects(() => go(id, 'shipped'), (e: unknown) => e instanceof AdminError && /courier/i.test(e.message));
        await go(id, 'shipped', { courier: 'DTDC' });
        await assert.rejects(() => go(id, 'cancelled'), AdminError);   // too late to cancel once shipped
      });
      test('cash on delivery orders can be packed straight away', async () => {
        const id = await place({ paymentMethod: 'cod' });
        await go(id, 'packed'); await go(id, 'shipped', { courier: 'India Post' }); await go(id, 'delivered');
        assert.match((await getOrderDetail(db, id))!.events.at(-1)!.note!, /Cash collected/);
        const online = await place();
        await assert.rejects(() => go(online, 'packed'), AdminError);   // an online order must be paid first
      });
      test('cancelling gives stock and the coupon use back exactly once', async () => {
        await createCoupon(db, couponInputSchema.parse({ code: 'BACK', kind: 'fixed', value: '50', maxRedemptions: 5 }), 't');
        const before = await stockOf(db, 'everyday-hoops');
        const id = await place({ couponCode: 'BACK', discountPaise: 5000, totalPaise: 94800 });
        assert.equal(await stockOf(db, 'everyday-hoops'), before - 2);
        await go(id, 'cancelled');
        assert.equal(await stockOf(db, 'everyday-hoops'), before);
        assert.equal((await db.select().from(coupons).where(eq(coupons.code, 'BACK')))[0].redemptions, 0);
        const d = (await getOrderDetail(db, id))!; assert.equal(d.order.stockHeld, false); assert.equal(d.order.couponCounted, false);
        await assert.rejects(() => go(id, 'cancelled'), AdminError);   // final: cannot be cancelled again, so no second restock
        assert.equal(await stockOf(db, 'everyday-hoops'), before);
      });
      test('an old order from before stock was tracked is not "restocked" on cancel', async () => {
        const before = await stockOf(db, 'everyday-hoops');
        const id = await place(); await db.update(orders).set({ stockHeld: false }).where(eq(orders.id, id));
        await go(id, 'cancelled'); assert.equal(await stockOf(db, 'everyday-hoops'), before - 2);
      });
      test('refund restocks only when asked', async () => {
        const before = await stockOf(db, 'everyday-hoops');
        const a = await place(); await go(a, 'paid'); await go(a, 'refunded', { restock: false });
        assert.equal(await stockOf(db, 'everyday-hoops'), before - 2);
        const b = await place(); await go(b, 'paid'); await go(b, 'refunded', { restock: true });
        assert.equal(await stockOf(db, 'everyday-hoops'), before - 2, 'b took 2 and gave 2 back');
      });
      test('tracking can be corrected after shipping; the private note is saved', async () => {
        const id = await place(); await go(id, 'paid'); await go(id, 'packed');
        await assert.rejects(() => updateTracking(db, id, { action: 'tracking', courier: 'X', trackingNumber: null, trackingUrl: null }, 'o'), AdminError);
        await go(id, 'shipped', { courier: 'DTDC', trackingNumber: 'OLD' });
        await updateTracking(db, id, { action: 'tracking', courier: 'DTDC', trackingNumber: 'NEW', trackingUrl: null }, 'o');
        assert.equal((await getOrderDetail(db, id))!.order.trackingNumber, 'NEW');
        await saveAdminNote(db, id, 'call before delivery', 'o'); assert.equal((await getOrderDetail(db, id))!.order.adminNote, 'call before delivery');
        await saveAdminNote(db, id, '', 'o'); assert.equal((await getOrderDetail(db, id))!.order.adminNote, null);
      });
      test('unknown order ids are handled', async () => {
        assert.equal(await getOrderDetail(db, 'not-a-uuid'), null); assert.equal(await getOrderDetail(db, '00000000-0000-4000-8000-000000000000'), null);
        await assert.rejects(() => go('00000000-0000-4000-8000-000000000000', 'paid'), (e: unknown) => e instanceof AdminError && e.status === 404);
      });
    });

    describe('unpaid orders expire', () => {
      before(async () => { await db.update(products).set({ stock: 500 }).where(eq(products.id, 6)); });
      test('stale online orders are cancelled and release stock; cash orders and fresh orders are left alone', async () => {
        const before = await stockOf(db, 'everyday-hoops');
        const stale = (await placeOrder(db, order())).id; const cod = (await placeOrder(db, order({ paymentMethod: 'cod' }))).id; const fresh = (await placeOrder(db, order())).id;
        assert.equal(await stockOf(db, 'everyday-hoops'), before - 6);
        const old = new Date(Date.now() - 3 * 3600_000);
        await db.update(orders).set({ createdAt: old }).where(eq(orders.id, stale)); await db.update(orders).set({ createdAt: old }).where(eq(orders.id, cod));
        assert.equal(await releaseExpiredOrders(db), 1);
        assert.equal(await stockOf(db, 'everyday-hoops'), before - 4);
        assert.equal((await getOrderDetail(db, stale))!.order.status, 'cancelled'); assert.equal((await getOrderDetail(db, cod))!.order.status, 'pending_payment'); assert.equal((await getOrderDetail(db, fresh))!.order.status, 'pending_payment');
        assert.match((await getOrderDetail(db, stale))!.events.at(-1)!.note!, /Not paid in time/);
        assert.equal(await releaseExpiredOrders(db), 0, 'running it again changes nothing');
      });
      test('an order paid in the meantime is not expired', async () => {
        const id = (await placeOrder(db, order())).id; await db.update(orders).set({ createdAt: new Date(Date.now() - 3 * 3600_000), status: 'paid' }).where(eq(orders.id, id));
        await releaseExpiredOrders(db); assert.equal((await getOrderDetail(db, id))!.order.status, 'paid');
      });
    });

    describe('order list, search and export', () => {
      test('filters by status, searches by number / email / name, and counts tabs', async () => {
        const all = await listOrders(db); assert.ok(all.total > 5);
        assert.equal(all.counts.all, all.total);
        const paid = await listOrders(db, { status: 'paid' }); assert.ok(paid.rows.every((r) => r.status === 'paid')); assert.equal(paid.counts.all, all.total, 'tab counts ignore the status filter');
        const one = all.rows[0]; assert.equal((await listOrders(db, { q: `#${one.orderNumber}` })).rows[0].orderNumber, one.orderNumber);
        assert.ok((await listOrders(db, { q: 'asha' })).total > 0); assert.ok((await listOrders(db, { q: 'A@B.CO' })).total > 0); assert.equal((await listOrders(db, { q: 'zzz-nope' })).total, 0);
        assert.equal((await listOrders(db, { q: '%' })).total, 0, 'a percent sign is searched literally');
        const p1 = await listOrders(db, { pageSize: 3, page: 2 }); assert.equal(p1.rows.length, 3); assert.equal(p1.pages, Math.ceil(all.total / 3));
      });
      test('export has one row per order with a readable item list', async () => {
        const rows = await exportOrders(db, {}); assert.ok(rows.length > 5); assert.ok(rows.some((r) => /Everyday Hoops x2/.test(r.items)));
      });
    });

    describe('coupons', () => {
      test('create, edit, switch off, delete; rules are enforced', async () => {
        const c = await createCoupon(db, couponInputSchema.parse({ code: ' festive20 ', kind: 'percent', value: '20', minSubtotal: '999.50', startsAt: '2026-11-01T00:00', endsAt: '2026-11-30T23:59', maxRedemptions: '100' }), 't');
        const row = () => db.select().from(coupons).where(eq(coupons.id, c.id)).then((r) => r[0]);
        assert.equal((await row()).code, 'FESTIVE20'); assert.equal((await row()).minSubtotalPaise, 99950); assert.equal((await row()).startsAt!.toISOString(), '2026-10-31T18:30:00.000Z', 'times are read as India time');
        await assert.rejects(() => createCoupon(db, couponInputSchema.parse({ code: 'FESTIVE20', kind: 'percent', value: '5' }), 't'), (e: unknown) => e instanceof AdminError && /already exists/.test(e.message));
        await updateCoupon(db, c.id, couponInputSchema.parse({ code: 'FESTIVE20', kind: 'fixed', value: '150', maxRedemptions: '' }), 't');
        assert.equal((await row()).kind, 'fixed'); assert.equal((await row()).value, 15000); assert.equal((await row()).maxRedemptions, null);
        await assert.rejects(() => updateCoupon(db, c.id, couponInputSchema.parse({ code: 'OTHER', kind: 'percent', value: '5' }), 't'), /cannot be changed/);
        await setCouponActive(db, c.id, false, 't'); assert.equal((await row()).isActive, false);
        assert.ok((await listAllCoupons(db)).some((x) => x.code === 'FESTIVE20'));
        await deleteCoupon(db, c.id, 't'); assert.equal((await db.select().from(coupons).where(eq(coupons.id, c.id))).length, 0);
        await assert.rejects(() => deleteCoupon(db, c.id, 't'), AdminError);
      });
      test('the limit cannot be set below what was already used', async () => {
        const [once] = await db.select().from(coupons).where(eq(coupons.code, 'ONCE'));
        assert.equal(once.redemptions, 1);
        await assert.rejects(() => updateCoupon(db, once.id, couponInputSchema.parse({ code: 'ONCE', kind: 'percent', value: '10', maxRedemptions: '1' }), 't').then(() => Promise.reject(new Error('limit equal to uses is allowed'))), /limit equal to uses is allowed/);
        await assert.doesNotReject(() => updateCoupon(db, once.id, couponInputSchema.parse({ code: 'ONCE', kind: 'percent', value: '10', maxRedemptions: '3' }), 't'));
      });
      test('bad coupon input is explained', () => {
        for (const bad of [{ code: 'x', kind: 'percent', value: '10' }, { code: 'GOOD1', kind: 'percent', value: '0' }, { code: 'GOOD1', kind: 'percent', value: '101' }, { code: 'GOOD1', kind: 'percent', value: '5.5' },
          { code: 'GOOD1', kind: 'fixed', value: 'abc' }, { code: 'GOOD1', kind: 'fixed', value: '0.50' }, { code: 'GOOD1', kind: 'percent', value: '10', startsAt: '2026-12-01T00:00', endsAt: '2026-11-01T00:00' }, { code: 'GOOD1', kind: 'percent', value: '10', maxRedemptions: '0' }])
          assert.equal(couponInputSchema.safeParse(bad).success, false, JSON.stringify(bad));
      });
    });

    describe('dashboard numbers', () => {
      before(async () => { await db.update(products).set({ stock: 500 }).where(eq(products.id, 6)); });
      test('add up from real orders', async () => {
        const s = await dashboardStats(db);
        assert.equal(s.days.length, 14); assert.equal(new Set(s.days.map((d) => d.day)).size, 14);
        assert.ok(s.monthPaise >= s.todayPaise); assert.ok(s.recent.length > 0); assert.ok(s.productCount >= 10);
        const delivered = (await listOrders(db, { status: 'delivered' })).rows.reduce((a, r) => a + r.totalPaise, 0);
        assert.ok(s.monthPaise >= delivered, 'delivered orders from today count as sales');
        assert.equal(s.days.at(-1)!.paise, s.todayPaise, 'the last day of the chart is today');
        assert.ok(s.lowStock.every((l) => l.stock <= 5));
      });
      test('a customer who paid for a cancelled order is flagged', async () => {
        const id = (await placeOrder(db, order())).id;
        await db.update(orders).set({ status: 'cancelled', paymentId: 'pay_late' }).where(eq(orders.id, id));
        assert.ok((await dashboardStats(db)).attention.some((a) => a.id === id));
      });
      test('start of the India day is midnight IST', () => {
        // 20:00 UTC on the 2nd is 01:30 in India on the 3rd, so "today" in India began at 18:30 UTC on the 2nd.
        assert.equal(startOfIstDay(new Date('2026-11-02T20:00:00Z')).toISOString(), '2026-11-02T18:30:00.000Z');
        assert.equal(startOfIstDay(new Date('2026-11-02T10:00:00Z')).toISOString(), '2026-11-01T18:30:00.000Z');
        assert.equal(startOfIstDay(new Date('2026-11-02T10:00:00Z'), 1).toISOString(), '2026-10-31T18:30:00.000Z');
      });
    });

    test('every change is written to the activity log', async () => {
      const log = await recentActivity(db, 500);
      assert.ok(log.length > 20); assert.ok(log.some((l) => l.entity === 'order' && /→/.test(l.summary))); assert.ok(log.every((l) => l.actor));
      assert.ok((await db.select().from(orderEvents)).length > 0);
    });
  });
}
