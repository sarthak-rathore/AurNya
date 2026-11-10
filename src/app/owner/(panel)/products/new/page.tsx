import { allCollections } from '@/db/admin-products';
import { getDb } from '@/db/client';
import { site } from '@/config/site';
import { ProductForm } from '@/app/admin/(panel)/products/product-form';
import { requireRole } from '@/lib/role-auth';

export const metadata = { title: 'Add Product' };

export default async function OwnerNewProduct() {
  await requireRole('owner');
  const db = getDb();
  let collections = site.collections.map((c) => ({ slug: c.slug, name: c.name }));
  if (db) {
    try {
      collections = await allCollections(db);
    } catch { /* fallback */ }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif text-white">Add Product</h1>
        <p className="text-xs text-[#968E9F] mt-0.5">
          Create a new piece for your jewellery catalogue. It starts as a draft until set to Active.
        </p>
      </div>
      <ProductForm
        categories={[...site.categories]}
        collections={collections}
      />
    </div>
  );
}
