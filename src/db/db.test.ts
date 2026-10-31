import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { eq, sql } from 'drizzle-orm';
import { site } from '@/config/site';
import { products as demoProducts } from '@/data/products';
import { parseAnnouncement } from '@/lib/announcement';
import { createMemoryCatalog } from '@/lib/catalog-memory';
import { memoryCouponStore } from '@/lib/coupon-store';
import { quote, type QuoteInput } from '@/lib/quote';
import type { Query } from '@/lib/types';
import { createDbCatalog } from './catalog';
import { driverFor, isNeonUrl, type Db } from './client';
import { createDbCouponStore } from './coupons';
import { categories, coupons, orderItems, orderEvents, orders, productImages, products, productVariants, users, userAddresses, userWishlist } from './schema';
import { purgeDemo, seedDemo } from './seed';
import { readSetting, writeSetting } from './settings';
import { backends, openTestDb, refused, type Backend } from './test-db';

const memory = createMemoryCatalog(demoProducts);
const ringCategory = async (db: Db) => (await db.select().from(categories).where(eq(categories.name, 'Rings')))[0].id;
const newProduct = async (db: Db, over: Partial<typeof products.$inferInsert> = {}) =>
  db.insert(products).values({ slug: 'real-ring', sku: 'REAL-1', name: 'Real Ring', categoryId: await ringCategory(db), pricePaise: 50000, stock: 5, ...over }).returning();

