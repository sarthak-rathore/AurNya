import { notFound } from 'next/navigation';
import { NeedsDatabase, PageHeader } from '@/components/admin/ui';
import { allCollections, getProduct } from '@/db/admin-products';
import { getDb } from '@/db/client';
import { site } from '@/config/site';
import { paiseToRupees } from '@/lib/admin-format';
import { ProductForm, type FormState } from '../product-form';
import { requireAdminPage } from '@/lib/admin-auth';

export const metadata = { title: 'Edit product' };
export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireAdminPage();   // the sign-in check must come first: pages build in parallel with their layout
  const { id } = await params; const sp = await searchParams; const db = getDb();
  if (!db) return <><PageHeader title="Edit product" /><NeedsDatabase /></>;
  const n = /^\d{1,9}$/.test(id) ? Number(id) : 0; const p = n ? await getProduct(db, n) : null; if (!p) notFound();
  const initial: FormState = {
    name: p.name, slug: p.slug, sku: p.sku, category: p.category, short: p.short, description: p.description ?? '', price: paiseToRupees(p.pricePaise), comparePrice: paiseToRupees(p.comparePricePaise), stock: String(p.stock),
    tags: p.tags, material: p.material ?? '', dimensions: p.dimensions ?? '', weight: p.weight ?? '', images: p.images, video: p.video ?? '', seoTitle: p.seoTitle ?? '', seoDescription: p.seoDescription ?? '',
    status: p.status, collections: p.collections, hasVariants: !!p.variants, variantLabel: p.variants?.label ?? 'Size',
    variants: (p.variants?.options ?? []).map((o) => ({ value: o.value, stock: String(o.stock), sku: o.sku ?? '', existing: true })),
  };
  return (
    <>
      <PageHeader title={p.name} sub={p.isDemo ? 'Sample product from the demo data.' : `SKU ${p.sku}`} />
      {sp.created && <p role="status" className="mb-4 rounded-xl bg-emerald-100 p-3 text-sm text-emerald-900">Product created. It is a draft until you set it to Active.</p>}
      <ProductForm key={p.id} id={p.id} initial={initial} categories={[...site.categories]} collections={await allCollections(db)} storefrontSlug={p.slug} />
    </>
  );
}
