import type { Query } from './types';
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
export function toQuery(sp: SP): Query {
  const n = Number(one(sp.page));
  return { q: one(sp.q), category: one(sp.category), collection: one(sp.collection), tag: one(sp.tag), price: one(sp.price), stock: one(sp.stock), sort: one(sp.sort), page: Number.isFinite(n) && n > 0 ? Math.floor(n) : 1 };
}
// Filtered/paged URLs should not compete with the clean page in search results.
export const isFiltered = (sp: SP): boolean => ['q', 'price', 'stock', 'sort', 'page'].some((k) => one(sp[k]));
