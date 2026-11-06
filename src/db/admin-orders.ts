import { and, asc, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import type { OrderAction } from '@/lib/admin-schemas';
import { canTransition, isOrderStatus, ORDER_STATUSES, STATUS_LABEL, type OrderStatus, type PayMethod } from '@/lib/order-status';
import { audit } from './admin-audit';
import { AdminError } from './admin-errors';
import type { Db } from './client';
import { releaseHolds } from './inventory';
import { orderEvents, orderItems, orders, users } from './schema';

export const ORDER_PAGE_SIZE = 25;
const like = (s: string) => `%${s.replace(/[\\%_]/g, '\\$&')}%`;
const recipient = sql<string | null>`${orders.shippingAddress}->>'recipientName'`;

export interface OrderListQuery { status?: OrderStatus; q?: string; page?: number; pageSize?: number }
export interface OrderListRow { id: string; orderNumber: number; status: OrderStatus; email: string; phone: string | null; recipient: string | null; totalPaise: number; paymentMethod: PayMethod; itemCount: number; createdAt: Date }

function filters(q: OrderListQuery): SQL | undefined {
  const parts: (SQL | undefined)[] = [];
  if (q.status) parts.push(eq(orders.status, q.status));
  const term = (q.q ?? '').trim().replace(/^#/, '');
  if (term) {
    const num = /^\d{1,9}$/.test(term) ? Number(term) : null;
    parts.push(or(num !== null ? eq(orders.orderNumber, num) : undefined, ilike(orders.email, like(term)), ilike(recipient, like(term)), ilike(orders.phone, like(term)), ilike(orders.trackingNumber, like(term))));
  }
  return and(...parts);
}

export async function listOrders(db: Db, q: OrderListQuery = {}): Promise<{ rows: OrderListRow[]; total: number; page: number; pages: number; counts: Record<string, number> }> {
  const size = q.pageSize ?? ORDER_PAGE_SIZE; const page = Math.max(1, Math.floor(q.page ?? 1)); const where = filters(q);
  const [rows, total, byStatus] = await Promise.all([
    db.select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, email: orders.email, phone: orders.phone, recipient, totalPaise: orders.totalPaise, paymentMethod: orders.paymentMethod, createdAt: orders.createdAt,
      itemCount: sql<number>`coalesce((select sum(oi.qty)::int from order_items oi where oi.order_id = "orders"."id"), 0)` })
      .from(orders).where(where).orderBy(desc(orders.createdAt), desc(orders.orderNumber)).limit(size).offset((page - 1) * size),
    db.select({ n: sql<number>`count(*)::int` }).from(orders).where(where),
    db.select({ status: orders.status, n: sql<number>`count(*)::int` }).from(orders).where(filters({ ...q, status: undefined })).groupBy(orders.status),
  ]);
  const counts: Record<string, number> = { all: 0 }; for (const s of ORDER_STATUSES) counts[s] = 0;
  for (const r of byStatus) { counts[r.status] = Number(r.n); counts.all += Number(r.n); }
  const n = Number(total[0]?.n ?? 0);
  return { rows: rows.map((r) => ({ ...r, itemCount: Number(r.itemCount), paymentMethod: (r.paymentMethod === 'cod' ? 'cod' : 'razorpay') as PayMethod })), total: n, page, pages: Math.max(1, Math.ceil(n / size)), counts };
}

export async function getOrderDetail(db: Db, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;   // not a UUID: cannot exist (also stops a database error)
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;
  const [items, events, account] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)).orderBy(asc(orderItems.id)),
    db.select().from(orderEvents).where(eq(orderEvents.orderId, id)).orderBy(asc(orderEvents.createdAt), asc(orderEvents.id)),
    order.userId ? db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName }).from(users).where(eq(users.id, order.userId)).limit(1) : Promise.resolve([]),
  ]);
  return { order, items, events, account: account[0] ?? null };
}
export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderDetail>>>;

/** Every order matching the filters, for the CSV export (capped so one click cannot overload the server). */
export async function exportOrders(db: Db, q: OrderListQuery = {}) {
  const rows = await db.select().from(orders).where(filters(q)).orderBy(desc(orders.createdAt)).limit(5000);
  const items = rows.length ? await db.select().from(orderItems).orderBy(asc(orderItems.id)) : [];
  const byOrder = new Map<string, string[]>();
  for (const it of items) { const l = byOrder.get(it.orderId) ?? []; l.push(`${it.nameSnapshot}${it.optionValueSnapshot ? ` (${it.optionLabelSnapshot ?? 'Option'} ${it.optionValueSnapshot})` : ''} x${it.qty}`); byOrder.set(it.orderId, l); }
  return rows.map((o) => ({ o, items: (byOrder.get(o.id) ?? []).join('; ') }));
}

