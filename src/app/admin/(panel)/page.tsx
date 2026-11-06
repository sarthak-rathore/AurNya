import Link from 'next/link';
import { Card, Money, NeedsDatabase, PageHeader, Stat, StatusBadge, td, th } from '@/components/admin/ui';
import { dashboardStats } from '@/db/admin-stats';
import { getDb } from '@/db/client';
import { releaseExpiredOrders } from '@/db/inventory';
import { formatIstDateTime } from '@/lib/admin-format';
import type { OrderStatus } from '@/lib/order-status';
import { formatINR } from '@/lib/money';
import { requireAdminPage } from '@/lib/admin-auth';

export const metadata = { title: 'Dashboard' };
export default async function Dashboard() {
  await requireAdminPage();   // the sign-in check must come first: pages build in parallel with their layout
  const db = getDb();
  if (!db) return <><PageHeader title="Dashboard" /><NeedsDatabase /></>;
  await releaseExpiredOrders(db).catch(() => 0);   // keeps stock honest whenever the owner opens the dashboard
  const s = await dashboardStats(db);
  const max = Math.max(1, ...s.days.map((d) => d.paise));
  return (
    <>
      <PageHeader title="Dashboard" sub="How the shop is doing. Sales count paid, packed, shipped and delivered orders." />
      {s.attention.length > 0 && (
        <div role="alert" className="mb-6 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm">
          <p className="font-medium text-danger">A customer paid for an order that is cancelled</p>
          <ul className="mt-1 list-disc pl-5">{s.attention.map((a) => <li key={a.id}><Link className="underline" href={`/admin/orders/${a.id}`}>Order #{a.orderNumber}</Link> ({formatINR(a.totalPaise)}): refund it in Razorpay, or place the order again for the customer.</li>)}</ul>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sales today" value={formatINR(s.todayPaise)} hint={`${s.todayOrders} order${s.todayOrders === 1 ? '' : 's'}`} />
        <Stat label="Last 30 days" value={formatINR(s.monthPaise)} hint={`${s.monthOrders} orders`} />
        <Stat label="To pack" value={s.toPack} hint="Paid, not packed yet" href="/admin/orders?status=paid" tone={s.toPack ? 'text-gold-ink' : ''} />
        <Stat label="To ship" value={s.toShip} hint="Packed, waiting for the courier" href="/admin/orders?status=packed" tone={s.toShip ? 'text-gold-ink' : ''} />
        <Stat label="Cash on delivery to confirm" value={s.codToConfirm} hint="Call or message the customer" href="/admin/orders?status=pending_payment" />
        <Stat label="Awaiting online payment" value={s.awaitingPayment - s.codToConfirm} hint="Released automatically after an hour" />
        <Stat label="Low or sold out" value={s.lowStockCount} hint="Items with 5 or fewer left" href="/admin/inventory?filter=low" tone={s.lowStockCount ? 'text-danger' : ''} />
        <Stat label="Products" value={s.productCount} href="/admin/products" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card title="Sales, last 14 days">
          <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Bar chart of daily sales for the last 14 days">
            {s.days.map((d) => <div key={d.day} className="group relative flex h-full flex-1 items-end" title={`${d.day}: ${formatINR(d.paise)} (${d.n} orders)`}><div className="w-full rounded-t bg-gold-ink/70 group-hover:bg-gold-ink" style={{ height: `${Math.max(d.paise ? 4 : 1, (d.paise / max) * 100)}%` }} /></div>)}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted"><span>{s.days[0].day.slice(5)}</span><span>{s.days[13].day.slice(5)}</span></div>
        </Card>
        <Card title="Best sellers (30 days)">
          {s.top.length === 0 ? <p className="text-sm text-muted">No sales yet.</p> : <ol className="space-y-2 text-sm">{s.top.map((t) => <li key={t.name} className="flex justify-between gap-3"><span className="truncate">{t.name}</span><span className="shrink-0 text-muted">{t.qty} sold · {formatINR(t.paise)}</span></li>)}</ol>}
        </Card>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card title="Latest orders" action={<Link href="/admin/orders" className="text-xs uppercase tracking-widest underline">All orders</Link>}>
          {s.recent.length === 0 ? <p className="text-sm text-muted">No orders yet.</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className={th}>Order</th><th className={th}>When</th><th className={th}>Total</th><th className={th}>Status</th></tr></thead><tbody className="divide-y divide-charcoal/10">
              {s.recent.map((o) => <tr key={o.id}><td className={td}><Link className="font-medium underline" href={`/admin/orders/${o.id}`}>#{o.orderNumber}</Link></td><td className={`${td} text-muted`}>{formatIstDateTime(o.createdAt)}</td><td className={td}><Money paise={o.totalPaise} /></td><td className={td}><StatusBadge status={o.status as OrderStatus} /></td></tr>)}
            </tbody></table></div>)}
        </Card>
        <Card title="Running low" action={<Link href="/admin/inventory" className="text-xs uppercase tracking-widest underline">Inventory</Link>}>
          {s.lowStock.length === 0 ? <p className="text-sm text-muted">Everything is well stocked.</p> : <ul className="space-y-2 text-sm">{s.lowStock.map((l) => <li key={l.key} className="flex justify-between gap-3"><Link className="truncate underline" href={`/admin/products/${l.productId}`}>{l.name}{l.option ? ` · ${l.option}` : ''}</Link><span className={`shrink-0 ${l.stock === 0 ? 'text-danger' : 'text-gold-ink'}`}>{l.stock === 0 ? 'Sold out' : `${l.stock} left`}</span></li>)}</ul>}
        </Card>
      </div>
    </>
  );
}
