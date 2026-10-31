import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { site } from '@/config/site';
import { catalog } from '@/lib/catalog';
import { siteUrl } from '@/lib/env';
import { formatINR } from '@/lib/money';
import { AddToCart } from '@/components/product-actions';
import { JsonLd } from '@/components/json-ld';
import { Gallery } from '@/components/gallery';
import { ProductGrid } from '@/components/product-card';
import { RecentlyViewed } from '@/components/recently-viewed';
import { ShareButton } from '@/components/share-button';
import { PincodeChecker } from '@/components/pincode-checker';

type Props = { params: Promise<{ slug: string }> };
// Refreshed at most once a minute, so price and stock edits show up quickly without hitting the database on every visit.
export const revalidate = 60;
// If the database cannot be reached while building, skip pre-building product pages; they are then built the first time someone visits.
export const generateStaticParams = async () => { try { return (await catalog.all()).map((p) => ({ slug: p.slug })); } catch { return []; } };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await catalog.bySlug(slug); if (!p) return {};
  return { title: p.seoTitle ?? p.name, description: p.seoDescription ?? `${p.short} ${formatINR(p.pricePaise)}. ${site.promise}`, alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: p.name, description: p.short, images: [p.image ?? '/images/packaging.jpg'] } };
}
const TBC = <span className="text-gold-ink">To be confirmed by the store</span>;
export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await catalog.bySlug(slug); if (!p) notFound();
  const related = await catalog.related(p); const all = await catalog.all(); const url = siteUrl();
  return (
    <div className="mx-auto max-w-7xl px-6 pb-20 pt-8">
      <JsonLd data={{ '@context': 'https://schema.org', '@graph': [
        { '@type': 'Product', name: p.name, sku: p.sku, description: p.short, category: p.category, brand: { '@type': 'Brand', name: site.name }, ...(p.image ? { image: p.image.startsWith('http') ? p.image : `${url}${p.image}` } : {}),
          offers: { '@type': 'Offer', url: `${url}/product/${p.slug}`, priceCurrency: 'INR', price: (p.pricePaise / 100).toFixed(2), availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } },
        { '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home', item: url }, { name: p.category, item: `${url}/category/${p.category.toLowerCase()}` }, { name: p.name, item: `${url}/product/${p.slug}` }].map((x, i) => ({ '@type': 'ListItem', position: i + 1, ...x })) }] }} />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted"><Link href="/" className="hover:text-gold-ink">Home</Link> / <Link href={`/category/${p.category.toLowerCase()}`} className="hover:text-gold-ink">{p.category}</Link> / <span>{p.name}</span></nav>
      <div className="grid items-start gap-12 md:grid-cols-[1.1fr_1fr]">
        <Gallery name={p.name} category={p.category} video={p.video} images={p.images ?? (p.image ? [{ src: p.image, alt: p.imageAlt ?? p.name }] : [])} />
        <div>
          <p className="text-xs uppercase tracking-[.22em] text-gold-ink">{p.category}</p>
          <h1 className="mt-2 font-serif text-5xl">{p.name}</h1>
          <p className="my-3 text-2xl">{formatINR(p.pricePaise)}{p.originalPricePaise && <s className="ml-3 text-base text-muted">{formatINR(p.originalPricePaise)}</s>}</p>
          <p>{p.short}</p>
          <AddToCart product={p} />
          <ShareButton title={p.name} />
          <PincodeChecker />
          <div className="mt-8 divide-y divide-charcoal/10 border-y border-charcoal/10">
            <details open className="py-4"><summary className="cursor-pointer font-medium">Description</summary><p className="mt-2 text-muted">{p.description ?? `${p.short} A fuller description will be added by the store.`}</p></details>
            <details className="py-4"><summary className="cursor-pointer font-medium">Specifications</summary><dl className="mt-2 grid grid-cols-[130px_1fr] gap-1.5 text-muted"><dt className="text-charcoal">SKU</dt><dd>{p.sku}</dd><dt className="text-charcoal">Material / finish</dt><dd>{p.material ?? TBC}</dd><dt className="text-charcoal">Dimensions</dt><dd>{p.dimensions ?? TBC}</dd><dt className="text-charcoal">Weight</dt><dd>{p.weight ?? TBC}</dd></dl></details>
            <details className="py-4"><summary className="cursor-pointer font-medium">Jewellery care</summary><ul className="mt-2 list-disc pl-5 text-muted">{site.care.map((c) => <li key={c}>{c}</li>)}</ul></details>
            <details className="py-4"><summary className="cursor-pointer font-medium">Shipping &amp; returns</summary><p className="mt-2 text-muted">Delivery times, charges and return rules will appear here once the store confirms its policies. See <Link className="underline" href="/info/shipping">Shipping</Link> and <Link className="underline" href="/info/returns">Returns</Link>.</p></details>
          </div>
        </div>
      </div>
      {related.length > 0 && <section className="mt-20"><h2 className="mb-8 text-center font-serif text-4xl">You may also like</h2><ProductGrid items={related} /></section>}
      <section className="mt-16 border-t border-charcoal/10 pt-10"><h2 className="font-serif text-3xl">Reviews</h2><p className="mt-2 text-muted">No reviews yet. Reviews from verified buyers will appear here once ordering opens.</p></section>
      <RecentlyViewed current={p.id} all={all} />
    </div>
  );
}
