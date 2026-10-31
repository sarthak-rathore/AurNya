import type { Metadata } from 'next';
import { site } from '@/config/site';
import { ShopView } from '@/components/shop-view';
import { isFiltered, toQuery } from '@/lib/params';
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const titleFor = (q: ReturnType<typeof toQuery>) => (q.q ? `Results for “${q.q}”` : q.tag === 'new' ? 'New Arrivals' : q.tag === 'bestseller' ? 'Bestsellers' : q.category ?? 'Shop All');
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams; const q = toQuery(sp);
  return { title: titleFor(q), description: `Browse AurNya jewellery: ${site.promise}`, alternates: { canonical: q.tag ? `/shop?tag=${q.tag}` : '/shop' }, robots: isFiltered(sp) ? { index: false, follow: true } : undefined };
}
export default async function Shop({ searchParams }: Props) { const q = toQuery(await searchParams); return <ShopView title={titleFor(q)} basePath="/shop" query={q} />; }
