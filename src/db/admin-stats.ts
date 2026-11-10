import { and, desc, eq, gte, inArray, isNotNull, sql } from 'drizzle-orm';
import { IST_OFFSET_MS, LOW_STOCK } from '@/lib/admin-format';
import { SALE_STATUSES } from '@/lib/order-status';
import type { Db } from './client';
import { stockLines } from './admin-products';
import { orderItems, orders } from './schema';

const SALES = [...SALE_STATUSES];
const num = (v: unknown) => Number(v ?? 0);

/** Midnight at the start of today in India, as a real moment in time. */
export function startOfIstDay(now: Date, daysBack = 0): Date {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() - daysBack) - IST_OFFSET_MS);
}

export async function dashboardStats(db: Db, now = new Date()) {
  const today = startOfIstDay(now); const d30 = startOfIstDay(now, 29); const d14 = startOfIstDay(now, 13);
  const saleSum = (since: Date) => sql<number>`coalesce(sum(case when ${orders.createdAt} >= ${since} then ${orders.totalPaise} end), 0)::float8`;
  const saleCount = (since: Date) => sql<number>`coalesce(sum(case when ${orders.createdAt} >= ${since} then 1 end), 0)::int`;
  const dayKey = sql<string>`to_char(${orders.createdAt} at time zone 'Asia/Kolkata', 'YYYY-MM-DD')`;

  const [sales, byStatus, cod, series, top, recent, attention, lines] = await Promise.all([
    db.select({ todayPaise: saleSum(today), todayOrders: saleCount(today), monthPaise: saleSum(d30), monthOrders: saleCount(d30) }).from(orders).where(inArray(orders.status, SALES)),
    db.select({ status: orders.status, n: sql<number>`count(*)::int` }).from(orders).groupBy(orders.status),
    db.select({ n: sql<number>`count(*)::int` }).from(orders).where(and(eq(orders.status, 'pending_payment'), eq(orders.paymentMethod, 'cod'))),
    db.select({ day: dayKey, paise: sql<number>`sum(${orders.totalPaise})::float8`, n: sql<number>`count(*)::int` }).from(orders).where(and(inArray(orders.status, SALES), gte(orders.createdAt, d14))).groupBy(dayKey),
    db.select({ name: orderItems.nameSnapshot, qty: sql<number>`sum(${orderItems.qty})::int`, paise: sql<number>`sum(${orderItems.lineTotalPaise})::float8` })
      .from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).where(and(inArray(orders.status, SALES), gte(orders.createdAt, d30))).groupBy(orderItems.nameSnapshot).orderBy(desc(sql`sum(${orderItems.qty})`)).limit(5),
    db.select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, email: orders.email, totalPaise: orders.totalPaise, createdAt: orders.createdAt }).from(orders).orderBy(desc(orders.createdAt)).limit(8),
    // A customer paid, but the order is cancelled (for example the payment arrived after the hold time ran out). Needs the owner's eyes.
    db.select({ id: orders.id, orderNumber: orders.orderNumber, totalPaise: orders.totalPaise }).from(orders).where(and(eq(orders.status, 'cancelled'), isNotNull(orders.paymentId), eq(orders.paymentMethod, 'razorpay'))).orderBy(desc(orders.updatedAt)).limit(5),
    stockLines(db),
  ]);
  const counts: Record<string, number> = {}; for (const r of byStatus) counts[r.status] = num(r.n);
  const map = new Map(series.map((s) => [s.day, { paise: num(s.paise), n: num(s.n) }]));
  const days: { day: string; paise: number; n: number }[] = [];
  for (let i = 13; i >= 0; i--) { const key = new Date(startOfIstDay(now, i).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10); days.push({ day: key, ...(map.get(key) ?? { paise: 0, n: 0 }) }); }
  const live = lines.filter((l) => l.status === 'active');
  return {
    todayPaise: num(sales[0]?.todayPaise), todayOrders: num(sales[0]?.todayOrders), monthPaise: num(sales[0]?.monthPaise), monthOrders: num(sales[0]?.monthOrders),
    toPack: counts.paid ?? 0, toShip: counts.packed ?? 0, awaitingPayment: counts.pending_payment ?? 0, codToConfirm: num(cod[0]?.n),
    days, top: top.map((t) => ({ name: t.name, qty: num(t.qty), paise: num(t.paise) })), recent, attention,
    lowStock: live.filter((l) => l.stock <= LOW_STOCK).sort((a, b) => a.stock - b.stock).slice(0, 12), lowStockCount: live.filter((l) => l.stock <= LOW_STOCK).length,
    productCount: new Set(lines.map((l) => l.productId)).size,
  };
}
export type DashboardStats = Awaited<ReturnType<typeof dashboardStats>>;
