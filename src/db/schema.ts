import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, jsonb, pgEnum, pgTable, primaryKey, serial, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

/*
 * AurNya database schema (PostgreSQL).
 *
 * Rules that hold everywhere:
 *  - Money is an integer number of paise (Rs 699 = 69900). Never floats. Checks below stop negative or inconsistent amounts.
 *  - Stock is per variant when a product has variants (ring sizes), otherwise on the product itself.
 *  - Rows marked is_demo are sample data from the seed. `npm run db:purge-demo` removes them in one go.
 *  - Order items copy (snapshot) the product name, SKU, size and price at purchase time, so later edits never rewrite history.
 *  - Tables for accounts arrived in Phase 4, payments and shipping in Phase 5, and the admin audit log in Phase 6.
 */

const stamp = (name: string) => timestamp(name, { withTimezone: true }).notNull().defaultNow();

export const productStatus = pgEnum('product_status', ['draft', 'active', 'archived']);
export const couponKind = pgEnum('coupon_kind', ['percent', 'fixed']);
export const orderStatus = pgEnum('order_status', ['pending_payment', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded']);
export const paymentMethod = pgEnum('payment_method', ['razorpay', 'cod']);

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull().unique(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
});

export const collections = pgTable('collections', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  blurb: text('blurb').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  short: text('short').notNull().default(''),
  description: text('description'),
  pricePaise: integer('price_paise').notNull(),
  comparePricePaise: integer('compare_price_paise'),
  /** Used only when the product has no variants. With variants, stock lives on each variant. */
  stock: integer('stock').notNull().default(0),
  tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
  material: text('material'),
  dimensions: text('dimensions'),
  weight: text('weight'),
  image: text('image'),
  imageAlt: text('image_alt'),
  video: text('video'),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  status: productStatus('status').notNull().default('active'),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: stamp('created_at'),
  updatedAt: stamp('updated_at'),
}, (t) => [
  check('products_price_nonneg', sql`${t.pricePaise} >= 0`),
  check('products_compare_above_price', sql`${t.comparePricePaise} is null or ${t.comparePricePaise} > ${t.pricePaise}`),
  check('products_stock_nonneg', sql`${t.stock} >= 0`),
  check('products_tags_known', sql`${t.tags} <@ ARRAY['new','bestseller']::text[]`),
  index('products_category_idx').on(t.categoryId),
  index('products_status_idx').on(t.status),
  index('products_price_idx').on(t.pricePaise),
]);

export const productImages = pgTable('product_images', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  alt: text('alt').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
}, (t) => [index('product_images_product_idx').on(t.productId)]);

export const productCollections = pgTable('product_collections', {
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  collectionId: integer('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
}, (t) => [primaryKey({ columns: [t.productId, t.collectionId] }), index('product_collections_collection_idx').on(t.collectionId)]);

/** One row per choice, for example Size 7. All variants of one product share the same optionLabel. */
export const productVariants = pgTable('product_variants', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  optionLabel: text('option_label').notNull(),
  optionValue: text('option_value').notNull(),
  sku: text('sku').unique(),
  stock: integer('stock').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
}, (t) => [
  unique('product_variants_product_option').on(t.productId, t.optionValue),
  check('product_variants_stock_nonneg', sql`${t.stock} >= 0`),
  index('product_variants_product_idx').on(t.productId),
]);

export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  /** Always stored in capitals, so AURDEMO10 and aurdemo10 are the same code. */
  code: text('code').notNull().unique(),
  kind: couponKind('kind').notNull(),
  /** Percent (1 to 100) or a fixed amount in paise, depending on kind. */
  value: integer('value').notNull(),
  minSubtotalPaise: integer('min_subtotal_paise').notNull().default(0),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  maxRedemptions: integer('max_redemptions'),
  redemptions: integer('redemptions').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: stamp('created_at'),
}, (t) => [
  check('coupons_code_capitals', sql`${t.code} = upper(${t.code})`),
  check('coupons_value_valid', sql`(${t.kind} = 'percent' and ${t.value} between 1 and 100) or (${t.kind} = 'fixed' and ${t.value} > 0)`),
  check('coupons_min_nonneg', sql`${t.minSubtotalPaise} >= 0`),
  check('coupons_redemptions_valid', sql`${t.redemptions} >= 0 and (${t.maxRedemptions} is null or ${t.maxRedemptions} >= 0)`),
  check('coupons_dates_ordered', sql`${t.startsAt} is null or ${t.endsAt} is null or ${t.endsAt} > ${t.startsAt}`),
]);

/** Small key/value store for store settings (announcement bar, home page pictures). The admin dashboard edits these. */
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: stamp('updated_at'),
});

