import Link from 'next/link';
import { Thumb } from '@/components/admin/image-picker';
import { listProducts } from '@/db/admin-products';
import { getDb } from '@/db/client';
import { site } from '@/config/site';
import { products as demoProducts } from '@/data/products';
import { requireRole } from '@/lib/role-auth';
import { formatINR } from '@/lib/money';

export const metadata = { title: 'Products' };
type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function ManagerProducts({ searchParams }: { searchParams: SP }) {
  await requireRole('manager');
  const sp = await searchParams;
  const q = one(sp.q).toLowerCase().trim().slice(0, 80);
  const status = one(sp.status);
  const category = one(sp.category);
  const stock = one(sp.stock);

  const db = getDb();
  let rows: any[] = [];
  let counts: Record<string, number> = { all: 0, active: 0, draft: 0, archived: 0 };

  if (db) {
    try {
      const res = await listProducts(db, {
        q,
        status: status === 'draft' || status === 'active' || status === 'archived' ? status : undefined,
        category: (site.categories as readonly string[]).includes(category) ? category : undefined,
        stock: stock === 'low' || stock === 'out' ? stock : undefined,
      });
      rows = res.rows;
      counts = res.counts;
    } catch { /* fallback */ }
  }

  if (rows.length === 0 && !db) {
    let filtered = demoProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      category: p.category,
      pricePaise: p.pricePaise,
      stock: p.stock,
      status: 'active' as const,
      image: p.image,
      isDemo: true,
    }));

    if (q) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.slug.includes(q)
      );
    }
    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }
    if (stock === 'low') {
      filtered = filtered.filter((p) => p.stock > 0 && p.stock <= 10);
    } else if (stock === 'out') {
      filtered = filtered.filter((p) => p.stock === 0);
    }

    rows = filtered;
    counts = { all: demoProducts.length, active: demoProducts.length, draft: 0, archived: 0 };
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-white">Product Catalogue</h1>
          <p className="text-xs text-[#968E9F] mt-0.5">
            {rows.length} product{rows.length === 1 ? '' : 's'} available
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#181521] overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="border-b border-white/5 bg-[#14121A]/50">
            <tr className="text-[10px] font-semibold uppercase text-[#736B7F]">
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Stock Level</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#201C2B] border border-white/5 flex items-center justify-center">
                      {r.image ? <Thumb src={r.image} size={40} /> : <span className="text-base">💎</span>}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{r.name}</div>
                      <div className="text-[11px] text-[#736B7F]">{r.sku}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-[#C7C0D2]">{r.category}</td>
                <td className="px-5 py-3.5 font-semibold text-white">{formatINR(r.pricePaise)}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`text-xs font-medium ${
                      r.stock === 0 ? 'text-red-400 font-bold' : r.stock <= 5 ? 'text-[#E5B558]' : 'text-[#4ADE80]'
                    }`}
                  >
                    {r.stock === 0 ? 'Sold out' : `${r.stock} in stock`}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-[#153424] text-[#4ADE80]">
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
