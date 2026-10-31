import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { site } from '@/config/site';
import { ShopView } from '@/components/shop-view';
import { isFiltered, toQuery } from '@/lib/params';
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
const find = (slug: string) => site.collections.find((c) => c.slug === slug);
// Only the slugs listed in the site config exist. Anything else is a real 404, even though the page streams in behind a loading skeleton.
export const dynamicParams = false;
export const generateStaticParams = () => site.collections.map((c) => ({ slug: c.slug }));
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params; const sp = await searchParams;
  const c = find(slug); if (!c) return {};
  return { title: c.name, description: `${c.blurb} Shop the ${c.name} collection at AurNya.`, alternates: { canonical: `/collection/${c.slug}` }, robots: isFiltered(sp) ? { index: false, follow: true } : undefined };
}
export default async function Collection({ params, searchParams }: Props) {
  const { slug } = await params; const sp = await searchParams;
  const c = find(slug); if (!c) notFound();
  return <ShopView title={c.name} basePath={`/collection/${c.slug}`} query={{ ...toQuery(sp), collection: c.slug }} />;
}
