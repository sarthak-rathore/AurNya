import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/ui';
import { allCollections, getProduct } from '@/db/admin-products';
import { getDb } from '@/db/client';
import { site } from '@/config/site';
import { products as demoProducts } from '@/data/products';
import { paiseToRupees } from '@/lib/admin-format';
import { ProductForm, type FormState } from '@/app/admin/(panel)/products/product-form';
import { requireRole } from '@/lib/role-auth';

export const metadata = { title: 'Edit Product' };

export default async function OwnerEditProduct({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requireRole('owner');
  const { id } = await params;
  const sp = await searchParams;
  const db = getDb();
  const n = /^\d{1,9}$/.test(id) ? Number(id) : 0;
  if (!n) notFound();

  let p: any = null;
  let collections = site.collections.map((c) => ({ slug: c.slug, name: c.name }));

  if (db) {
    try {
      p = await getProduct(db, n);
      collections = await allCollections(db);
    } catch { /* fallback to demo data */ }
  }

  // Fallback demo product
  if (!p) {
    const demo = demoProducts.find((x) => x.id === n) || demoProducts[0];
    if (demo) {
      p = {
        id: demo.id,
        name: demo.name,
        slug: demo.slug,
        sku: demo.sku,
        category: demo.category,
        short: demo.short,
        description: `${demo.short} Crafted with premium materials for timeless elegance.`,
        pricePaise: demo.pricePaise,
        comparePricePaise: demo.originalPricePaise ?? null,
        stock: demo.stock,
        tags: demo.tags,
        material: '18K Gold Plated Brass, Cubic Zirconia',
        dimensions: 'Adjustable / Standard',
        weight: '12g',
        images: demo.image ? [{ src: demo.image, alt: demo.name }] : [],
        video: null,
        seoTitle: `${demo.name} | AurNya Jewellery`,
        seoDescription: demo.short,
        status: 'active' as const,
        collections: demo.collections,
        variants: demo.variants?.options
          ? {
              label: 'Size',
              options: demo.variants.options.map((opt) => ({
                value: opt,
                stock: demo.variants?.optionStock?.[opt] ?? 0,
                sku: `${demo.sku}-${opt}`,
              })),
            }
          : null,
        isDemo: true,
      };
    }
  }

  if (!p) notFound();

  const initial: FormState = {
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    category: p.category,
    short: p.short,
    description: p.description ?? '',
    price: paiseToRupees(p.pricePaise),
    comparePrice: paiseToRupees(p.comparePricePaise),
    stock: String(p.stock),
    tags: p.tags,
    material: p.material ?? '',
    dimensions: p.dimensions ?? '',
    weight: p.weight ?? '',
    images: p.images,
    video: p.video ?? '',
    seoTitle: p.seoTitle ?? '',
    seoDescription: p.seoDescription ?? '',
    status: p.status,
    collections: p.collections,
    hasVariants: !!p.variants,
    variantLabel: p.variants?.label ?? 'Size',
    variants: (p.variants?.options ?? []).map((o: any) => ({
      value: o.value,
      stock: String(o.stock),
      sku: o.sku ?? '',
      existing: true,
    })),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-white">{p.name}</h1>
          <p className="text-xs text-[#968E9F] mt-0.5">
            {p.isDemo ? 'Editing demo product in testing mode' : `SKU ${p.sku}`}
          </p>
        </div>
      </div>
      {sp.created && (
        <p role="status" className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-[#4ADE80]">
          Product created. It is currently a draft until you set it to Active.
        </p>
      )}
      <ProductForm
        key={p.id}
        id={p.id}
        initial={initial}
        categories={[...site.categories]}
        collections={collections}
        storefrontSlug={p.slug}
      />
    </div>
  );
}
