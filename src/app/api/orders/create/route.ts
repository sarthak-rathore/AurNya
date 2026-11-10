import { after, NextResponse } from 'next/server';
import { queueOrderMessage } from '@/lib/whatsapp';
import { eq } from 'drizzle-orm';
import { releaseExpiredOrders } from '@/db/inventory';
import { CouponUsedUpError, OutOfStockError, placeOrder } from '@/db/place-order';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/db/client';
import { orders } from '@/db/schema';
import { catalog } from '@/lib/catalog';
import { couponStore } from '@/lib/coupon-store';
import { parseQuoteRequest, quote } from '@/lib/quote';
import { calculateShipping } from '@/lib/shipping';
import { sendOrderConfirmation } from '@/lib/email';
import { estimatedDeliveryRange } from '@/lib/shipping';
import { memoryStore } from '@/db/memory-store';

const noStore = { 'Cache-Control': 'no-store' };
const fail = (status: number, error: string) => NextResponse.json({ error }, { status, headers: noStore });

export async function POST(req: Request) {
  const db = getDb();

  let body: unknown;
  try { body = await req.json(); } catch { return fail(400, 'Invalid JSON.'); }

  if (typeof body !== 'object' || body === null) return fail(400, 'Invalid request body.');
  const b = body as Record<string, unknown>;

  // Validate cart
  const parsed = parseQuoteRequest({ lines: b.lines, coupon: b.coupon ?? '' });
  if (!parsed.ok) return fail(400, parsed.error);

  const paymentMethod = (b.paymentMethod === 'cod' ? 'cod' : 'razorpay') as 'cod' | 'razorpay';

  // Shipping address validation
  const addr = b.shippingAddress as Record<string, unknown> | null | undefined;
  if (!addr || typeof addr.recipientName !== 'string' || typeof addr.line1 !== 'string' ||
      typeof addr.city !== 'string' || typeof addr.state !== 'string' || typeof addr.pincode !== 'string') {
    return fail(400, 'Shipping address is required.');
  }

  const email = typeof b.email === 'string' ? b.email.trim() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail(400, 'A valid email address is required.');
  }

  // Idempotency
  const idempotencyKey = typeof b.idempotencyKey === 'string' ? b.idempotencyKey : null;

  // Check if already created (idempotency)
  if (idempotencyKey) {
    if (db) {
      const existing = await db.select({ id: orders.id, orderNumber: orders.orderNumber })
        .from(orders)
        .where(eq(orders.idempotencyKey, idempotencyKey))
        .limit(1);
      if (existing.length > 0) {
        return NextResponse.json({ orderId: existing[0]!.id, orderNumber: existing[0]!.orderNumber, alreadyExists: true }, { headers: noStore });
      }
    } else {
      const existing = memoryStore.orders.find(o => o.idempotencyKey === idempotencyKey);
      if (existing) {
        return NextResponse.json({ orderId: existing.id, orderNumber: existing.orderNumber, alreadyExists: true }, { headers: noStore });
      }
    }
  }

  // Get session (optional — guests can order)
  let session: { sub: string; email: string } | null = null;
  try { session = await getSessionUser(); } catch { /* ignore */ }

  // Calculate quote
  const q = await quote(catalog, couponStore, parsed.value);
  if (q.hasIssues) {
    const blockers = q.lines.filter(l => !l.counted && l.issues.some(i => ['unavailable', 'out_of_stock'].includes(i)));
    if (blockers.length > 0) {
      return fail(409, `Some items in your bag are out of stock or unavailable. Please update your bag.`);
    }
  }

  if (q.subtotalPaise === 0) return fail(400, 'Your bag is empty.');

  // Calculate shipping
  const shipping = calculateShipping(q.subtotalPaise, paymentMethod);
  const shippingPaise = shipping.shippingPaise;
  const taxPaise = 0; // No tax for now
  const totalPaise = q.subtotalPaise - q.discountPaise + shippingPaise + taxPaise;

  // Create order in DB (one transaction that also takes the stock) or in MemoryStore
  let result: { id: string; orderNumber: number };

  if (db) {
    const counted = q.lines.filter(l => l.counted);
    await releaseExpiredOrders(db).catch(() => 0);   // give back stock held by long-unpaid online orders before checking availability
    try {
      const placed = await placeOrder(db, {
        email, phone: typeof b.phone === 'string' ? b.phone : null,
        shippingAddress: {
          recipientName: addr.recipientName as string, line1: addr.line1 as string, line2: typeof addr.line2 === 'string' ? addr.line2 : null,
          city: addr.city as string, state: addr.state as string, pincode: addr.pincode as string,
          country: typeof addr.country === 'string' ? addr.country : 'India', phone: typeof addr.phone === 'string' ? addr.phone : null,
        },
        paymentMethod, couponCode: q.coupon.ok ? q.coupon.code : null,
        lines: counted.map(l => ({ productId: l.productId, variant: l.variant, name: l.name, unitPricePaise: l.unitPricePaise, qty: l.qty, lineTotalPaise: l.lineTotalPaise })),
        subtotalPaise: q.subtotalPaise, discountPaise: q.discountPaise, shippingPaise, taxPaise, totalPaise,
        idempotencyKey, userId: session?.sub ?? null,
      });
      if (placed.alreadyExists) return NextResponse.json({ orderId: placed.id, orderNumber: placed.orderNumber, alreadyExists: true }, { headers: noStore });
      result = placed;
    } catch (e) {
      if (e instanceof OutOfStockError || e instanceof CouponUsedUpError) return fail(409, e.message);
      throw e;
    }
  } else {
    const newOrderId = `aur-ord-${crypto.randomUUID()}`;
    const newOrderNum = memoryStore.nextOrderNumber++;
    const newOrder = {
      id: newOrderId,
      orderNumber: newOrderNum,
      status: 'pending_payment',
      email: email.toLowerCase(),
      phone: typeof b.phone === 'string' ? b.phone : null,
      shippingAddress: {
        recipientName: addr.recipientName as string,
        line1: addr.line1 as string,
        line2: (addr.line2 as string) ?? null,
        city: addr.city as string,
        state: addr.state as string,
        pincode: addr.pincode as string,
        country: (addr.country as string) || 'India',
        phone: (addr.phone as string) || null,
      },
      couponCode: q.coupon.ok ? q.coupon.code : null,
      subtotalPaise: q.subtotalPaise,
      discountPaise: q.discountPaise,
      shippingPaise,
      taxPaise,
      totalPaise,
      idempotencyKey: idempotencyKey ?? null,
      userId: session?.sub ?? null,
      paymentMethod,
      paymentId: null,
      razorpayOrderId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.orders.unshift(newOrder);

    const lines = q.lines.filter(l => l.counted);
    for (const l of lines) {
      memoryStore.orderItems.push({
        id: memoryStore.nextItemId++,
        orderId: newOrderId,
        productId: l.productId,
        nameSnapshot: l.name,
        skuSnapshot: `${l.productId}${l.variant ? `-${l.variant}` : ''}`,
        optionLabelSnapshot: l.variant ? 'Size' : null,
        optionValueSnapshot: l.variant,
        unitPricePaise: l.unitPricePaise,
        qty: l.qty,
        lineTotalPaise: l.lineTotalPaise,
      });
    }

    memoryStore.orderEvents.push({
      id: memoryStore.nextEventId++,
      orderId: newOrderId,
      status: 'pending_payment',
      note: paymentMethod === 'cod' ? 'Order placed (Cash on Delivery)' : 'Order placed, awaiting payment',
      createdAt: new Date(),
    });

    result = { id: newOrderId, orderNumber: newOrderNum };
  }

  // WhatsApp: cash-on-delivery orders are confirmed right away (online orders are confirmed when the payment arrives).
  if (paymentMethod === 'cod') after(() => queueOrderMessage({ userId: session?.sub ?? null, orderNumber: result.orderNumber, status: 'placed' }).catch(console.error));

  // Send confirmation email (async, don't await)
  const delivery = estimatedDeliveryRange();
  sendOrderConfirmation({
    to: email,
    orderNumber: result.orderNumber,
    orderId: result.id,
    items: q.lines.filter(l => l.counted).map(l => ({
      name: l.name,
      qty: l.qty,
      unitPricePaise: l.unitPricePaise,
      optionValue: l.variant,
    })),
    subtotalPaise: q.subtotalPaise,
    discountPaise: q.discountPaise,
    shippingPaise,
    totalPaise,
    shippingAddress: {
      recipientName: addr.recipientName as string,
      line1: addr.line1 as string,
      line2: addr.line2 as string | null,
      city: addr.city as string,
      state: addr.state as string,
      pincode: addr.pincode as string,
      country: (addr.country as string) || 'India',
    },
    paymentMethod,
    estimatedDelivery: delivery,
  }).catch(console.error);

  return NextResponse.json(
    { orderId: result.id, orderNumber: result.orderNumber },
    { status: 201, headers: noStore }
  );
}
