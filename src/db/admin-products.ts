import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import { LOW_STOCK } from '@/lib/admin-format';
import type { ProductInput, StockAdjust } from '@/lib/admin-schemas';
import { slugify } from '@/lib/admin-format';
import { audit } from './admin-audit';
import { AdminError, friendlyDbError } from './admin-errors';
import type { Db } from './client';
import { categories, collections, productCollections, productImages, products, productVariants } from './schema';

export const PRODUCT_PAGE_SIZE = 20;
// Same total as the shop shows: the sum of the sizes when a product has sizes, otherwise the product's own stock.
const stockTotal = sql<number>`coalesce((select sum(${productVariants.stock})::int from ${productVariants} where ${productVariants.productId} = ${products.id}), ${products.stock})`;

export interface ProductListQuery { q?: string; status?: 'draft' | 'active' | 'archived'; category?: string; stock?: 'low' | 'out'; page?: number }
export interface ProductListRow { id: number; slug: string; sku: string; name: string; category: string; pricePaise: number; status: 'draft' | 'active' | 'archived'; stock: number; image: string | null; isDemo: boolean; updatedAt: Date }

const like = (s: string) => `%${s.replace(/[\\%_]/g, '\\$&')}%`;

export async function listProducts(db: Db, q: ProductListQuery = {}): Promise<{ rows: ProductListRow[]; total: number; page: number; pages: number; counts: Record<string, number> }> {
  const parts: (SQL | undefined)[] = [];
  if (q.status) parts.push(eq(products.status, q.status));
  if (q.category) parts.push(eq(categories.name, q.category));
  const term = (q.q ?? '').trim();
  if (term) parts.push(or(ilike(products.name, like(term)), ilike(products.sku, like(term)), ilike(products.slug, like(term))));
  if (q.stock === 'out') parts.push(sql`${stockTotal} <= 0`);
  if (q.stock === 'low') parts.push(sql`${stockTotal} > 0 and ${stockTotal} <= ${LOW_STOCK}`);
  const where = and(...parts);
  const page = Math.max(1, Math.floor(q.page ?? 1));
  const base = () => db.select({ n: sql<number>`count(*)::int` }).from(products).innerJoin(categories, eq(products.categoryId, categories.id));
  const [rows, total, byStatus] = await Promise.all([
    db.select({ id: products.id, slug: products.slug, sku: products.sku, name: products.name, category: categories.name, pricePaise: products.pricePaise, status: products.status, stock: stockTotal, image: products.image, isDemo: products.isDemo, updatedAt: products.updatedAt })
      .from(products).innerJoin(categories, eq(products.categoryId, categories.id)).where(where).orderBy(desc(products.updatedAt), desc(products.id)).limit(PRODUCT_PAGE_SIZE).offset((page - 1) * PRODUCT_PAGE_SIZE),
    base().where(where),
    db.select({ status: products.status, n: sql<number>`count(*)::int` }).from(products).groupBy(products.status),
  ]);
  const counts: Record<string, number> = { all: 0, draft: 0, active: 0, archived: 0 };
  for (const r of byStatus) { counts[r.status] = Number(r.n); counts.all += Number(r.n); }
  const n = Number(total[0]?.n ?? 0);
  return { rows: rows.map((r) => ({ ...r, stock: Number(r.stock) })), total: n, page, pages: Math.max(1, Math.ceil(n / PRODUCT_PAGE_SIZE)), counts };
}

export interface ProductDetail extends ProductInput { id: number; isDemo: boolean; variantRows: { id: number; value: string; stock: number; sku: string | null }[] }

