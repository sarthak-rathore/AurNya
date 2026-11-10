import { and, eq, inArray, sql } from 'drizzle-orm';
import { site } from '@/config/site';
import { products as demoProducts } from '@/data/products';
import { DEMO_COUPON } from '@/lib/coupons';
import { hashPassword } from '@/lib/auth';
import type { Db } from './client';
import { categories, collections, coupons, orders, orderItems, orderEvents, productCollections, productImages, products, productVariants, settings, userAddresses, users } from './schema';

export interface SeedReport { categories: number; collections: number; products: number; variants: number; coupons: number; skippedBecauseTheyExist: number }

/**
 * Puts the sample catalogue into the database. Safe to run again: it only ever ADDS rows that are missing and never changes
 * or deletes anything you edited. Every sample row is marked is_demo so `npm run db:purge-demo` can remove them later.
 * Refuses to run once real (non-demo) products exist, so sample data never gets mixed into a live catalogue by accident.
 */
export async function seedDemo(db: Db, opts: { force?: boolean } = {}): Promise<SeedReport> {
  const real = await db.select({ n: sql<number>`count(*)::int` }).from(products).where(eq(products.isDemo, false));
  if (Number(real[0].n) > 0 && !opts.force) {
    throw new Error('This database already has real (non-demo) products. Seeding sample data now would mix it in. Use --force only if you really want that.');
  }
  return db.transaction(async (tx) => {
    const report: SeedReport = { categories: 0, collections: 0, products: 0, variants: 0, coupons: 0, skippedBecauseTheyExist: 0 };
    report.categories = (await tx.insert(categories).values(site.categories.map((name, i) => ({ slug: name.toLowerCase(), name, sortOrder: i }))).onConflictDoNothing().returning({ id: categories.id })).length;
    report.collections = (await tx.insert(collections).values(site.collections.map((c, i) => ({ slug: c.slug, name: c.name, blurb: c.blurb, sortOrder: i }))).onConflictDoNothing().returning({ id: collections.id })).length;
    await tx.insert(settings).values({ key: 'announcement', value: site.announcement }).onConflictDoNothing();
    report.coupons = (await tx.insert(coupons).values({
      code: DEMO_COUPON.code, kind: DEMO_COUPON.kind, value: DEMO_COUPON.value, minSubtotalPaise: DEMO_COUPON.minSubtotalPaise, isDemo: true,
    }).onConflictDoNothing().returning({ id: coupons.id })).length;

    const catId = new Map((await tx.select().from(categories)).map((c) => [c.name, c.id]));
    const colId = new Map((await tx.select().from(collections)).map((c) => [c.slug, c.id]));
    for (const p of demoProducts) {
      const categoryId = catId.get(p.category); if (!categoryId) throw new Error(`Unknown category "${p.category}" for ${p.slug}`);
      const inserted = await tx.insert(products).values({
        id: p.id, slug: p.slug, sku: p.sku, name: p.name, categoryId, short: p.short, description: p.description ?? null,
        pricePaise: p.pricePaise, comparePricePaise: p.originalPricePaise ?? null, stock: p.variants ? 0 : p.stock, tags: p.tags,
        material: p.material ?? null, dimensions: p.dimensions ?? null, weight: p.weight ?? null, image: p.image ?? null, imageAlt: p.imageAlt ?? null,
        video: p.video ?? null, seoTitle: p.seoTitle ?? null, seoDescription: p.seoDescription ?? null, isDemo: true,
      }).onConflictDoNothing().returning({ id: products.id });
      if (!inserted.length) { report.skippedBecauseTheyExist++; continue; }   // already there: leave it and its children untouched
      report.products++;
      const cols = p.collections.map((s) => colId.get(s)).filter((x): x is number => x !== undefined);
      if (cols.length) await tx.insert(productCollections).values(cols.map((collectionId) => ({ productId: p.id, collectionId }))).onConflictDoNothing();
      if (p.variants) {
        const rows = p.variants.options.map((value, i) => ({ productId: p.id, optionLabel: p.variants!.label, optionValue: value, sku: `${p.sku}-${value}`, stock: p.variants!.optionStock?.[value] ?? 0, sortOrder: i }));
        await tx.insert(productVariants).values(rows).onConflictDoNothing(); report.variants += rows.length;
      }
      if (p.images?.length) await tx.insert(productImages).values(p.images.map((im, i) => ({ productId: p.id, url: im.src, alt: im.alt, sortOrder: i })));
    }
    // Explicit ids were used above so browsers' saved bags and wishlists stay valid. Move the counter past them.
    await tx.execute(sql`select setval(pg_get_serial_sequence('products', 'id'), greatest((select coalesce(max(id), 1) from products), 1))`);
    return report;
  });
}

/** Deletes every sample product, sample coupon, sample user and their sample orders. Your own rows are not touched. */
export async function purgeDemo(db: Db): Promise<{ products: number; coupons: number; users: number; orders: number }> {
  return db.transaction(async (tx) => {
    const demoUsers = await tx.select({ id: users.id }).from(users).where(eq(users.isDemo, true));
    const userIds = demoUsers.map((u) => u.id);
    let ordersCount = 0;
    if (userIds.length > 0) {
      const o = await tx.delete(orders).where(inArray(orders.userId, userIds)).returning({ id: orders.id });
      ordersCount = o.length;
      await tx.delete(userAddresses).where(inArray(userAddresses.userId, userIds));
    }
    const u = await tx.delete(users).where(eq(users.isDemo, true)).returning({ id: users.id });
    const p = await tx.delete(products).where(eq(products.isDemo, true)).returning({ id: products.id });
    const c = await tx.delete(coupons).where(and(eq(coupons.isDemo, true))).returning({ id: coupons.id });
    return { products: p.length, coupons: c.length, users: u.length, orders: ordersCount };
  });
}


