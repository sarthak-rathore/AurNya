import Link from 'next/link';
import { Card, Money, Pager, StatusBadge, td, th } from '@/components/admin/ui';
import { listOrders, ORDER_PAGE_SIZE } from '@/db/admin-orders';
import type { Db } from '@/db/client';
import { formatIstDateTime } from '@/lib/admin-format';
import { ORDER_STATUSES, STATUS_LABEL, isOrderStatus } from '@/lib/order-status';

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

/** The real orders table (shown whenever a database is connected). Every row opens that order's own page. */
export async function OrdersLive({ db, base, sp }: { db: Db; base: '/owner' | '/admin' | '/manager'; sp: SP }) {
  const q = one(sp.q).trim().slice(0, 80);
  const status = one(sp.status); const page = Math.max(1, Number(one(sp.page)) || 1);
  const res = await listOrders(db, { q, status: isOrderStatus(status) ? status : undefined, page, pageSize: ORDER_PAGE_SIZE });
  const href = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams(); const m = { q, status, page: 1, ...over };
    for (const [k, v] of Object.entries(m)) if (v !== undefined && v !== '' && !(k === 'page' && Number(v) === 1)) p.set(k, String(v));
    const s = p.toString(); return `${base}/orders${s ? `?${s}` : ''}`;
  };
  const chip = (active: boolean) => `rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors ${active ? 'bg-[#D4A843] text-[#14121A] font-bold' : 'border border-white/10 text-[#C7C0D2] hover:bg-white/5'}`;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-white">Orders Management</h1>
          <p className="text-xs text-[#968E9F] mt-0.5">{res.total} order{res.total === 1 ? '' : 's'} {status || q ? 'match your filter' : 'in total'} · live from your database</p>
        </div>
        <a href={`/api/admin/orders/export${status || q ? `?${new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}) })}` : ''}`}
          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2.5 transition-colors">⬇ Export CSV</a>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Link href={href({ status: '' })} className={chip(!status)}>All ({res.counts.all ?? 0})</Link>
          {ORDER_STATUSES.map((s) => <Link key={s} href={href({ status: s })} className={chip(status === s)}>{STATUS_LABEL[s]} ({res.counts[s] ?? 0})</Link>)}
        </div>
        <form role="search" className="w-full sm:w-72">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Search number, name, email, phone…" className="w-full rounded-xl border border-white/10 bg-[#181521] px-3.5 py-1.5 text-xs text-white placeholder-[#5E566A] focus:outline-none focus:border-[#D4A843]" />
        </form>
      </div>
      <Card className="!p-0">
        {res.rows.length === 0 ? <p className="p-6 text-xs text-[#8E869B]">No orders match.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-xs">
            <thead><tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Items</th><th className={th}>Total</th><th className={th}>Payment</th><th className={th}>Status</th><th className={th}>Placed (IST)</th><th className={th}><span className="sr-only">Open</span></th></tr></thead>
            <tbody className="divide-y divide-white/5">
              {res.rows.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02]">
                  <td className={`${td} font-bold text-[#D4A843]`}>#{r.orderNumber}</td>
                  <td className={td}><div className="font-medium">{r.recipient ?? '—'}</div><div className="text-[11px] text-[#736B7F]">{r.email}</div></td>
                  <td className={td}>{r.itemCount}</td>
                  <td className={td}><Money paise={r.totalPaise} /></td>
                  <td className={td}>{r.paymentMethod === 'cod' ? 'Cash on delivery' : 'Online'}</td>
                  <td className={td}><StatusBadge status={r.status} /></td>
                  <td className={`${td} whitespace-nowrap text-[#736B7F]`}>{formatIstDateTime(r.createdAt)}</td>
                  <td className={`${td} text-right`}><Link href={`${base}/orders/${r.id}`} className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-medium text-[#C7C0D2] hover:text-white hover:bg-white/10">View</Link></td>
                </tr>
              ))}
            </tbody></table></div>
        )}
      </Card>
      <Pager page={res.page} pages={res.pages} href={(p) => href({ page: p })} />
    </div>
  );
}
