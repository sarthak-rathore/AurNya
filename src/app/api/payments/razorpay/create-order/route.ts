import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/db/client';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createHmac } from 'node:crypto';

const noStore = { 'Cache-Control': 'no-store' };

/**
 * Creates a Razorpay order.
 * POST /api/payments/razorpay/create-order
 * Body: { orderId: string } — our internal order ID
 *
 * Returns { razorpayOrderId, amount, currency, keyId } for the frontend.
 */
export async function POST(req: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json({ error: 'Razorpay is not configured on this server.' }, { status: 503, headers: noStore });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ error: 'Database not available.' }, { status: 503, headers: noStore });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  const { orderId } = body as { orderId?: string };
  if (!orderId) return NextResponse.json({ error: 'orderId required.' }, { status: 400 });

  // Fetch order
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404, headers: noStore });
  if (order.status !== 'pending_payment') {
    return NextResponse.json({ error: 'Order is already paid or cancelled.' }, { status: 409, headers: noStore });
  }

  // Create Razorpay order via REST API
  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: order.totalPaise, // Razorpay uses paise natively
      currency: 'INR',
      receipt: `aur-${order.orderNumber}`,
      notes: { internalOrderId: order.id },
    }),
  });

  if (!rzpRes.ok) {
    const err = await rzpRes.text();
    console.error('[razorpay] create order error:', err);
    return NextResponse.json({ error: 'Could not create payment order. Please try again.' }, { status: 502, headers: noStore });
  }

  const rzpOrder = await rzpRes.json() as { id: string };

  // Save razorpayOrderId to our order
  await db.update(orders).set({ razorpayOrderId: rzpOrder.id, updatedAt: new Date() }).where(eq(orders.id, orderId));

  return NextResponse.json({
    razorpayOrderId: rzpOrder.id,
    amount: order.totalPaise,
    currency: 'INR',
    keyId,
  }, { headers: noStore });
}
