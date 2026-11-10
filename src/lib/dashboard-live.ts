import { eq, sql } from 'drizzle-orm';
import { dashboardStats } from '@/db/admin-stats';
import { getDb } from '@/db/client';
import { users } from '@/db/schema';
import type { LiveTotals, LiveRecentOrder } from '@/components/admin/dashboard-client';
import { formatINR } from './money';
import { isDemoMode } from './demo-mode';

export type { LiveTotals, LiveRecentOrder };

/**
 * Real numbers and order metrics for the dashboard.
 * When a real database is connected:
 *   Returns live metrics directly from PostgreSQL (even if store is brand new with 0 orders).
 * When running in demo mode without a DB:
 *   Returns undefined so the dashboard can display sample visual preview cards.
 */
export async function liveTotals(): Promise<LiveTotals | undefined> {
  const db = getDb();
  if (!db) return undefined;

  try {
    const s = await dashboardStats(db);
    const [c] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(users)
      .where(isDemoMode() ? sql`true` : eq(users.isDemo, false));
    const customerCount = c?.n ?? 0;

    const recentOrders: LiveRecentOrder[] = s.recent.map((o) => ({
      id: `#AN${o.orderNumber}`,
      customer: o.email.split('@')[0],
      item: 'Jewellery Piece',
      icon: '💍',
      amount: formatINR(o.totalPaise),
      payment: ['paid', 'packed', 'shipped', 'delivered'].includes(o.status) ? 'Paid ✓' : 'Pending',
      status: o.status === 'delivered' ? 'Delivered' : o.status === 'cancelled' ? 'Cancelled' : 'Processing',
      date: new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
    }));

    const totalOrders = s.monthOrders || s.recent.length;
    const deliveredCount = s.recent.filter((r) => r.status === 'delivered').length;
    const processingCount = s.toPack + s.toShip;
    const cancelledCount = s.recent.filter((r) => r.status === 'cancelled').length;
    const returnedCount = s.recent.filter((r) => r.status === 'refunded').length;

    const inStock = Math.max(0, s.productCount - s.lowStockCount);

    return {
      collection: formatINR(s.monthPaise),
      orders: String(s.monthOrders),
      aov: s.monthOrders > 0 ? formatINR(Math.round(s.monthPaise / s.monthOrders)) : '₹0',
      customers: String(customerCount),
      products: String(s.productCount),
      lowStock: s.lowStockCount,
      isRealDb: true,
      recentOrders,
      orderOverview: {
        total: totalOrders,
        delivered: { count: deliveredCount, percent: totalOrders > 0 ? `${Math.round((deliveredCount / totalOrders) * 100)}%` : '0%' },
        processing: { count: processingCount, percent: totalOrders > 0 ? `${Math.round((processingCount / totalOrders) * 100)}%` : '0%' },
        cancelled: { count: cancelledCount, percent: totalOrders > 0 ? `${Math.round((cancelledCount / totalOrders) * 100)}%` : '0%' },
        returned: { count: returnedCount, percent: totalOrders > 0 ? `${Math.round((returnedCount / totalOrders) * 100)}%` : '0%' },
      },
      paymentSummary: {
        totalCollection: formatINR(s.monthPaise),
        successful: formatINR(s.monthPaise),
        pending: formatINR(s.todayPaise),
        refunds: '₹0',
      },
      inventoryStatus: {
        total: String(s.productCount),
        inStock: String(inStock),
        lowStock: String(s.lowStockCount),
        outOfStock: '0',
      },
    };
  } catch (err) {
    console.error('liveTotals calculation error:', err);
    return undefined;
  }
}
