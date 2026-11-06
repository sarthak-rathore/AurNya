import { NeedsDatabase, PageHeader } from '@/components/admin/ui';
import { allCollections } from '@/db/admin-products';
import { getDb } from '@/db/client';
import { site } from '@/config/site';
import { ProductForm, emptyForm } from '../product-form';
import { requireAdminPage } from '@/lib/admin-auth';

export const metadata = { title: 'New product' };
export default async function NewProduct() {
  await requireAdminPage();   // the sign-in check must come first: pages build in parallel with their layout
  const db = getDb(); if (!db) return <><PageHeader title="New product" /><NeedsDatabase /></>;
  return <><PageHeader title="New product" sub="It starts as a draft. Switch it to Active when you are ready." /><ProductForm initial={emptyForm(site.categories[0])} categories={[...site.categories]} collections={await allCollections(db)} /></>;
}
