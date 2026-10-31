import { NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import { getDb } from '@/db/client';
import { orders, orderEvents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendOrderStatusUpdate } from '@/lib/email';

/**
 * Razorpay webhook handler.
 * POST /api/payments/razorpay/webhook
 *
 * Razorpay sends events here after payment is captured, failed, refunded etc.
 * We verify the X-Razorpay-Signature header before processing.
 */
export async function POST(req: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Webhook not configured — return 200 so Razorpay stops retrying
    return new NextResponse(null, { status: 200 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('X-Razorpay-Signature') ?? req.headers.get('x-razorpay-signature');

  if (!signature) return new NextResponse('Missing signature', { status: 400 });

  const expectedSig = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  if (expectedSig !== signature) {
    console.error('[webhook] Razorpay signature mismatch');
    return new NextResponse('Invalid signature', { status: 400 });
  }

  let event: { event: string; payload?: Record<string, unknown> };
  try { event = JSON.parse(rawBody); } catch { return new NextResponse('Invalid JSON', { status: 400 }); }

  const db = getDb();
  if (!db) return new NextResponse('DB unavailable', { status: 503 });

  const eventType = event.event;
  const paymentEntity = (event.payload?.payment as Record<string, unknown>)?.entity as Record<string, unknown> | undefined;
  const rzpOrderId = paymentEntity?.order_id as string | undefined;
  const rzpPaymentId = paymentEntity?.id as string | undefined;

  if (!rzpOrderId) {
    console.log('[webhook] No order_id in event, skipping:', eventType);
    return new NextResponse(null, { status: 200 });
  }

  // Find our order by razorpay_order_id
  const [order] = await db.select().from(orders).where(eq(orders.razorpayOrderId, rzpOrderId)).limit(1);
  if (!order) {
    console.log('[webhook] Order not found for rzp order:', rzpOrderId);
    return new NextResponse(null, { status: 200 }); // idempotent 200
  }

  try {
    if (eventType === 'payment.captured' && order.status === 'pending_payment') {
      await db.transaction(async (tx) => {
        await tx.update(orders).set({ status: 'paid', paymentId: rzpPaymentId ?? null, updatedAt: new Date() }).where(eq(orders.id, order.id));
        await tx.insert(orderEvents).values({ orderId: order.id, status: 'paid', note: `Webhook: payment captured. Payment ID: ${rzpPaymentId}` });
      });
      sendOrderStatusUpdate(order.email, order.orderNumber, 'paid').catch(console.error);

    } else if (eventType === 'payment.failed') {
      await db.transaction(async (tx) => {
        await tx.update(orders).set({ status: 'cancelled', updatedAt: new Date() }).where(eq(orders.id, order.id));
        await tx.insert(orderEvents).values({ orderId: order.id, status: 'cancelled', note: `Webhook: payment failed. Error: ${(paymentEntity?.error_description as string) ?? 'unknown'}` });
      });

    } else if (eventType === 'refund.processed') {
      await db.transaction(async (tx) => {
        await tx.update(orders).set({ status: 'refunded', updatedAt: new Date() }).where(eq(orders.id, order.id));
        await tx.insert(orderEvents).values({ orderId: order.id, status: 'refunded', note: 'Webhook: refund processed.' });
      });
      sendOrderStatusUpdate(order.email, order.orderNumber, 'refunded').catch(console.error);
    }
  } catch (err) {
    console.error('[webhook] DB error:', err);
    return new NextResponse('Internal error', { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
