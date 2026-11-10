import { and, asc, desc, eq, exists, gte, inArray, lte, ne, sql, type SQL } from 'drizzle-orm';
import { PAGE_SIZE, type CatalogService } from '@/lib/catalog-types';
import type { Category, Product, Tag } from '@/lib/types';
import type { Db } from './client';
import { categories, collections, productCollections, productImages, products, productVariants } from './schema';
import { isDemoMode } from '@/lib/demo-mode';

// Total available: the sum of the per-size stock when a product has sizes, otherwise the product's own stock.
const stockTotal = sql<number>`coalesce((select sum(${productVariants.stock})::int from ${productVariants} where ${productVariants.productId} = ${products.id}), ${products.stock})`;
const hasTag = (tag: string) => sql`${products.tags} @> ARRAY[${tag}]::text[]`;
const escapeLike = (s: string) => s.replace(/[\\%_]/g, '\\$&');

const columns = {
  id: products.id, slug: products.slug, sku: products.sku, name: products.name, category: categories.name, short: products.short,
  description: products.description, pricePaise: products.pricePaise, comparePricePaise: products.comparePricePaise, stock: stockTotal, tags: products.tags,
  material: products.material, dimensions: products.dimensions, weight: products.weight, image: products.image, imageAlt: products.imageAlt, video: products.video,
  seoTitle: products.seoTitle, seoDescription: products.seoDescription,
};
type Row = { [K in keyof typeof columns]: unknown } & { id: number; slug: string; sku: string; name: string; category: string; short: string; pricePaise: number; stock: number; tags: string[] };

export function createDbCatalog(db: Db): CatalogService {
  const base = () => db.select(columns).from(products).innerJoin(categories, eq(products.categoryId, categories.id));
  const live = isDemoMode() ? eq(products.status, 'active') : and(eq(products.status, 'active'), eq(products.isDemo, false));

  /** Turns database rows into Product objects, fetching sizes, collections and pictures for all of them in three queries. */
  async function hydrate(rows: Row[]): Promise<Product[]> {
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    const [cols, vars, imgs] = await Promise.all([
      db.select({ productId: productCollections.productId, slug: collections.slug }).from(productCollections).innerJoin(collections, eq(productCollections.collectionId, collections.id))
        .where(inArray(productCollections.productId, ids)).orderBy(asc(collections.sortOrder), asc(collections.id)),
      db.select().from(productVariants).where(inArray(productVariants.productId, ids)).orderBy(asc(productVariants.sortOrder), asc(productVariants.id)),
      db.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(asc(productImages.sortOrder), asc(productImages.id)),
    ]);
    return rows.map((r) => {
      const v = vars.filter((x) => x.productId === r.id); const im = imgs.filter((x) => x.productId === r.id);
      const p: Product = {
        id: r.id, slug: r.slug, sku: r.sku, name: r.name, category: r.category as Category, short: r.short,
        collections: cols.filter((c) => c.productId === r.id).map((c) => c.slug), tags: r.tags as Tag[], pricePaise: r.pricePaise, stock: Number(r.stock),
      };
      const opt = <T,>(x: T | null | undefined) => (x === null ? undefined : x);
      if (r.comparePricePaise != null) p.originalPricePaise = r.comparePricePaise as number;
      if (v.length) p.variants = { label: v[0].optionLabel, options: v.map((x) => x.optionValue), optionStock: Object.fromEntries(v.map((x) => [x.optionValue, x.stock])) };
      if (im.length) p.images = im.map((x) => ({ src: x.url, alt: x.alt }));
      for (const k of ['description', 'material', 'dimensions', 'weight', 'image', 'imageAlt', 'video', 'seoTitle', 'seoDescription'] as const) {
        const val = opt(r[k] as string | null | undefined); if (val !== undefined) p[k] = val;
      }
      return p;
    });
  }
  const run = async (where: SQL | undefined, order: SQL[], limit?: number) => {
    const q = base().where(where).orderBy(...order);
    return hydrate((limit ? await q.limit(limit) : await q) as Row[]);
  };

  return {
    all: () => run(live, [asc(products.id)]),
    async list(q) {
      const parts: (SQL | undefined)[] = [live];
      if (q.category) parts.push(eq(categories.name, q.category));
      if (q.collection) {
        parts.push(exists(db.select({ one: sql`1` }).from(productCollections).innerJoin(collections, eq(productCollections.collectionId, collections.id))
          .where(and(eq(productCollections.productId, products.id), eq(collections.slug, q.collection)))));
      }
      if (q.tag) parts.push(hasTag(q.tag));
      if (q.price) {
        const [lo, hi] = q.price.split('-').map(Number);
        parts.push(Number.isFinite(lo) && Number.isFinite(hi) ? and(gte(products.pricePaise, lo), lte(products.pricePaise, hi)) : sql`false`);
      }
      if (q.stock) parts.push(sql`${stockTotal} > 0`);
      const term = (q.q ?? '').trim();
      if (term) parts.push(sql`(${products.name} || ' ' || ${categories.name} || ' ' || ${products.short}) ilike ${'%' + escapeLike(term) + '%'}`);
      const where = and(...parts);
      const order = q.sort === 'price-asc' ? [asc(products.pricePaise), asc(products.id)] : q.sort === 'price-desc' ? [desc(products.pricePaise), asc(products.id)]
        : q.sort === 'newest' ? [desc(hasTag('new')), asc(products.id)] : [asc(products.id)];
      const limit = PAGE_SIZE * Math.max(1, Math.floor(q.page ?? 1));
      const [items, count] = await Promise.all([
        run(where, order, limit),
        db.select({ n: sql<number>`count(*)::int` }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).where(where),
      ]);
      return { items, total: Number(count[0]?.n ?? 0) };
    },
    async bySlug(slug) { return (await run(and(live, eq(products.slug, slug)), [asc(products.id)], 1))[0] ?? null; },
    byIds: (ids) => (ids.length ? run(and(live, inArray(products.id, ids)), [asc(products.id)]) : Promise.resolve([])),
    related: (p, n = 4) => run(and(live, eq(categories.name, p.category), ne(products.id, p.id)), [asc(products.id)], n),
    featured: (tag, n = 4) => run(and(live, hasTag(tag)), [asc(products.id)], n),
    async suggest(q, n = 6) {
      const t = q.trim(); if (!t) return [];
      const like = '%' + escapeLike(t) + '%';
      return run(and(live, sql`(${products.name} ilike ${like} or ${categories.name} ilike ${like})`), [asc(products.id)], n);
    },
  };
}
