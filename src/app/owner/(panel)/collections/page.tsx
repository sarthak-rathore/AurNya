import { requireRole } from '@/lib/role-auth';
import { site } from '@/config/site';
import { CollectionsClient, type CollectionItem } from '@/components/admin/collections-client';
import { getDb } from '@/db/client';
import { readSection } from '@/db/sections';

export const metadata = { title: 'Collections' };

export default async function Collections() {
  await requireRole('owner');
  const initial: CollectionItem[] = site.collections.map((c, i) => ({ name: c.name, slug: c.slug, blurb: c.blurb, sortOrder: i + 1, status: 'Active' }));
  return <CollectionsClient initial={await readSection(getDb(), 'collections', initial)} />;
}
