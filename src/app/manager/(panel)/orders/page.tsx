import { requireRole } from '@/lib/role-auth';
import { OrdersLive } from '@/components/admin/orders-live';
import { OrdersClient, type OrderItem } from '@/components/admin/orders-client';
import { getDb } from '@/db/client';
import { readSection } from '@/db/sections';
import { DUMMY_RECENT_ORDERS } from '@/lib/admin-dummy';

export const metadata = { title: 'Orders' };
type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function Orders({ searchParams }: { searchParams: SP }) {
  await requireRole('manager');
  const db = getDb();
  // Real orders whenever a database is connected.
  if (db) return <OrdersLive db={db} base="/manager" sp={await searchParams} />;

  // Demo mode: sample orders. Status changes are saved (and, for admin/manager, sent for owner approval) like everything else.
  const overrides = await readSection<Record<string, string>>(null, 'orders-demo', {});
  const initialOrders: OrderItem[] = DUMMY_RECENT_ORDERS.map((o) => ({
    id: o.id, customer: o.customer, item: o.items, amount: o.amount * 100, payment: o.payment,
    status: overrides[o.id] ?? o.status, date: o.date, type: o.paymentType,
  }));
  return <OrdersClient initial={initialOrders} overrides={overrides} role="manager" />;
}