export interface TransitionResult { orderNumber: number; email: string; from: OrderStatus; to: OrderStatus; courier: string | null; trackingNumber: string | null; trackingUrl: string | null; paymentId: string | null; paymentMethod: PayMethod; totalPaise: number }

type StatusAction = Extract<OrderAction, { action: 'status' }>;

/**
 * Moves an order to a new status. Everything happens in one transaction: the status, the timeline entry, and giving stock back on a cancel.
 * Refusing an impossible move (for example "delivered" before "shipped") is done here, not only in the screen, so it can never be bypassed.
 */
export async function transitionOrder(db: Db, id: string, a: StatusAction, actor: string): Promise<TransitionResult> {
  const result = await db.transaction(async (tx0) => {
    const tx = tx0 as unknown as Db;
    const [o] = await tx.select().from(orders).where(eq(orders.id, id)).for('update').limit(1);
    if (!o) throw new AdminError(404, 'That order was not found.');
    const from = o.status as OrderStatus; const method = (o.paymentMethod === 'cod' ? 'cod' : 'razorpay') as PayMethod;
    if (!isOrderStatus(from) || !canTransition(from, a.to, method)) throw new AdminError(409, `An order that is "${STATUS_LABEL[from]}" cannot be changed to "${STATUS_LABEL[a.to]}".`);
    if (a.to === 'shipped' && !a.courier) throw new AdminError(400, 'Please say which courier is carrying this order.');

    const set: Partial<typeof orders.$inferInsert> = { status: a.to, updatedAt: new Date() };
    let note = a.note ?? '';
    if (a.to === 'shipped') {
      set.courier = a.courier; set.trackingNumber = a.trackingNumber; set.trackingUrl = a.trackingUrl;
      note = `Shipped via ${a.courier}${a.trackingNumber ? ` (tracking ${a.trackingNumber})` : ''}.${note ? ` ${note}` : ''}`;
    }
    if (a.to === 'paid') {
      if (a.paymentId) set.paymentId = a.paymentId;
      note = note || (method === 'cod' ? 'Payment received.' : 'Payment confirmed by the store.');
    }
    if (a.to === 'packed') note = note || 'Packed with care and ready to go.';
    if (a.to === 'delivered') note = note || (method === 'cod' && !o.paymentId ? 'Delivered. Cash collected.' : 'Delivered.');
    if (a.to === 'cancelled') { note = note || 'Order cancelled.'; await releaseHolds(tx, o); }
    if (a.to === 'refunded') {
      note = note || 'Refund issued.';
      if (a.restock) await releaseHolds(tx, o, { stock: true, coupon: false });
    }
    await tx.update(orders).set(set).where(eq(orders.id, id));
    await tx.insert(orderEvents).values({ orderId: id, status: a.to, note: note || null });
    return { orderNumber: o.orderNumber, email: o.email, from, to: a.to, courier: set.courier ?? o.courier, trackingNumber: set.trackingNumber ?? o.trackingNumber, trackingUrl: set.trackingUrl ?? o.trackingUrl, paymentId: set.paymentId ?? o.paymentId, paymentMethod: method, totalPaise: o.totalPaise };
  });
  await audit(db, actor, 'order-status', 'order', id, `Order #${result.orderNumber}: ${STATUS_LABEL[result.from]} → ${STATUS_LABEL[result.to]}`);
  return result;
}

/** Fixes the courier or tracking number on an order (for example after a typo). The customer sees the new details. */
export async function updateTracking(db: Db, id: string, a: Extract<OrderAction, { action: 'tracking' }>, actor: string): Promise<{ orderNumber: number }> {
  const out = await db.transaction(async (tx) => {
    const [o] = await tx.select().from(orders).where(eq(orders.id, id)).for('update').limit(1);
    if (!o) throw new AdminError(404, 'That order was not found.');
    if (o.status !== 'shipped' && o.status !== 'delivered') throw new AdminError(409, 'Tracking can be changed once the order is shipped.');
    await tx.update(orders).set({ courier: a.courier, trackingNumber: a.trackingNumber, trackingUrl: a.trackingUrl, updatedAt: new Date() }).where(eq(orders.id, id));
    await tx.insert(orderEvents).values({ orderId: id, status: o.status, note: `Tracking updated: ${a.courier}${a.trackingNumber ? ` (tracking ${a.trackingNumber})` : ''}.` });
    return { orderNumber: o.orderNumber };
  });
  await audit(db, actor, 'order-tracking', 'order', id, `Order #${out.orderNumber}: tracking updated`);
  return out;
}

export async function saveAdminNote(db: Db, id: string, adminNote: string, actor: string): Promise<void> {
  const [r] = await db.update(orders).set({ adminNote: adminNote || null, updatedAt: new Date() }).where(eq(orders.id, id)).returning({ orderNumber: orders.orderNumber });
  if (!r) throw new AdminError(404, 'That order was not found.');
  await audit(db, actor, 'order-note', 'order', id, `Order #${r.orderNumber}: private note saved`);
}