export interface DemoUserReport { created: boolean; email: string; password: string; ordersCreated: number }

/**
 * Seeds a demo user so you can log in immediately without creating an account.
 * Safe to re-run — skips if the demo user already exists.
 *
 * Credentials:
 *   Email:    demo@aurnya.com
 *   Password: AurNya@123
 */
export async function seedDemoUser(db: Db): Promise<DemoUserReport> {
  const DEMO_EMAIL = 'demo@aurnya.com';
  const DEMO_PASSWORD = 'AurNya@123';

  // Check if already exists
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  if (existing.length > 0) {
    return { created: false, email: DEMO_EMAIL, password: DEMO_PASSWORD, ordersCreated: 0 };
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  return db.transaction(async (tx) => {
    // Create user
    const [user] = await tx.insert(users).values({
      email: DEMO_EMAIL,
      passwordHash,
      firstName: 'Priya',
      lastName: 'Demo',
      phone: '+91 98765 43210',
      isVerified: true,
      isDemo: true,
    }).returning();

    if (!user) throw new Error('Failed to create demo user');

    // Save a home address
    await tx.insert(userAddresses).values({
      userId: user.id,
      label: 'Home',
      recipientName: 'Priya Demo',
      line1: '42 Marine Lines',
      line2: 'Near Gateway of India',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India',
      phone: '+91 98765 43210',
      isDefault: true,
    });

    // Fetch first available product IDs
    const productRows = await tx.select({ id: products.id, name: products.name, pricePaise: products.pricePaise })
      .from(products).where(eq(products.status, 'active')).limit(5);

    let ordersCreated = 0;

    // Create 2 demo orders if there are products
    if (productRows.length > 0) {
      const p1 = productRows[0]!;
      const p2 = productRows[1] ?? productRows[0]!;

      // Order 1: Delivered (older)
      const [order1] = await tx.insert(orders).values({
        status: 'delivered',
        email: DEMO_EMAIL,
        phone: '+91 98765 43210',
        shippingAddress: { recipientName: 'Priya Demo', line1: '42 Marine Lines', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India' },
        subtotalPaise: p1.pricePaise * 2,
        discountPaise: 0,
        shippingPaise: 0,
        taxPaise: 0,
        totalPaise: p1.pricePaise * 2,
        userId: user.id,
        paymentMethod: 'razorpay',
        paymentId: 'pay_demo_delivered_001',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      }).returning();

      if (order1) {
        await tx.insert(orderItems).values({
          orderId: order1.id,
          productId: p1.id,
          nameSnapshot: p1.name,
          skuSnapshot: `demo-${p1.id}`,
          unitPricePaise: p1.pricePaise,
          qty: 2,
          lineTotalPaise: p1.pricePaise * 2,
        });
        await tx.insert(orderEvents).values([
          { orderId: order1.id, status: 'pending_payment', note: 'Order placed', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          { orderId: order1.id, status: 'paid', note: 'Payment confirmed (demo)', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 60000) },
          { orderId: order1.id, status: 'packed', note: 'Packed and ready to ship', createdAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000) },
          { orderId: order1.id, status: 'shipped', note: 'Shipped via Delhivery', createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) },
          { orderId: order1.id, status: 'delivered', note: 'Delivered successfully', createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
        ]);
        ordersCreated++;
      }

      // Order 2: Paid/Processing (recent)
      const [order2] = await tx.insert(orders).values({
        status: 'paid',
        email: DEMO_EMAIL,
        phone: '+91 98765 43210',
        shippingAddress: { recipientName: 'Priya Demo', line1: '42 Marine Lines', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India' },
        couponCode: DEMO_COUPON.code,
        subtotalPaise: p2.pricePaise,
        discountPaise: Math.floor(p2.pricePaise * 0.10),
        shippingPaise: 9900,
        taxPaise: 0,
        totalPaise: Math.floor(p2.pricePaise * 0.90) + 9900,
        userId: user.id,
        paymentMethod: 'razorpay',
        paymentId: 'pay_demo_paid_002',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      }).returning();

      if (order2) {
        await tx.insert(orderItems).values({
          orderId: order2.id,
          productId: p2.id,
          nameSnapshot: p2.name,
          skuSnapshot: `demo-${p2.id}-b`,
          unitPricePaise: p2.pricePaise,
          qty: 1,
          lineTotalPaise: p2.pricePaise,
        });
        await tx.insert(orderEvents).values([
          { orderId: order2.id, status: 'pending_payment', note: 'Order placed', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
          { orderId: order2.id, status: 'paid', note: 'Payment confirmed via Razorpay (demo)', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 120000) },
        ]);
        ordersCreated++;
      }
    }

    return { created: true, email: DEMO_EMAIL, password: DEMO_PASSWORD, ordersCreated };
  });
}
