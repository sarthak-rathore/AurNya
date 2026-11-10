import Link from 'next/link';
import { Thumb } from '@/components/admin/image-picker';
import { listProducts } from '@/db/admin-products';
import { getDb } from '@/db/client';
import { site } from '@/config/site';
import { products as demoProducts } from '@/data/products';
import { requireAdminPage } from '@/lib/admin-auth';
import { formatINR } from '@/lib/money';

export const metadata = { title: 'Products' };
type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function AdminProducts({ searchParams }: { searchParams: SP }) {
  await requireAdminPage();
  const sp = await searchParams;
  const q = one(sp.q).toLowerCase().trim().slice(0, 80);
  const status = one(sp.status);
  const category = one(sp.category);
  const stock = one(sp.stock);

  const db = getDb();
  let rows: Array<{
    id: number;
    name: string;
    slug: string;
    sku: string;
    category: string;
    pricePaise: number;
    stock: number;
    status: 'draft' | 'active' | 'archived';
    image?: string | null;
    isDemo?: boolean;
  }> = [];

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
    } catch { /* fallback to demo data below */ }
  }

  // Fallback demo products when no DB or empty
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

    counts = {
      all: demoProducts.length,
      active: demoProducts.length,
      draft: 0,
      archived: 0,
    };

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
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-white">All Products</h1>
          <p className="text-xs text-[#968E9F] mt-0.5">
            {rows.length} product{rows.length === 1 ? '' : 's'} in catalogue
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-xl bg-[#D4A843] hover:bg-[#E5B558] text-[#14121A] text-xs font-bold px-4 py-2.5 transition-all shadow-md shadow-[#D4A843]/10"
        >
          + Add Product
        </Link>
      </div>

      {/* Filters Form */}
      <form className="grid gap-2.5 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, SKU, or slug…"
          className="rounded-xl border border-white/10 bg-[#181521] px-3.5 py-2 text-xs text-white placeholder-[#5E566A] focus:border-[#D4A843] focus:outline-none"
        />
        <select
          name="category"
          defaultValue={category}
          className="rounded-xl border border-white/10 bg-[#181521] px-3 py-2 text-xs text-white focus:border-[#D4A843] focus:outline-none"
        >
          <option value="" className="bg-[#181521]">All categories</option>
          {site.categories.map((c) => (
            <option key={c} value={c} className="bg-[#181521]">
              {c}
            </option>
          ))}
        </select>
        <select
          name="stock"
          defaultValue={stock}
          className="rounded-xl border border-white/10 bg-[#181521] px-3 py-2 text-xs text-white focus:border-[#D4A843] focus:outline-none"
        >
          <option value="" className="bg-[#181521]">Any stock level</option>
          <option value="low" className="bg-[#181521]">Low stock (≤ 10)</option>
          <option value="out" className="bg-[#181521]">Sold out (0)</option>
        </select>
        <button
          type="submit"
          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2 transition-colors"
        >
          Filter
        </button>
      </form>

      {/* Products Table */}
      <div className="rounded-2xl border border-white/5 bg-[#181521] overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#736B7F]">
            No products found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-white/5 bg-[#14121A]/50">
                <tr className="text-[10px] font-semibold uppercase text-[#736B7F]">
                  <th className="px-5 py-3">Photo</th>
                  <th className="px-5 py-3">Product Name &amp; SKU</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Stock Units</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      {r.image ? (
                        <Thumb src={r.image} size={42} />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs text-[#736B7F]">
                          💍
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/products/${r.id}`}
                        className="font-semibold text-white hover:text-[#D4A843] transition-colors"
                      >
                        {r.name}
                      </Link>
                      <div className="text-[11px] text-[#736B7F] font-mono mt-0.5">
                        {r.sku}
                        {r.isDemo && <span className="ml-1 text-[10px] text-[#A59CB0] font-sans">(demo)</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#C7C0D2]">{r.category}</td>
                    <td className="px-5 py-3.5 font-bold text-white">{formatINR(r.pricePaise)}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs font-medium ${
                          r.stock === 0
                            ? 'text-red-400 font-bold'
                            : r.stock <= 5
                            ? 'text-[#E5B558]'
                            : 'text-[#4ADE80]'
                        }`}
                      >
                        {r.stock === 0 ? 'Sold out' : `${r.stock} in stock`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                          r.status === 'active'
                            ? 'bg-[#153424] text-[#4ADE80]'
                            : r.status === 'draft'
                            ? 'bg-[#2E2838] text-[#A59CB0]'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/products/${r.id}`}
                        className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-[#C7C0D2] hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
