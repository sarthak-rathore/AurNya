import { after, NextResponse } from 'next/server';
import { queueOrderMessageById } from '@/lib/whatsapp';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getDb } from '@/db/client';
import { orders, orderEvents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendOrderStatusUpdate } from '@/lib/email';

const noStore = { 'Cache-Control': 'no-store' };

/**
 * Client-side payment verification.
 * POST /api/payments/razorpay/verify
 * Body: { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
 *
 * Razorpay signs the order with HMAC-SHA256. We verify on the server before marking order as paid.
 */
export async function POST(req: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: 'Payment verification not configured.' }, { status: 503, headers: noStore });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body as {
    orderId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  };

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: 'Missing payment verification fields.' }, { status: 400 });
  }

  // Verify signature
  const expectedSig = createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const a = Buffer.from(expectedSig); const b = Buffer.from(String(razorpaySignature));
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    console.error('[razorpay] Signature mismatch for order', orderId);
    return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400, headers: noStore });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ error: 'Database not available.' }, { status: 503 });

  // The signed payment must belong to THIS order. Without this check, a small valid payment could be used to mark any other order as paid.
  const [current] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!current || current.razorpayOrderId !== razorpayOrderId) {
    console.error('[razorpay] payment does not belong to order', orderId);
    return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400, headers: noStore });
  }
  if (current.status !== 'pending_payment') {
    // Already paid (for example the webhook got there first): that is success. Anything else needs a human.
    if (current.status === 'paid') return NextResponse.json({ ok: true, orderId }, { headers: noStore });
    return NextResponse.json({ error: 'This order is no longer open for payment. Please contact us with your payment reference.' }, { status: 409, headers: noStore });
  }

  // Update order
  await db.transaction(async (tx) => {
    await tx.update(orders).set({
      status: 'paid',
      paymentId: razorpayPaymentId,
      razorpayOrderId,
      updatedAt: new Date(),
    }).where(eq(orders.id, orderId));

    await tx.insert(orderEvents).values({
      orderId,
      status: 'paid',
      note: `Payment verified. Razorpay Payment ID: ${razorpayPaymentId}`,
    });
  });

  // Fetch order for email
  const [order] = await db.select({ email: orders.email, orderNumber: orders.orderNumber })
    .from(orders).where(eq(orders.id, orderId)).limit(1);
  if (order) {
    sendOrderStatusUpdate(order.email, order.orderNumber, 'paid', {}, orderId).catch(console.error);
    after(() => queueOrderMessageById(orderId, 'paid'));
  }

  return NextResponse.json({ ok: true, orderId }, { headers: noStore });
}
