import type { Product, Query, Tag } from './types';

export const PAGE_SIZE = 12;

// Everything the pages need from "the catalogue". There are two implementations of this one contract:
// the in-memory demo (no setup needed) and the PostgreSQL one (src/db/catalog.ts). Both are tested against the same expectations.
export interface CatalogService {
  all(): Promise<Product[]>;
  list(q: Query): Promise<{ items: Product[]; total: number }>;
  bySlug(slug: string): Promise<Product | null>;
  byIds(ids: number[]): Promise<Product[]>;
  related(p: Product, n?: number): Promise<Product[]>;
  featured(tag: Tag, n?: number): Promise<Product[]>;
  suggest(q: string, n?: number): Promise<Product[]>;
}
