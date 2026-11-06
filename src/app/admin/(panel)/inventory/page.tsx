import Link from 'next/link';
import { Card, NeedsDatabase, PageHeader, btnOutline, input } from '@/components/admin/ui';
import { stockLines } from '@/db/admin-products';
import { getDb } from '@/db/client';
import { StockTable } from './stock-table';
import { requireAdminPage } from '@/lib/admin-auth';

export const metadata = { title: 'Inventory' };
type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function Inventory({ searchParams }: { searchParams: SP }) {
  await requireAdminPage();   // the sign-in check must come first: pages build in parallel with their layout
  const db = getDb(); if (!db) return <><PageHeader title="Inventory" /><NeedsDatabase /></>;
  const sp = await searchParams; const q = one(sp.q).slice(0, 80); const f = one(sp.filter);
  const filter = f === 'low' || f === 'out' ? f : undefined;
  const lines = await stockLines(db, { q, filter });
  const tab = (key: string, text: string) => <Link key={key} href={`/admin/inventory${key ? `?filter=${key}` : ''}`} aria-current={(filter ?? '') === key ? 'page' : undefined} className={`rounded-full px-4 py-1.5 text-sm ${(filter ?? '') === key ? 'bg-charcoal text-ivory' : 'border border-charcoal/20 hover:bg-charcoal/5'}`}>{text}</Link>;
  return (
    <>
      <PageHeader title="Inventory" sub="Type the exact number you counted and press Save, or use + / − for a delivery or a manual sale. Orders from the shop take stock automatically." />
      <form className="mb-4 flex gap-2" role="search"><input type="hidden" name="filter" value={filter ?? ''} /><input name="q" defaultValue={q} placeholder="Search name, SKU or size" aria-label="Search inventory" className={input} /><button className={btnOutline} type="submit">Search</button></form>
      <div className="mb-4 flex flex-wrap gap-2">{tab('', 'Everything')}{tab('low', 'Low stock (5 or fewer)')}{tab('out', 'Sold out')}</div>
      <Card className="!p-0">{lines.length === 0 ? <p className="p-6 text-sm text-muted">Nothing here.</p> : <StockTable lines={lines.map((l) => ({ key: l.key, productId: l.productId, variantId: l.variantId, name: l.name, sku: l.sku, option: l.option, stock: l.stock, status: l.status }))} />}</Card>
    </>
  );
}
