import { eq } from 'drizzle-orm';
import { dbRule } from './admin-errors';
import type { Db } from './client';
import { countCouponUse, OutOfStockError, reserveStock } from './inventory';
import { orderEvents, orderItems, orders, users } from './schema';

export class CouponUsedUpError extends Error { constructor() { super('That coupon code has just been fully used. Please remove it and try again.'); this.name = 'CouponUsedUpError'; } }

export interface PlaceOrderInput {
  email: string; phone: string | null;
  shippingAddress: { recipientName: string; line1: string; line2: string | null; city: string; state: string; pincode: string; country: string; phone: string | null };
  paymentMethod: 'razorpay' | 'cod';
  /** The coupon the server accepted for this bag, or null. */
  couponCode: string | null;
  lines: { productId: number; variant: string | null; name: string; unitPricePaise: number; qty: number; lineTotalPaise: number }[];
  subtotalPaise: number; discountPaise: number; shippingPaise: number; taxPaise: number; totalPaise: number;
  idempotencyKey: string | null; userId: string | null;
}

/**
 * Creates an order in the database in ONE transaction: takes the stock (or fails with OutOfStockError), counts the coupon use,
 * saves the order, its lines (with the real SKU and size recorded) and the first timeline entry.
 * If anything fails, nothing is kept, so a half-made order can never exist.
 */
export async function placeOrder(db: Db, i: PlaceOrderInput): Promise<{ id: string; orderNumber: number; alreadyExists?: boolean }> {
  // A signed-in demo account may exist only in memory. Never let that break checkout: such an order is simply saved as a guest order.
  let userId: string | null = null;
  if (i.userId) { const [u] = await db.select({ id: users.id }).from(users).where(eq(users.id, i.userId)).limit(1); userId = u?.id ?? null; }
  try {
    return await db.transaction(async (tx0) => {
      const tx = tx0 as unknown as Db;
      const reserved = await reserveStock(tx, i.lines.map((l) => ({ productId: l.productId, variant: l.variant, qty: l.qty })));
      let couponCounted = false;
      if (i.couponCode) { if (!(await countCouponUse(tx, i.couponCode))) throw new CouponUsedUpError(); couponCounted = true; }
      const [order] = await tx.insert(orders).values({
        status: 'pending_payment', email: i.email.toLowerCase(), phone: i.phone, shippingAddress: i.shippingAddress, couponCode: i.couponCode,
        subtotalPaise: i.subtotalPaise, discountPaise: i.discountPaise, shippingPaise: i.shippingPaise, taxPaise: i.taxPaise, totalPaise: i.totalPaise,
        idempotencyKey: i.idempotencyKey, userId, paymentMethod: i.paymentMethod, stockHeld: true, couponCounted,
      }).returning({ id: orders.id, orderNumber: orders.orderNumber });
      if (!order) throw new Error('Failed to create order.');
      if (i.lines.length) {
        const byKey = new Map(reserved.map((r) => [`${r.productId}|${r.optionValue ?? ''}`, r]));
        await tx.insert(orderItems).values(i.lines.map((l) => {
          const r = byKey.get(`${l.productId}|${l.variant ?? ''}`);
          return { orderId: order.id, productId: l.productId, variantId: r?.variantId ?? null, nameSnapshot: l.name, skuSnapshot: r?.sku ?? String(l.productId), optionLabelSnapshot: r?.optionLabel ?? null, optionValueSnapshot: l.variant, unitPricePaise: l.unitPricePaise, qty: l.qty, lineTotalPaise: l.lineTotalPaise };
        }));
      }
      await tx.insert(orderEvents).values({ orderId: order.id, status: 'pending_payment', note: i.paymentMethod === 'cod' ? 'Order placed (Cash on Delivery)' : 'Order placed, awaiting payment' });
      return order;
    });
  } catch (e) {
    // Double-click or retry with the same key: hand back the order that already exists.
    if (i.idempotencyKey && dbRule(e).includes('orders_idempotency_key_unique')) {
      const [ex] = await db.select({ id: orders.id, orderNumber: orders.orderNumber }).from(orders).where(eq(orders.idempotencyKey, i.idempotencyKey)).limit(1);
      if (ex) return { ...ex, alreadyExists: true };
    }
    throw e;
  }
}
export { OutOfStockError };