export async function getProduct(db: Db, id: number): Promise<(Omit<ProductDetail, 'price' | 'comparePrice'> & { pricePaise: number; comparePricePaise: number | null }) | null> {
  const [p] = await db.select({ p: products, category: categories.name }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).where(eq(products.id, id)).limit(1);
  if (!p) return null;
  const [imgs, vars, cols] = await Promise.all([
    db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.sortOrder), asc(productImages.id)),
    db.select().from(productVariants).where(eq(productVariants.productId, id)).orderBy(asc(productVariants.sortOrder), asc(productVariants.id)),
    db.select({ slug: collections.slug }).from(productCollections).innerJoin(collections, eq(productCollections.collectionId, collections.id)).where(eq(productCollections.productId, id)),
  ]);
  const row = p.p;
  // If the product has a main picture but no gallery rows, the main picture is shown as the only gallery picture.
  const images = imgs.length ? imgs.map((i) => ({ src: i.url, alt: i.alt })) : row.image ? [{ src: row.image, alt: row.imageAlt ?? '' }] : [];
  return {
    id: row.id, isDemo: row.isDemo, name: row.name, slug: row.slug, sku: row.sku, category: p.category as ProductInput['category'], short: row.short, description: row.description,
    pricePaise: row.pricePaise, comparePricePaise: row.comparePricePaise, stock: row.stock, tags: row.tags as ProductInput['tags'], material: row.material, dimensions: row.dimensions, weight: row.weight,
    images, video: row.video, seoTitle: row.seoTitle, seoDescription: row.seoDescription, status: row.status, collections: cols.map((c) => c.slug),
    variants: vars.length ? { label: vars[0].optionLabel, options: vars.map((v) => ({ value: v.optionValue, stock: v.stock, sku: v.sku })) } : null,
    variantRows: vars.map((v) => ({ id: v.id, value: v.optionValue, stock: v.stock, sku: v.sku })),
  };
}

export const allCollections = (db: Db) => db.select({ slug: collections.slug, name: collections.name }).from(collections).where(eq(collections.isActive, true)).orderBy(asc(collections.sortOrder), asc(collections.id));

async function ids(tx: Db, input: ProductInput): Promise<{ categoryId: number; collectionIds: number[] }> {
  const [cat] = await tx.select({ id: categories.id }).from(categories).where(eq(categories.name, input.category)).limit(1);
  if (!cat) throw new AdminError(400, `The category "${input.category}" does not exist in the database. Run the database setup (npm run db:seed) first.`);
  const cols = input.collections.length ? await tx.select({ id: collections.id, slug: collections.slug }).from(collections).where(inArray(collections.slug, input.collections)) : [];
  const missing = input.collections.filter((s) => !cols.some((c) => c.slug === s));
  if (missing.length) throw new AdminError(400, `Unknown collection: ${missing.join(', ')}.`);
  return { categoryId: cat.id, collectionIds: cols.map((c) => c.id) };
}

const columnsFrom = (input: ProductInput, slug: string, categoryId: number, stock: number) => ({
  slug, sku: input.sku, name: input.name, categoryId, short: input.short, description: input.description,
  pricePaise: input.price, comparePricePaise: input.comparePrice, stock, tags: input.tags,
  material: input.material, dimensions: input.dimensions, weight: input.weight,
  // The first picture is the product's main picture (shop cards, search results, social sharing); all pictures are the gallery.
  image: input.images[0]?.src ?? null, imageAlt: input.images[0] ? (input.images[0].alt || input.name) : null,
  video: input.video, seoTitle: input.seoTitle, seoDescription: input.seoDescription, status: input.status,
});

const writeImages = async (tx: Db, productId: number, input: ProductInput) => {
  await tx.delete(productImages).where(eq(productImages.productId, productId));
  if (input.images.length) await tx.insert(productImages).values(input.images.map((im, i) => ({ productId, url: im.src, alt: im.alt || input.name, sortOrder: i })));
};
const writeCollections = async (tx: Db, productId: number, collectionIds: number[]) => {
  await tx.delete(productCollections).where(eq(productCollections.productId, productId));
  if (collectionIds.length) await tx.insert(productCollections).values(collectionIds.map((collectionId) => ({ productId, collectionId })));
};
const variantSku = (input: ProductInput, value: string, given: string | null) => given || `${input.sku}-${slugify(value).toUpperCase() || value}`;

