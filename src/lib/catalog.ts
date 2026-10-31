import { products } from '@/data/products';
import { createDbCatalog } from '@/db/catalog';
import { getDb } from '@/db/client';
import { createMemoryCatalog } from './catalog-memory';
import type { CatalogService } from './catalog-types';

export { PAGE_SIZE } from './catalog-types';
export type { CatalogService } from './catalog-types';

// THE swap point. With DATABASE_URL set, the whole site reads from PostgreSQL. Without it, the site runs on the built-in demo data.
const db = getDb();
export const catalog: CatalogService = db ? createDbCatalog(db) : createMemoryCatalog(products);