/* ---- Prepared for Phase 5 (checkout). Nothing writes to these yet. ---- */

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: serial('order_number').notNull().unique(),
  status: orderStatus('status').notNull().default('pending_payment'),
  email: text('email').notNull(),
  phone: text('phone'),
  shippingAddress: jsonb('shipping_address'),
  couponCode: text('coupon_code'),
  subtotalPaise: integer('subtotal_paise').notNull(),
  discountPaise: integer('discount_paise').notNull().default(0),
  shippingPaise: integer('shipping_paise').notNull().default(0),
  taxPaise: integer('tax_paise').notNull().default(0),
  totalPaise: integer('total_paise').notNull(),
  /** Stops a double-click or retry from creating the same order twice. */
  idempotencyKey: text('idempotency_key').unique(),
  /** Phase 4: link orders to user accounts (nullable — guests can still order). */
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  /** Phase 5: payment details */
  paymentMethod: text('payment_method').notNull().default('razorpay'),
  paymentId: text('payment_id'),
  razorpayOrderId: text('razorpay_order_id'),
  /** Phase 6: fulfilment details the owner fills in when an order ships. */
  courier: text('courier'),
  trackingNumber: text('tracking_number'),
  trackingUrl: text('tracking_url'),
  /** Phase 6: private note, never shown to the customer. */
  adminNote: text('admin_note'),
  /** Phase 6: true while this order is holding stock / a coupon use. Set at checkout, cleared when the order is cancelled or expires, so stock is given back exactly once. */
  stockHeld: boolean('stock_held').notNull().default(false),
  couponCounted: boolean('coupon_counted').notNull().default(false),
  createdAt: stamp('created_at'),
  updatedAt: stamp('updated_at'),
}, (t) => [
  check('orders_amounts_valid', sql`${t.subtotalPaise} >= 0 and ${t.discountPaise} >= 0 and ${t.discountPaise} <= ${t.subtotalPaise} and ${t.shippingPaise} >= 0 and ${t.taxPaise} >= 0`),
  check('orders_total_adds_up', sql`${t.totalPaise} = ${t.subtotalPaise} - ${t.discountPaise} + ${t.shippingPaise} + ${t.taxPaise}`),
  index('orders_email_idx').on(t.email),
  index('orders_status_idx').on(t.status),
]);

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  /** Kept as a loose link only. If a product is deleted later, the snapshot below still tells the story. */
  productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  variantId: integer('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  nameSnapshot: text('name_snapshot').notNull(),
  skuSnapshot: text('sku_snapshot').notNull(),
  optionLabelSnapshot: text('option_label_snapshot'),
  optionValueSnapshot: text('option_value_snapshot'),
  unitPricePaise: integer('unit_price_paise').notNull(),
  qty: integer('qty').notNull(),
  lineTotalPaise: integer('line_total_paise').notNull(),
}, (t) => [
  check('order_items_qty_positive', sql`${t.qty} > 0`),
  check('order_items_price_nonneg', sql`${t.unitPricePaise} >= 0`),
  check('order_items_line_adds_up', sql`${t.lineTotalPaise} = ${t.unitPricePaise} * ${t.qty}`),
  index('order_items_order_idx').on(t.orderId),
]);

/** The timeline a customer sees: placed, paid, packed, shipped... */
export const orderEvents = pgTable('order_events', {
  id: serial('id').primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  status: orderStatus('status').notNull(),
  note: text('note'),
  createdAt: stamp('created_at'),
}, (t) => [index('order_events_order_idx').on(t.orderId)]);

// ---- Phase 4: Accounts ----

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name').notNull().default(''),
  lastName: text('last_name').notNull().default(''),
  phone: text('phone'),
  isVerified: boolean('is_verified').notNull().default(false),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: stamp('created_at'),
  updatedAt: stamp('updated_at'),
}, (t) => [
  index('users_email_idx').on(t.email),
]);

export const userAddresses = pgTable('user_addresses', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').notNull().default('Home'),
  recipientName: text('recipient_name').notNull(),
  line1: text('line1').notNull(),
  line2: text('line2'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  pincode: text('pincode').notNull(),
  country: text('country').notNull().default('India'),
  phone: text('phone'),
  isDefault: boolean('is_default').notNull().default(false),
}, (t) => [index('user_addresses_user_idx').on(t.userId)]);

export const userWishlist = pgTable('user_wishlist', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  addedAt: stamp('added_at'),
}, (t) => [primaryKey({ columns: [t.userId, t.productId] })]);

// ---- Phase 6: Admin dashboard ----

/** One row for every change made from the admin dashboard: who, what and when. Read-only history. */
export const adminAudit = pgTable('admin_audit', {
  id: serial('id').primaryKey(),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  summary: text('summary').notNull().default(''),
  createdAt: stamp('created_at'),
}, (t) => [index('admin_audit_created_idx').on(t.createdAt)]);