export async function createProduct(db: Db, input: ProductInput, actor: string): Promise<{ id: number; slug: string }> {
  const slug = input.slug || slugify(input.name); if (!slug) throw new AdminError(400, 'Could not make a web address from that name. Please type a slug.');
  try {
    const out = await db.transaction(async (tx0) => {
      const tx = tx0 as unknown as Db; const { categoryId, collectionIds } = await ids(tx, input);
      const [row] = await tx.insert(products).values(columnsFrom(input, slug, categoryId, input.variants ? 0 : input.stock)).returning({ id: products.id, slug: products.slug });
      await writeImages(tx, row.id, input); await writeCollections(tx, row.id, collectionIds);
      if (input.variants) await tx.insert(productVariants).values(input.variants.options.map((o, i) => ({ productId: row.id, optionLabel: input.variants!.label, optionValue: o.value, sku: variantSku(input, o.value, o.sku), stock: o.stock, sortOrder: i })));
      return row;
    });
    await audit(db, actor, 'create', 'product', out.id, `Created product "${input.name}"`);
    return out;
  } catch (e) { return friendlyDbError(e); }
}

/**
 * Saves the product form. Stock is deliberately NOT overwritten for sizes (or the product) that already exist: a customer may have bought something
 * since the form was opened, and saving the form must never undo that sale. Stock is changed from the Inventory screen, which adds or sets safely.
 * New sizes get the stock typed for them. If sizes are removed altogether, the single stock number typed is used.
 */
export async function updateProduct(db: Db, id: number, input: ProductInput, actor: string): Promise<{ id: number; slug: string; previousSlug: string }> {
  const slug = input.slug || slugify(input.name); if (!slug) throw new AdminError(400, 'Could not make a web address from that name. Please type a slug.');
  try {
    const out = await db.transaction(async (tx0) => {
      const tx = tx0 as unknown as Db;
      const [old] = await tx.select().from(products).where(eq(products.id, id)).for('update').limit(1);
      if (!old) throw new AdminError(404, 'That product no longer exists.');
      const { categoryId, collectionIds } = await ids(tx, input);
      const existing = await tx.select().from(productVariants).where(eq(productVariants.productId, id));
      const keepStock = input.variants ? 0 : (existing.length ? input.stock : old.stock);
      const { stock: _s, ...cols } = columnsFrom(input, slug, categoryId, keepStock); void _s;
      await tx.update(products).set({ ...cols, stock: keepStock, updatedAt: new Date() }).where(eq(products.id, id));
      await writeImages(tx, id, input); await writeCollections(tx, id, collectionIds);
      if (!input.variants) { if (existing.length) await tx.delete(productVariants).where(eq(productVariants.productId, id)); }
      else {
        const want = new Map(input.variants.options.map((o, i) => [o.value, { ...o, i }]));
        for (const v of existing) if (!want.has(v.optionValue)) await tx.delete(productVariants).where(eq(productVariants.id, v.id));
        for (const [value, o] of want) {
          const have = existing.find((v) => v.optionValue === value);
          if (have) await tx.update(productVariants).set({ optionLabel: input.variants.label, sortOrder: o.i, sku: variantSku(input, value, o.sku ?? have.sku) }).where(eq(productVariants.id, have.id));
          else await tx.insert(productVariants).values({ productId: id, optionLabel: input.variants.label, optionValue: value, sku: variantSku(input, value, o.sku), stock: o.stock, sortOrder: o.i });
        }
      }
      return { id, slug, previousSlug: old.slug };
    });
    await audit(db, actor, 'update', 'product', id, `Edited product "${input.name}"`);
    return out;
  } catch (e) { return friendlyDbError(e); }
}

export async function setProductStatus(db: Db, id: number, status: 'draft' | 'active' | 'archived', actor: string): Promise<{ slug: string; name: string }> {
  const [r] = await db.update(products).set({ status, updatedAt: new Date() }).where(eq(products.id, id)).returning({ slug: products.slug, name: products.name });
  if (!r) throw new AdminError(404, 'That product no longer exists.');
  await audit(db, actor, 'status', 'product', id, `"${r.name}" is now ${status}`);
  return r;
}

