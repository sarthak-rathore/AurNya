import Link from 'next/link';
import { Card, Money, NeedsDatabase, PageHeader, Pager, StatusBadge, btnOutline, input, qs, td, th } from '@/components/admin/ui';
import { listOrders } from '@/db/admin-orders';
import { getDb } from '@/db/client';
import { formatIstDateTime } from '@/lib/admin-format';
import { isOrderStatus, ORDER_STATUSES, STATUS_LABEL } from '@/lib/order-status';
import { requireAdminPage } from '@/lib/admin-auth';

export const metadata = { title: 'Orders' };
type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function Orders({ searchParams }: { searchParams: SP }) {
  await requireAdminPage();   // the sign-in check must come first: pages build in parallel with their layout
  const db = getDb(); if (!db) return <><PageHeader title="Orders" /><NeedsDatabase /></>;
  const sp = await searchParams; const status = one(sp.status); const q = one(sp.q).slice(0, 80); const page = Math.max(1, Number(one(sp.page)) || 1);
  const st = isOrderStatus(status) ? status : undefined;
  const { rows, total, pages, counts } = await listOrders(db, { status: st, q, page });
  const tab = (key: string, text: string) => <Link key={key} href={`/admin/orders${qs({ status: key === 'all' ? '' : key, q })}`} aria-current={(st ?? 'all') === key ? 'page' : undefined} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${(st ?? 'all') === key ? 'bg-charcoal text-ivory' : 'border border-charcoal/20 hover:bg-charcoal/5'}`}>{text} <span className="opacity-60">{counts[key] ?? 0}</span></Link>;
  return (
    <>
      <PageHeader title="Orders" sub={`${total} order${total === 1 ? '' : 's'}${q ? ` matching “${q}”` : ''}`}
        actions={<a className={btnOutline} href={`/api/admin/orders/export${qs({ status: st, q })}`}>Download CSV</a>} />
      <form className="mb-4 flex gap-2" role="search"><input type="hidden" name="status" value={st ?? ''} /><input name="q" defaultValue={q} placeholder="Search order number, name, email, phone or tracking number" aria-label="Search orders" className={input} /><button className={btnOutline} type="submit">Search</button></form>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Filter by status">{tab('all', 'All')}{ORDER_STATUSES.map((s) => tab(s, STATUS_LABEL[s]))}</div>
      <Card className="!p-0">
        {rows.length === 0 ? <p className="p-6 text-sm text-muted">No orders here.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className={th}>Order</th><th className={th}>Placed (IST)</th><th className={th}>Customer</th><th className={th}>Items</th><th className={th}>Total</th><th className={th}>Payment</th><th className={th}>Status</th></tr></thead><tbody className="divide-y divide-charcoal/10">
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-charcoal/[.03]">
                <td className={td}><Link className="font-medium underline" href={`/admin/orders/${o.id}`}>#{o.orderNumber}</Link></td>
                <td className={`${td} whitespace-nowrap text-muted`}>{formatIstDateTime(o.createdAt)}</td>
                <td className={td}><span className="block">{o.recipient ?? '—'}</span><span className="block text-xs text-muted">{o.email}</span></td>
                <td className={td}>{o.itemCount}</td><td className={td}><Money paise={o.totalPaise} /></td>
                <td className={td}>{o.paymentMethod === 'cod' ? 'Cash on delivery' : 'Online'}</td><td className={td}><StatusBadge status={o.status} /></td>
              </tr>))}
          </tbody></table></div>)}
      </Card>
      <Pager page={page} pages={pages} href={(p) => `/admin/orders${qs({ status: st, q, page: p })}`} />
    </>
  );
}
