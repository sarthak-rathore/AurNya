import { and, asc, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import { UNPAID_HOLD_MINUTES } from '@/lib/order-status';
import type { Db } from './client';
import { coupons, orderEvents, orderItems, orders, productVariants, products } from './schema';

// Stock and coupon bookkeeping for orders. Used by checkout (to hold stock) and by the admin dashboard (to give it back).
// Rule: an order "holds" its stock from the moment it is placed until it is cancelled or expires. `orders.stock_held` records that,
// so stock is given back exactly once, and old orders from before this existed are never "given back" by mistake.

export interface StockLine { productId: number; variant: string | null; qty: number }
export interface ReservedLine { productId: number; variantId: number | null; sku: string; optionLabel: string | null; optionValue: string | null }

export class OutOfStockError extends Error {
  constructor(public productName: string) { super(`"${productName}" just sold out or has fewer pieces left than you asked for.`); this.name = 'OutOfStockError'; }
}

/**
 * Takes the stock for these lines, or throws OutOfStockError. Call inside the same transaction that creates the order,
 * so a failure undoes everything. The `stock >= qty` condition makes two people buying the last piece impossible.
 */
export async function reserveStock(tx: Db, input: StockLine[]): Promise<ReservedLine[]> {
  const merged = new Map<string, StockLine>();
  for (const l of input) { const k = `${l.productId}|${l.variant ?? ''}`; const h = merged.get(k); merged.set(k, h ? { ...h, qty: h.qty + l.qty } : { ...l }); }
  const lines = [...merged.values()].sort((a, b) => a.productId - b.productId || (a.variant ?? '').localeCompare(b.variant ?? ''));   // same order everywhere: no deadlocks
  if (!lines.length) return [];
  const ids = [...new Set(lines.map((l) => l.productId))];
  const [prods, vars] = await Promise.all([
    tx.select({ id: products.id, sku: products.sku, name: products.name, status: products.status }).from(products).where(inArray(products.id, ids)),
    tx.select().from(productVariants).where(inArray(productVariants.productId, ids)),
  ]);
  const out: ReservedLine[] = [];
  for (const l of lines) {
    const p = prods.find((x) => x.id === l.productId); if (!p || p.status !== 'active') throw new OutOfStockError(p?.name ?? 'This item');
    const mine = vars.filter((v) => v.productId === p.id);
    if (mine.length) {
      const v = mine.find((x) => x.optionValue === l.variant); if (!v) throw new OutOfStockError(p.name);
      const got = await tx.update(productVariants).set({ stock: sql`${productVariants.stock} - ${l.qty}` }).where(and(eq(productVariants.id, v.id), gte(productVariants.stock, l.qty))).returning({ id: productVariants.id });
      if (!got.length) throw new OutOfStockError(p.name);
      out.push({ productId: p.id, variantId: v.id, sku: v.sku ?? p.sku, optionLabel: v.optionLabel, optionValue: v.optionValue });
    } else {
      if (l.variant !== null) throw new OutOfStockError(p.name);
      const got = await tx.update(products).set({ stock: sql`${products.stock} - ${l.qty}` }).where(and(eq(products.id, p.id), gte(products.stock, l.qty))).returning({ id: products.id });
      if (!got.length) throw new OutOfStockError(p.name);
      out.push({ productId: p.id, variantId: null, sku: p.sku, optionLabel: null, optionValue: null });
    }
  }
  return out;
}

/** Counts one use of a coupon. Returns false when the coupon has just reached its limit (or no longer exists). */
export async function countCouponUse(tx: Db, code: string): Promise<boolean> {
  const got = await tx.update(coupons).set({ redemptions: sql`${coupons.redemptions} + 1` })
    .where(and(eq(coupons.code, code), sql`(${coupons.maxRedemptions} is null or ${coupons.redemptions} < ${coupons.maxRedemptions})`)).returning({ id: coupons.id });
  return got.length > 0;
}

/** Puts the pieces of an order back on the shelf. */
export async function restoreStock(tx: Db, orderId: string): Promise<void> {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const it of items) {
    if (it.productId === null) continue;   // the product was deleted since: nothing to put back
    let variantId = it.variantId;
    if (variantId === null && it.optionValueSnapshot) {
      const [v] = await tx.select({ id: productVariants.id }).from(productVariants).where(and(eq(productVariants.productId, it.productId), eq(productVariants.optionValue, it.optionValueSnapshot))).limit(1);
      variantId = v?.id ?? null;
      if (variantId === null) continue;
    }
    if (variantId !== null) await tx.update(productVariants).set({ stock: sql`${productVariants.stock} + ${it.qty}` }).where(eq(productVariants.id, variantId));
    else await tx.update(products).set({ stock: sql`${products.stock} + ${it.qty}` }).where(eq(products.id, it.productId));
  }
}

type OrderHolds = { id: string; stockHeld: boolean; couponCounted: boolean; couponCode: string | null };
/** Gives back whatever an order is holding (stock and a coupon use), once. */
export async function releaseHolds(tx: Db, o: OrderHolds, opts: { stock?: boolean; coupon?: boolean } = {}): Promise<void> {
  const wantStock = opts.stock ?? true; const wantCoupon = opts.coupon ?? true;
  if (wantStock && o.stockHeld) { await restoreStock(tx, o.id); await tx.update(orders).set({ stockHeld: false }).where(eq(orders.id, o.id)); }
  if (wantCoupon && o.couponCounted && o.couponCode) {
    await tx.update(coupons).set({ redemptions: sql`greatest(${coupons.redemptions} - 1, 0)` }).where(eq(coupons.code, o.couponCode));
    await tx.update(orders).set({ couponCounted: false }).where(eq(orders.id, o.id));
  }
}

/**
 * Cancels online orders that were never paid within the hold time and gives their stock back.
 * Cash-on-delivery orders are never expired: the owner confirms or cancels those.
 * Safe to call often and from several places at once.
 */
export async function releaseExpiredOrders(db: Db, minutes = UNPAID_HOLD_MINUTES, now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - minutes * 60_000);
  const stale = await db.select({ id: orders.id }).from(orders)
    .where(and(eq(orders.status, 'pending_payment'), eq(orders.paymentMethod, 'razorpay'), lt(orders.createdAt, cutoff))).orderBy(asc(orders.createdAt)).limit(50);
  let n = 0;
  for (const s of stale) {
    const done = await db.transaction(async (tx) => {
      const [o] = await tx.select().from(orders).where(eq(orders.id, s.id)).for('update').limit(1);
      if (!o || o.status !== 'pending_payment') return false;   // someone paid or cancelled it in the meantime
      await releaseHolds(tx as unknown as Db, o);
      await tx.update(orders).set({ status: 'cancelled', updatedAt: new Date() }).where(eq(orders.id, o.id));
      await tx.insert(orderEvents).values({ orderId: o.id, status: 'cancelled', note: 'Not paid in time, so the order was released.' });
      return true;
    });
    if (done) n++;
  }
  return n;
}
