import { sql } from 'drizzle-orm';
import { AdminShell } from '@/components/admin/shell';
import { stockLines } from '@/db/admin-products';
import { getDb } from '@/db/client';
import { orders } from '@/db/schema';
import { requireAdminPage } from '@/lib/admin-auth';
import { LOW_STOCK } from '@/lib/admin-format';

export const dynamic = 'force-dynamic';
export default async function Panel({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  let todo = 0; let low = 0;
  const db = getDb();
  if (db) {
    try {
      const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(orders).where(sql`${orders.status} in ('paid','packed') or (${orders.status} = 'pending_payment' and ${orders.paymentMethod} = 'cod')`);
      todo = Number(r?.n ?? 0);
      low = (await stockLines(db)).filter((l) => l.status === 'active' && l.stock <= LOW_STOCK).length;
    } catch { /* the menu badges are a convenience; never block the screen */ }
  }
  return <AdminShell email={admin.email} todo={todo} lowStock={low}>{children}</AdminShell>;
}
