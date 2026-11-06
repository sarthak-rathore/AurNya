import Link from 'next/link';
import { Card, Money, NeedsDatabase, PageHeader, Pager, btnOutline, btnPrimary, input, qs, td, th } from '@/components/admin/ui';
import { Thumb } from '@/components/admin/image-picker';
import { listProducts } from '@/db/admin-products';
import { getDb } from '@/db/client';
import { site } from '@/config/site';
import { RowStatus } from './row-status';
import { requireAdminPage } from '@/lib/admin-auth';

export const metadata = { title: 'Products' };
type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function Products({ searchParams }: { searchParams: SP }) {
  await requireAdminPage();   // the sign-in check must come first: pages build in parallel with their layout
  const db = getDb(); if (!db) return <><PageHeader title="Products" /><NeedsDatabase /></>;
  const sp = await searchParams; const q = one(sp.q).slice(0, 80); const status = one(sp.status); const category = one(sp.category); const stock = one(sp.stock); const page = Math.max(1, Number(one(sp.page)) || 1);
  const st = status === 'draft' || status === 'active' || status === 'archived' ? status : undefined;
  const { rows, total, pages, counts } = await listProducts(db, { q, status: st, category: (site.categories as readonly string[]).includes(category) ? category : undefined, stock: stock === 'low' || stock === 'out' ? stock : undefined, page });
  const tab = (key: string, text: string) => <Link key={key} href={`/admin/products${qs({ status: key === 'all' ? '' : key, q, category, stock })}`} aria-current={(st ?? 'all') === key ? 'page' : undefined} className={`rounded-full px-4 py-1.5 text-sm ${(st ?? 'all') === key ? 'bg-charcoal text-ivory' : 'border border-charcoal/20 hover:bg-charcoal/5'}`}>{text} <span className="opacity-60">{counts[key] ?? 0}</span></Link>;
  return (
    <>
      <PageHeader title="Products" sub={`${total} product${total === 1 ? '' : 's'}`} actions={<Link href="/admin/products/new" className={btnPrimary}>+ New product</Link>} />
      <form className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
        <input type="hidden" name="status" value={st ?? ''} />
        <input name="q" defaultValue={q} placeholder="Search name, SKU or slug" aria-label="Search products" className={input} />
        <select name="category" defaultValue={category} aria-label="Category" className={input}><option value="">All categories</option>{site.categories.map((c) => <option key={c}>{c}</option>)}</select>
        <select name="stock" defaultValue={stock} aria-label="Stock" className={input}><option value="">Any stock</option><option value="low">Low stock</option><option value="out">Sold out</option></select>
        <button className={btnOutline} type="submit">Filter</button>
      </form>
      <div className="mb-4 flex flex-wrap gap-2">{tab('all', 'All')}{tab('active', 'Active')}{tab('draft', 'Draft')}{tab('archived', 'Archived')}</div>
      <Card className="!p-0">
        {rows.length === 0 ? <p className="p-6 text-sm text-muted">No products match. <Link className="underline" href="/admin/products/new">Add one</Link>.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className={th}><span className="sr-only">Picture</span></th><th className={th}>Product</th><th className={th}>Category</th><th className={th}>Price</th><th className={th}>Stock</th><th className={th}>Status</th></tr></thead><tbody className="divide-y divide-charcoal/10">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-charcoal/[.03]">
                <td className={td}>{r.image ? <Thumb src={r.image} size={48} /> : <span className="block h-12 w-12 rounded-lg bg-charcoal/10" />}</td>
                <td className={td}><Link className="font-medium underline" href={`/admin/products/${r.id}`}>{r.name}</Link><span className="block text-xs text-muted">{r.sku}{r.isDemo ? ' · sample' : ''}</span></td>
                <td className={td}>{r.category}</td><td className={td}><Money paise={r.pricePaise} /></td>
                <td className={`${td} ${r.stock === 0 ? 'text-danger' : r.stock <= 5 ? 'text-gold-ink' : ''}`}>{r.stock === 0 ? 'Sold out' : r.stock}</td>
                <td className={td}><RowStatus id={r.id} status={r.status} /></td>
              </tr>))}
          </tbody></table></div>)}
      </Card>
      <Pager page={page} pages={pages} href={(p) => `/admin/products${qs({ status: st, q, category, stock, page: p })}`} />
    </>
  );
}