/** Permanently removes a product. Orders already placed keep their own copy of the name and price. */
export async function deleteProduct(db: Db, id: number, actor: string): Promise<{ slug: string }> {
  const [r] = await db.delete(products).where(eq(products.id, id)).returning({ slug: products.slug, name: products.name });
  if (!r) throw new AdminError(404, 'That product no longer exists.');
  await audit(db, actor, 'delete', 'product', id, `Deleted product "${r.name}"`);
  return { slug: r.slug };
}

/* ---------- Inventory ---------- */

export interface StockLineRow { key: string; productId: number; variantId: number | null; name: string; sku: string; option: string | null; stock: number; status: 'draft' | 'active' | 'archived'; slug: string }

/** One row per thing that has its own count: a product without sizes, or each size of a product with sizes. */
export async function stockLines(db: Db, opts: { q?: string; filter?: 'low' | 'out' } = {}): Promise<StockLineRow[]> {
  const [prods, vars] = await Promise.all([
    db.select({ id: products.id, slug: products.slug, sku: products.sku, name: products.name, stock: products.stock, status: products.status }).from(products).orderBy(asc(products.name)),
    db.select().from(productVariants).orderBy(asc(productVariants.productId), asc(productVariants.sortOrder), asc(productVariants.id)),
  ]);
  const rows: StockLineRow[] = [];
  for (const p of prods) {
    const mine = vars.filter((v) => v.productId === p.id);
    if (!mine.length) rows.push({ key: `p${p.id}`, productId: p.id, variantId: null, name: p.name, sku: p.sku, option: null, stock: p.stock, status: p.status, slug: p.slug });
    else for (const v of mine) rows.push({ key: `v${v.id}`, productId: p.id, variantId: v.id, name: p.name, sku: v.sku ?? p.sku, option: `${v.optionLabel} ${v.optionValue}`, stock: v.stock, status: p.status, slug: p.slug });
  }
  const t = (opts.q ?? '').trim().toLowerCase();
  return rows.filter((r) => (!t || `${r.name} ${r.sku} ${r.option ?? ''}`.toLowerCase().includes(t))
    && (opts.filter === 'out' ? r.stock <= 0 : opts.filter === 'low' ? r.stock > 0 && r.stock <= LOW_STOCK : true));
}

/** Sets stock to an exact number, or adds/removes pieces. Returns the new count. Never lets stock go below zero. */
export async function adjustStock(db: Db, a: StockAdjust, actor: string): Promise<{ stock: number; name: string; slug: string }> {
  return db.transaction(async (tx) => {
    const [p] = await tx.select({ id: products.id, name: products.name, slug: products.slug, stock: products.stock }).from(products).where(eq(products.id, a.productId)).for('update').limit(1);
    if (!p) throw new AdminError(404, 'That product no longer exists.');
    let old: number; let label = p.name;
    if (a.variantId !== null) {
      const [v] = await tx.select().from(productVariants).where(and(eq(productVariants.id, a.variantId), eq(productVariants.productId, a.productId))).for('update').limit(1);
      if (!v) throw new AdminError(404, 'That size no longer exists.');
      old = v.stock; label = `${p.name} (${v.optionLabel} ${v.optionValue})`;
    } else {
      const has = await tx.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.productId, a.productId)).limit(1);
      if (has.length) throw new AdminError(400, 'This product has sizes. Change the stock of each size instead.');
      old = p.stock;
    }
    const next = a.mode === 'set' ? a.value : old + a.value;
    if (next < 0) throw new AdminError(409, `Stock cannot go below zero (there are only ${old} now).`);
    if (next > 1_000_000) throw new AdminError(400, 'That is more stock than the shop can hold.');
    if (a.variantId !== null) await tx.update(productVariants).set({ stock: next }).where(eq(productVariants.id, a.variantId));
    else await tx.update(products).set({ stock: next }).where(eq(products.id, a.productId));
    await tx.update(products).set({ updatedAt: new Date() }).where(eq(products.id, a.productId));
    await audit(tx as unknown as Db, actor, 'stock', 'product', a.productId, `${label}: stock ${old} → ${next}`);
    return { stock: next, name: p.name, slug: p.slug };
  });
}
