import { requireRole } from '@/lib/role-auth';
import { site } from '@/config/site';
import { CategoriesClient, type CategoryItem } from '@/components/admin/categories-client';
import { getDb } from '@/db/client';
import { readSection } from '@/db/sections';

export const metadata = { title: 'Product Categories' };

export default async function Categories() {
  await requireRole('owner');
  const initial: CategoryItem[] = site.categories.map((c, i) => ({ name: c, slug: c.toLowerCase().replace(/[^a-z0-9]+/g, '-'), sortOrder: i + 1, status: 'Active' }));
  return <CategoriesClient initial={await readSection(getDb(), 'categories', initial)} />;
}
