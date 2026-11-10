import Link from 'next/link';
import { budgets, site } from '@/config/site';
import { catalog, PAGE_SIZE } from '@/lib/catalog';
import type { Query } from '@/lib/types';
import { ProductGrid } from './product-card';
import { ShowcaseArt, type ArtKind } from './showcase-art';
import { JsonLd } from './json-ld';
import { siteUrl } from '@/lib/env';
import { isDemoMode } from '@/lib/demo-mode';

const PRICES = [['', 'Any price'], ...budgets.map((b) => [b.price, b.label])];
const SORTS = [['', 'Featured'], ['newest', 'Newest'], ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low']];
const lg = 'mb-2 text-xs uppercase tracking-[.16em] text-muted';

export async function ShopView({ title, basePath, query, crumb }: { title: string; basePath: string; query: Query; crumb?: string }) {
  const { items, total } = await catalog.list(query);
  const page = Math.max(1, query.page ?? 1);
  const col = site.collections.find((c) => c.slug === query.collection);
  const artKind: ArtKind = (query.category as ArtKind) || (query.collection === 'gifts' ? 'Gift' : query.collection === 'statement' ? 'Necklaces' : query.collection ? 'Earrings' : query.tag === 'new' ? 'Rings' : 'Necklaces');
  const blurb = col ? col.blurb : query.category ? `Browse ${query.category.toLowerCase()} from AurNya.` : query.tag === 'new' ? (isDemoMode() ? 'Just in. Sample picks while we get ready.' : 'Explore our newest arrivals.') : query.tag === 'bestseller' ? (isDemoMode() ? 'Sample picks while we get ready.' : 'Our most loved pieces.') : query.q ? 'Everything that matches your search.' : 'Every piece, in one place.';
  const more = new URLSearchParams(); (['q', 'category', 'collection', 'tag', 'price', 'stock', 'sort'] as const).forEach((k) => query[k] && more.set(k, String(query[k]))); more.set('page', String(page + 1));
  return (
    <div className="mx-auto max-w-7xl px-6 pb-20 pt-8">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl() }, { '@type': 'ListItem', position: 2, name: title, item: `${siteUrl()}${basePath}` }] }} />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted"><Link href="/" className="hover:text-gold-ink">Home</Link> / <span>{crumb ?? title}</span></nav>
      {/* Page banner: title, a line about what you are looking at, a drawn illustration and quick category chips. */}
      <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-cream via-sage/40 to-lavender/25 px-6 py-8 md:px-12 md:py-10">
        <ShowcaseArt kind={artKind} uid="banner" className="pointer-events-none absolute -right-4 top-1/2 hidden w-48 -translate-y-1/2 opacity-90 sm:block md:right-8 md:w-60" />
        <div className="relative max-w-xl"><p className="mb-2 text-xs uppercase tracking-[.22em] text-gold-ink">AurNya</p><h1 className="font-serif text-5xl leading-none md:text-6xl">{title}</h1><p className="mt-3 text-muted">{blurb}</p></div>
        <nav aria-label="Quick categories" className="relative mt-6 flex flex-wrap gap-2">{[['All', '/shop', !query.category], ...site.categories.map((c) => [c, `/category/${c.toLowerCase()}`, query.category === c])].map(([label, href, on]) => (
          <Link key={String(href)} href={String(href)} aria-current={on ? 'page' : undefined} className={`rounded-full border px-5 py-2 text-xs uppercase tracking-[.14em] transition ${on ? 'border-charcoal bg-charcoal text-ivory' : 'border-charcoal/25 bg-ivory/70 hover:border-charcoal'}`}>{String(label)}</Link>))}</nav>
      </section>
      <div className="grid gap-10 md:grid-cols-[230px_1fr]">
        <details className="md:open:block" open>
          <summary className="mb-3 cursor-pointer text-xs uppercase tracking-[.16em] md:hidden">Filters &amp; sort</summary>
          <form action={basePath} method="get" className="space-y-6">
            {(['q', 'tag', 'collection'] as const).map((k) => query[k] && basePath === '/shop' ? <input key={k} type="hidden" name={k} value={query[k]} /> : null)}
            {basePath === '/shop' && <fieldset><legend className={lg}>Category</legend>{[['', 'All'], ...site.categories.map((c) => [c, c])].map(([v, l]) => (<label key={v} className="flex items-center gap-2 py-0.5"><input type="radio" name="category" value={v} defaultChecked={(query.category ?? '') === v} className="accent-charcoal" />{l}</label>))}</fieldset>}
            <fieldset><legend className={lg}>Price</legend>{PRICES.map(([v, l]) => (<label key={v} className="flex items-center gap-2 py-0.5"><input type="radio" name="price" value={v} defaultChecked={(query.price ?? '') === v} className="accent-charcoal" />{l}</label>))}</fieldset>
            <fieldset><legend className={lg}>Availability</legend><label className="flex items-center gap-2"><input type="checkbox" name="stock" value="1" defaultChecked={!!query.stock} className="accent-charcoal" />In stock only</label></fieldset>
            <fieldset><legend className={lg}>Material · Colour</legend><p className="text-sm text-muted">These filters unlock once materials and colours are confirmed for each product.</p></fieldset>
            <label className="block"><span className={lg}>Sort</span><select name="sort" defaultValue={query.sort ?? ''} className="mt-1 w-full rounded-lg border border-charcoal/20 bg-surface px-3 py-2">{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <button className="w-full rounded-full bg-charcoal py-3 text-xs uppercase tracking-widest text-ivory">Apply</button>
          </form>
        </details>
        <div>
          <p className="mb-4 text-sm text-muted">{total} piece{total === 1 ? '' : 's'}</p>
          {items.length ? <ProductGrid items={items} heading="Products" /> : (<div className="py-16 text-center"><h2 className="font-serif text-3xl">No pieces found</h2><p className="mt-2 text-muted">Try clearing a filter or searching for something else.</p><Link href="/shop" className="mt-5 inline-block rounded-full bg-charcoal px-7 py-3 text-xs uppercase tracking-widest text-ivory">Clear filters</Link></div>)}
          {items.length < total && <div className="mt-10 text-center"><Link scroll={false} href={`${basePath}?${more}`} className="rounded-full border border-charcoal px-8 py-3 text-xs uppercase tracking-widest hover:bg-charcoal hover:text-ivory">Load more</Link><p className="mt-2 text-xs text-muted">Showing {items.length} of {total} · {PAGE_SIZE} per page</p></div>}
        </div>
      </div>
    </div>
  );
}
