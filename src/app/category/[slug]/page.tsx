import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { site } from '@/config/site';
import { ShopView } from '@/components/shop-view';
import { isFiltered, toQuery } from '@/lib/params';
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
const find = (slug: string) => site.categories.find((c) => c.toLowerCase() === slug);
// Only the slugs listed in the site config exist. Anything else is a real 404, even though the page streams in behind a loading skeleton.
export const dynamicParams = false;
export const generateStaticParams = () => site.categories.map((c) => ({ slug: c.toLowerCase() }));
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params; const sp = await searchParams;
  const c = find(slug); if (!c) return {};
  return { title: c, description: `Shop AurNya ${c.toLowerCase()}. ${site.promise}`, alternates: { canonical: `/category/${slug}` }, robots: isFiltered(sp) ? { index: false, follow: true } : undefined };
}
export default async function Category({ params, searchParams }: Props) {
  const { slug } = await params; const sp = await searchParams;
  const c = find(slug); if (!c) notFound();
  return <ShopView title={c} basePath={`/category/${slug}`} query={{ ...toQuery(sp), category: c }} />;
}
