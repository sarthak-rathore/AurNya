import { allCollections } from '@/db/admin-products';
import { getDb } from '@/db/client';
import { site } from '@/config/site';
import { ProductForm } from '../product-form';
import { requireAdminPage } from '@/lib/admin-auth';

export const metadata = { title: 'New product' };

export default async function NewProduct() {
  await requireAdminPage();
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
          It starts as a draft. Switch it to Active when you are ready to publish.
        </p>
      </div>
      <ProductForm
        categories={[...site.categories]}
        collections={collections}
      />
    </div>
  );
}
