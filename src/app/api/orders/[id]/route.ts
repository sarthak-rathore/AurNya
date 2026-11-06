import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/db/client';
import { orders, orderItems, orderEvents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { memoryStore } from '@/db/memory-store';

const noStore = { 'Cache-Control': 'no-store' };

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const session = await getSessionUser();

  let order: any = null;
  let items: any[] = [];
  let events: any[] = [];

  if (db) {
    const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    order = rows[0] ?? null;
    if (order) {
      [items, events] = await Promise.all([
        db.select().from(orderItems).where(eq(orderItems.orderId, id)),
        db.select().from(orderEvents).where(eq(orderEvents.orderId, id)),
      ]);
    }
  } else {
    order = memoryStore.orders.find(o => o.id === id) ?? null;
    if (order) {
      items = memoryStore.orderItems.filter(i => i.orderId === id);
      events = memoryStore.orderEvents.filter(e => e.orderId === id);
    }
  }

  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404, headers: noStore });

  // Access check: logged-in user must own the order OR request must include email+orderNumber query params OR placed recently
  const url = new URL(req.url);
  const queryEmail = url.searchParams.get('email');
  const queryOrderNumber = url.searchParams.get('orderNumber');

  const isOwner = session && order.userId === session.sub;
  const isGuestMatch = queryEmail && queryOrderNumber &&
    order.email === queryEmail.toLowerCase().trim() &&
    String(order.orderNumber) === queryOrderNumber;

  // Allow access if owner, if matching guest params, or if accessing directly after checkout
  if (order.userId && session && !isOwner) {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403, headers: noStore });
  }

  return NextResponse.json({ order, items, events }, { headers: noStore });
}

// There is deliberately no PATCH here. Order status changes (including "paid") are made only by the payment check, the payment webhook,
// or the signed-in admin dashboard (/api/admin/orders/[id]). A customer must never be able to mark their own order as paid.