for (const kind of backends()) {
  describe(`database (${kind})`, () => {
    let db: Db; let close: () => Promise<void>; let catalog: ReturnType<typeof createDbCatalog>;
    before(async () => { ({ db, close } = await openTestDb(kind as Backend)); await seedDemo(db); catalog = createDbCatalog(db); });
    after(() => close());

    describe('database catalogue behaves exactly like the demo catalogue', () => {
      const queries: Query[] = [
        {}, { page: 2 }, { page: 0 }, { category: 'Rings' }, { category: 'Nothing' }, { collection: 'gifts' }, { collection: 'nope' }, { tag: 'new' }, { tag: 'bestseller' },
        { price: '0-59900' }, { price: '59900-99900' }, { price: '99900-100000000' }, { price: 'abc' }, { stock: '1' },
        { q: 'hoop' }, { q: 'RING' }, { q: 'zzz' }, { q: '%' }, { q: '_' }, { q: "o'brien" }, { q: '  ' },
        { sort: 'price-asc' }, { sort: 'price-desc' }, { sort: 'newest' }, { category: 'Rings', stock: '1', sort: 'price-desc' }, { collection: 'everyday', tag: 'new', sort: 'price-asc' },
      ];
      for (const q of queries) test(`list ${JSON.stringify(q)}`, async () => assert.deepStrictEqual(await catalog.list(q), await memory.list(q)));
      test('all()', async () => assert.deepStrictEqual(await catalog.all(), await memory.all()));
      test('bySlug for every product, and for a missing one', async () => {
        for (const p of demoProducts) assert.deepStrictEqual(await catalog.bySlug(p.slug), p);
        assert.equal(await catalog.bySlug('nope'), null);
      });
      test('byIds, including empty and unknown ids', async () => {
        assert.deepStrictEqual(await catalog.byIds([3, 1, 9999]), await memory.byIds([3, 1, 9999]));
        assert.deepStrictEqual(await catalog.byIds([]), []);
      });
      test('related, featured and suggest', async () => {
        for (const p of demoProducts) assert.deepStrictEqual(await catalog.related(p), await memory.related(p));
        for (const t of ['new', 'bestseller'] as const) assert.deepStrictEqual(await catalog.featured(t, 2), await memory.featured(t, 2));
        for (const t of ['ho', 'RING', 'neck', 'x', '', '  ', '%']) assert.deepStrictEqual(await catalog.suggest(t), await memory.suggest(t), `suggest "${t}"`);
      });
      test('draft and archived products are never shown', async () => {
        const [d] = await newProduct(db, { slug: 'draft-x', sku: 'D-1', status: 'draft', name: 'Hoop Draft' });
        assert.equal(await catalog.bySlug('draft-x'), null);
        assert.ok(!(await catalog.list({ q: 'Hoop Draft' })).items.length);
        assert.ok(!(await catalog.all()).some((p) => p.id === d.id));
        await db.delete(products).where(eq(products.id, d.id));
      });
      test('total stock of a product with sizes is the sum of its sizes', async () => {
        const solitaire = (await catalog.bySlug('solitaire-ring'))!;
        assert.equal(solitaire.stock, Object.values(solitaire.variants!.optionStock!).reduce((a, b) => a + b, 0));
        await db.update(productVariants).set({ stock: 0 }).where(eq(productVariants.sku, 'DEMO-005-9'));
        assert.equal((await catalog.bySlug('solitaire-ring'))!.stock, solitaire.stock - 1);
        await db.update(productVariants).set({ stock: 1 }).where(eq(productVariants.sku, 'DEMO-005-9'));
      });
      test('pictures come back in order', async () => {
        const [p] = await db.select().from(products).where(eq(products.slug, 'everyday-hoops'));
        await db.insert(productImages).values([{ productId: p.id, url: '/b.jpg', alt: 'second', sortOrder: 2 }, { productId: p.id, url: '/a.jpg', alt: 'first', sortOrder: 1 }]);
        assert.deepStrictEqual((await catalog.bySlug('everyday-hoops'))!.images, [{ src: '/a.jpg', alt: 'first' }, { src: '/b.jpg', alt: 'second' }]);
        await db.delete(productImages).where(eq(productImages.productId, p.id));
      });
    });

    describe('the database refuses bad data', () => {
      const cat = () => ringCategory(db);
      test('negative price', async () => refused(async () => newProduct(db, { slug: 'a1', sku: 'A1', pricePaise: -1 }), 'products_price_nonneg'));
      test('compare-at price not above the price', async () => refused(async () => newProduct(db, { slug: 'a2', sku: 'A2', pricePaise: 5000, comparePricePaise: 5000 }), 'products_compare_above_price'));
      test('negative stock', async () => refused(async () => newProduct(db, { slug: 'a3', sku: 'A3', stock: -1 }), 'products_stock_nonneg'));
      test('unknown tag', async () => refused(async () => newProduct(db, { slug: 'a4', sku: 'A4', tags: ['sale'] }), 'products_tags_known'));
      test('duplicate slug', async () => refused(async () => newProduct(db, { slug: 'everyday-hoops', sku: 'A5' }), 'products_slug_unique'));
      test('duplicate SKU', async () => refused(async () => newProduct(db, { slug: 'a6', sku: 'DEMO-001' }), 'products_sku_unique'));
      test('product in a category that does not exist', async () => refused(async () => db.insert(products).values({ slug: 'a7', sku: 'A7', name: 'x', categoryId: 99999, pricePaise: 1 }), 'products_category_id_categories_id_fk'));
      test('a category that still has products cannot be deleted', async () => refused(async () => db.delete(categories).where(eq(categories.id, await cat())), 'products_category_id_categories_id_fk'));
      test('negative size stock', async () => refused(async () => db.update(productVariants).set({ stock: -1 }).where(eq(productVariants.sku, 'DEMO-004-6')), 'product_variants_stock_nonneg'));
      test('the same size twice on one product', async () => refused(async () => db.insert(productVariants).values({ productId: 4, optionLabel: 'Size', optionValue: '6' }), 'product_variants_product_option'));
      test('coupon code must be in capitals', async () => refused(async () => db.insert(coupons).values({ code: 'lower', kind: 'percent', value: 5 }), 'coupons_code_capitals'));
      test('percent coupons must be 1 to 100', async () => { for (const value of [0, 101]) await refused(async () => db.insert(coupons).values({ code: `P${value}`, kind: 'percent', value }), 'coupons_value_valid'); });
      test('fixed coupons must be above zero', async () => refused(async () => db.insert(coupons).values({ code: 'FIX0', kind: 'fixed', value: 0 }), 'coupons_value_valid'));
      test('coupon must end after it starts', async () => refused(async () => db.insert(coupons).values({ code: 'BAD1', kind: 'fixed', value: 5, startsAt: new Date('2030-01-02'), endsAt: new Date('2030-01-01') }), 'coupons_dates_ordered'));
      test('duplicate coupon code', async () => refused(async () => db.insert(coupons).values({ code: 'AURDEMO10', kind: 'percent', value: 5 }), 'coupons_code_unique'));
      const order = (over: Partial<typeof orders.$inferInsert> = {}) => ({ email: 'a@b.com', subtotalPaise: 10000, discountPaise: 1000, totalPaise: 9000, ...over });
      test('order whose total does not add up', async () => refused(async () => db.insert(orders).values(order({ totalPaise: 9001 })), 'orders_total_adds_up'));
      test('order with discount above subtotal', async () => refused(async () => db.insert(orders).values(order({ discountPaise: 20000, totalPaise: -10000 })), 'orders_amounts_valid'));
      test('order item whose line total is wrong, or quantity is zero', async () => {
        const [o] = await db.insert(orders).values(order()).returning();
        await refused(async () => db.insert(orderItems).values({ orderId: o.id, nameSnapshot: 'x', skuSnapshot: 'x', unitPricePaise: 100, qty: 2, lineTotalPaise: 199 }), 'order_items_line_adds_up');
        await refused(async () => db.insert(orderItems).values({ orderId: o.id, nameSnapshot: 'x', skuSnapshot: 'x', unitPricePaise: 100, qty: 0, lineTotalPaise: 0 }), 'order_items_qty_positive');
      });
      test('the same idempotency key cannot make two orders', async () => {
        await db.insert(orders).values(order({ idempotencyKey: 'abc' }));
        await refused(async () => db.insert(orders).values(order({ idempotencyKey: 'abc' })), 'orders_idempotency_key_unique');
      });
    });

    describe('orders keep a snapshot of what was bought', () => {
      test('editing or deleting the product later does not change the order', async () => {
        const [p] = await newProduct(db, { slug: 'snap', sku: 'SNAP-1', name: 'Snapshot Ring', pricePaise: 12345 });
        const [o] = await db.insert(orders).values({ email: 's@b.com', subtotalPaise: 24690, totalPaise: 24690 }).returning();
        await db.insert(orderItems).values({ orderId: o.id, productId: p.id, nameSnapshot: p.name, skuSnapshot: p.sku, optionLabelSnapshot: 'Size', optionValueSnapshot: '7', unitPricePaise: p.pricePaise, qty: 2, lineTotalPaise: 24690 });
        await db.insert(orderEvents).values({ orderId: o.id, status: 'pending_payment', note: 'Order placed' });
        await db.update(products).set({ pricePaise: 99999, name: 'Renamed' }).where(eq(products.id, p.id));
        await db.delete(products).where(eq(products.id, p.id));
        const [item] = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
        assert.equal(item.productId, null); assert.equal(item.nameSnapshot, 'Snapshot Ring'); assert.equal(item.unitPricePaise, 12345); assert.equal(item.lineTotalPaise, 24690);
        await db.delete(orders).where(eq(orders.id, o.id));   // deleting an order removes its items and timeline
        assert.equal((await db.select().from(orderItems).where(eq(orderItems.orderId, o.id))).length, 0);
        assert.equal((await db.select().from(orderEvents).where(eq(orderEvents.orderId, o.id))).length, 0);
      });
      test('order numbers count up by themselves', async () => {
        const [a] = await db.insert(orders).values({ email: 'n@b.com', subtotalPaise: 1, totalPaise: 1 }).returning();
        const [b] = await db.insert(orders).values({ email: 'n@b.com', subtotalPaise: 1, totalPaise: 1 }).returning();
        assert.equal(b.orderNumber, a.orderNumber + 1);
      });
    });

    describe('settings and coupons', () => {
      test('settings can be read, written and overwritten', async () => {
        assert.equal(await readSetting(db, 'nothing'), null);
        await writeSetting(db, 'k', { a: 1 }); assert.deepStrictEqual(await readSetting(db, 'k'), { a: 1 });
        await writeSetting(db, 'k', { a: 2 }); assert.deepStrictEqual(await readSetting(db, 'k'), { a: 2 });
      });
      test('the seeded announcement round-trips through the database', async () => {
        const a = parseAnnouncement(await readSetting(db, 'announcement'), site.announcement);
        assert.equal(a.message, site.announcement.message); assert.equal(a.visible, true);
      });
      test('coupon lookup ignores case and spaces, and returns real dates', async () => {
        const store = createDbCouponStore(db);
        assert.equal((await store.find(' aurdemo10 '))?.value, 10); assert.equal(await store.find('NOPE'), null);
        await db.insert(coupons).values({ code: 'DATED', kind: 'fixed', value: 5000, startsAt: new Date('2030-01-01T00:00:00Z') });
        assert.ok((await store.find('dated'))?.startsAt instanceof Date);
      });
    });

    describe('server-side bag check gives the same answers with the database as without it', () => {
      const dbCatalog = () => createDbCatalog(db); const dbCoupons = () => createDbCouponStore(db);
      const inputs: QuoteInput[] = [
        { lines: [], coupon: '' },
        { lines: [{ productId: 1, variant: null, qty: 2 }], coupon: '' },
        { lines: [{ productId: 5, variant: '7', qty: 5 }], coupon: 'aurdemo10' },
        { lines: [{ productId: 5, variant: '9', qty: 5 }, { productId: 9, variant: '7', qty: 1 }, { productId: 4, variant: null, qty: 1 }], coupon: '' },
        { lines: [{ productId: 1, variant: null, qty: 1 }, { productId: 1, variant: null, qty: 2 }, { productId: 9999, variant: null, qty: 1 }, { productId: 2, variant: '7', qty: 1 }], coupon: 'NOPE' },
        { lines: [{ productId: 3, variant: null, qty: 1, expectedUnitPricePaise: 1 }], coupon: 'AURDEMO10' },
      ];
      inputs.forEach((input, i) => test(`bag #${i + 1}`, async () => assert.deepStrictEqual(await quote(dbCatalog(), dbCoupons(), input), await quote(memory, memoryCouponStore, input))));
      test('coupon rules from the database: minimum, expiry, not started, used up, switched off, fixed amount capped', async () => {
        const now = new Date('2026-06-01T00:00:00Z');
        await db.insert(coupons).values([
          { code: 'MIN1000', kind: 'percent', value: 20, minSubtotalPaise: 100000 }, { code: 'OLD', kind: 'fixed', value: 5000, endsAt: new Date('2026-01-01') },
          { code: 'SOON', kind: 'fixed', value: 5000, startsAt: new Date('2026-12-01') }, { code: 'GONE', kind: 'fixed', value: 5000, maxRedemptions: 2, redemptions: 2 },
          { code: 'OFF', kind: 'fixed', value: 5000, isActive: false }, { code: 'BIG', kind: 'fixed', value: 99999999 },
        ]);
        const bag = (coupon: string): QuoteInput => ({ lines: [{ productId: 1, variant: null, qty: 1 }], coupon });   // subtotal 79900
        const q = async (c: string) => (await quote(dbCatalog(), dbCoupons(), bag(c), now)).coupon;
        assert.equal((await q('MIN1000')).problem, 'minimum'); assert.equal((await q('OLD')).problem, 'expired'); assert.equal((await q('SOON')).problem, 'not_started');
        assert.equal((await q('GONE')).problem, 'used_up'); assert.equal((await q('OFF')).problem, 'inactive');
        const big = await quote(dbCatalog(), dbCoupons(), bag('BIG'), now);
        assert.equal(big.discountPaise, 79900); assert.equal(big.totalPaise, 0);   // never below zero
      });
      test('prices come from the database: changing a price changes the quote, and a price from the browser is ignored', async () => {
        await db.update(products).set({ pricePaise: 70000 }).where(eq(products.id, 1));
        const r = await quote(dbCatalog(), dbCoupons(), { lines: [{ productId: 1, variant: null, qty: 2, expectedUnitPricePaise: 79900 }], coupon: '' });
        assert.equal(r.subtotalPaise, 140000); assert.deepStrictEqual(r.lines[0].issues, ['price_changed']);
        await db.update(products).set({ pricePaise: 79900 }).where(eq(products.id, 1));
      });
      test('stock changes are reflected: selling out a size removes it from the total', async () => {
        await db.update(productVariants).set({ stock: 0 }).where(eq(productVariants.sku, 'DEMO-005-7'));
        const r = await quote(dbCatalog(), dbCoupons(), { lines: [{ productId: 5, variant: '7', qty: 1 }], coupon: '' });
        assert.equal(r.subtotalPaise, 0); assert.deepStrictEqual(r.lines[0].issues, ['out_of_stock']); assert.equal(r.lines[0].counted, false);
        await db.update(productVariants).set({ stock: 3 }).where(eq(productVariants.sku, 'DEMO-005-7'));
      });
    });

    describe('seeding and clearing sample data', () => {
      test('running the seed again adds nothing and changes nothing', async () => {
        await db.update(products).set({ pricePaise: 11111 }).where(eq(products.id, 2));   // an edit made by the owner
        const before = (await db.select({ n: sql<number>`count(*)::int` }).from(products))[0].n;
        const r = await seedDemo(db);
        assert.equal(r.products, 0); assert.equal(r.variants, 0); assert.equal(r.skippedBecauseTheyExist, demoProducts.length);
        assert.equal((await db.select({ n: sql<number>`count(*)::int` }).from(products))[0].n, before);
        assert.equal((await db.select().from(products).where(eq(products.id, 2)))[0].pricePaise, 11111);   // edit survived
        await db.update(products).set({ pricePaise: 99900 }).where(eq(products.id, 2));
      });
      test('new products get fresh ids after the seed', async () => {
        const [p] = await newProduct(db, { slug: 'fresh', sku: 'FRESH-1', name: 'Fresh' });
        assert.ok(p.id > Math.max(...demoProducts.map((x) => x.id)));
        await db.delete(products).where(eq(products.id, p.id));
      });
      test('refuses to mix sample data into a catalogue that has real products (unless forced)', async () => {
        await newProduct(db, { slug: 'real', sku: 'REAL-2', name: 'Real' });
        await assert.rejects(() => seedDemo(db), /real \(non-demo\) products/);
        await seedDemo(db, { force: true });
      });
      test('clearing sample data removes only the sample rows', async () => {
        const r = await purgeDemo(db);
        assert.equal(r.products, demoProducts.length); assert.equal(r.coupons, 1);
        const left = await db.select().from(products);
        assert.ok(left.length >= 1 && left.every((p) => !p.isDemo));
        assert.equal((await db.select().from(productVariants).where(eq(productVariants.productId, 5))).length, 0);   // sizes went with their product
        assert.equal((await db.select().from(coupons).where(eq(coupons.code, 'AURDEMO10'))).length, 0);
        assert.ok((await db.select().from(coupons).where(eq(coupons.code, 'DATED'))).length === 1);   // non-demo coupon kept
      });
    });

    describe('accounts, addresses and wishlist (Phase 4)', () => {
      test('users: creation and duplicate email rejection', async () => {
        const u = await db.insert(users).values({ email: 'priya@example.com', passwordHash: 'salt:hash', firstName: 'Priya', lastName: 'Sharma' }).returning();
        assert.equal(u[0].email, 'priya@example.com');
        await assert.rejects(() => db.insert(users).values({ email: 'priya@example.com', passwordHash: 'salt:hash', firstName: 'Priya' }));
      });
      test('addresses: adding and defaults', async () => {
        const u = (await db.select().from(users).where(eq(users.email, 'priya@example.com')))[0];
        const a1 = (await db.insert(userAddresses).values({ userId: u.id, label: 'Home', recipientName: 'Priya Sharma', line1: '42 Lotus Lane', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', isDefault: true }).returning())[0];
        assert.equal(a1.isDefault, true);
        const a2 = (await db.insert(userAddresses).values({ userId: u.id, label: 'Work', recipientName: 'Priya Sharma', line1: '10 BKC Plaza', city: 'Mumbai', state: 'Maharashtra', pincode: '400051', isDefault: false }).returning())[0];
        assert.equal(a2.isDefault, false);
      });
      test('wishlist: saving items and querying', async () => {
        const u = (await db.select().from(users).where(eq(users.email, 'priya@example.com')))[0];
        const allProducts = await db.select().from(products).limit(1);
        if (allProducts.length > 0) {
          await db.insert(userWishlist).values({ userId: u.id, productId: allProducts[0].id });
          const rows = await db.select().from(userWishlist).where(eq(userWishlist.userId, u.id));
          assert.equal(rows.length, 1);
          assert.equal(rows[0].productId, allProducts[0].id);
        }
      });
    });
  });
}

describe('which driver is used', () => {
  test('Neon addresses use the Neon driver, everything else the standard one', () => {
    assert.equal(driverFor('postgres://u:p@ep-cool-123.ap-southeast-1.aws.neon.tech/db?sslmode=require'), 'neon-http');
    assert.equal(driverFor('postgres://u:p@localhost:5432/db'), 'node-postgres');
    assert.equal(driverFor('postgres://u:p@db.example.com/db'), 'node-postgres');
    assert.equal(driverFor('not a url'), 'node-postgres');
    assert.equal(isNeonUrl('postgres://u:p@evil.neon.tech.attacker.com/db'), false);
  });
});
