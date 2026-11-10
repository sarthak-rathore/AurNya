import Link from 'next/link';
import { Card, PageHeader, btnOutline, input } from '@/components/admin/ui';
import { stockLines } from '@/db/admin-products';
import { getDb } from '@/db/client';
import { products } from '@/data/products';
import { StockTable } from '@/app/admin/(panel)/inventory/stock-table';

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

/** One stock screen for owner, admin and manager. Real stock when a database is connected (the person can edit it; admin/manager edits wait for the owner). */
export async function InventoryView({ base, sp }: { base: '/owner' | '/admin' | '/manager'; sp: SP }) {
  const db = getDb();
  const q = one(sp.q).toLowerCase().trim().slice(0, 80);
  const f = one(sp.filter);
  const filter = f === 'low' || f === 'out' ? f : undefined;

  type Line = { key: string; productId: number; variantId: number | null; name: string; sku: string; option: string | null; stock: number; status: string };
  let lines: Line[] = [];
  if (db) {
    try {
      lines = await stockLines(db, { q, filter });
    } catch { /* fallback */ }
  }

  // Fallback demo stock lines
  if (lines.length === 0 && !db) {
    const demoLines: Line[] = [];
    for (const p of products) {
      if (p.variants?.options) {
        for (const opt of p.variants.options) {
          const stk = p.variants?.optionStock?.[opt] ?? 0;
          demoLines.push({
            key: `${p.id}-${opt}`,
            productId: p.id,
            variantId: null,
            name: p.name,
            sku: `${p.sku}-${opt}`,
            option: `Size ${opt}`,
            stock: stk,
            status: 'active',
          });
        }
      } else {
        demoLines.push({
          key: String(p.id),
          productId: p.id,
          variantId: null,
          name: p.name,
          sku: p.sku,
          option: null,
          stock: p.stock,
          status: 'active',
        });
      }
    }

    let filtered = demoLines;
    if (q) {
      filtered = filtered.filter((l) =>
        l.name.toLowerCase().includes(q) || l.sku.toLowerCase().includes(q) || (l.option && l.option.toLowerCase().includes(q))
      );
    }
    if (filter === 'low') {
      filtered = filtered.filter((l) => l.stock > 0 && l.stock <= 5);
    } else if (filter === 'out') {
      filtered = filtered.filter((l) => l.stock === 0);
    }
    lines = filtered;
  }

  const tab = (key: string, text: string) => (
    <Link
      key={key}
      href={`${base}/inventory${key ? `?filter=${key}` : ''}`}
      aria-current={(filter ?? '') === key ? 'page' : undefined}
      className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        (filter ?? '') === key
          ? 'bg-[#D4A843] text-[#14121A] shadow-md shadow-[#D4A843]/10 font-bold'
          : 'border border-white/10 text-[#C7C0D2] hover:bg-white/5'
      }`}
    >
      {text}
    </Link>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-white">Variants &amp; Inventory</h1>
          <p className="text-xs text-[#968E9F] mt-0.5">
            Type exact counted stock and press Save, or use + / − for adjustments.
          </p>
        </div>
        {base !== '/manager' && (
          <Link
            href={`${base}/products/new`}
            className="rounded-xl bg-[#D4A843] hover:bg-[#E5B558] text-[#14121A] text-xs font-bold px-4 py-2.5 transition-all shadow-md shadow-[#D4A843]/10"
          >
            + Add Product
          </Link>
        )}
      </div>

      <form className="flex flex-wrap gap-2" role="search">
        <input type="hidden" name="filter" value={filter ?? ''} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, SKU or size…"
          aria-label="Search inventory"
          className="rounded-xl border border-white/10 bg-[#181521] px-3.5 py-2 text-xs text-white placeholder-[#5E566A] focus:border-[#D4A843] focus:outline-none flex-1 max-w-md"
        />
        <button
          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2 transition-colors"
          type="submit"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {tab('', 'Everything')}
        {tab('low', 'Low stock (≤ 5)')}
        {tab('out', 'Sold out')}
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#181521] overflow-hidden">
        {lines.length === 0 ? (
          <p className="p-8 text-center text-xs text-[#736B7F]">No inventory items found.</p>
        ) : (
          <StockTable
            lines={lines.map((l) => ({
              key: l.key,
              productId: l.productId,
              variantId: l.variantId,
              name: l.name,
              sku: l.sku,
              option: l.option,
              stock: l.stock,
              status: l.status,
            }))}
          />
        )}
      </div>
    </div>
  );
}
