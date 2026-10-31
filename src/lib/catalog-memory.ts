import type { Product, Tag } from './types';
import { PAGE_SIZE, type CatalogService } from './catalog-types';

/** The demo catalogue: plain in-memory data. Used when no DATABASE_URL is set, and as the reference the database version must match. */
export function createMemoryCatalog(products: Product[]): CatalogService {
  return {
    async all() { return products; },
    async list(q) {
      const term = (q.q ?? '').toLowerCase().trim();
      const [lo, hi] = q.price ? q.price.split('-').map(Number) : [0, Number.MAX_SAFE_INTEGER];
      let r = products.filter((p) =>
        (!q.category || p.category === q.category) && (!q.collection || p.collections.includes(q.collection)) &&
        (!q.tag || p.tags.includes(q.tag as Tag)) && p.pricePaise >= lo && p.pricePaise <= hi && (!q.stock || p.stock > 0) &&
        (!term || `${p.name} ${p.category} ${p.short}`.toLowerCase().includes(term)));
      if (q.sort === 'price-asc') r = [...r].sort((a, b) => a.pricePaise - b.pricePaise);
      if (q.sort === 'price-desc') r = [...r].sort((a, b) => b.pricePaise - a.pricePaise);
      if (q.sort === 'newest') r = [...r].sort((a, b) => Number(b.tags.includes('new')) - Number(a.tags.includes('new')));
      return { items: r.slice(0, PAGE_SIZE * Math.max(1, Math.floor(q.page ?? 1))), total: r.length };
    },
    async bySlug(slug) { return products.find((p) => p.slug === slug) ?? null; },
    async byIds(ids) { return products.filter((p) => ids.includes(p.id)); },
    async related(p, n = 4) { return products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, n); },
    async featured(tag, n = 4) { return products.filter((p) => p.tags.includes(tag)).slice(0, n); },
    async suggest(q, n = 6) { const t = q.toLowerCase().trim(); return t ? products.filter((p) => p.name.toLowerCase().includes(t) || p.category.toLowerCase().includes(t)).slice(0, n) : []; },
  };
}
