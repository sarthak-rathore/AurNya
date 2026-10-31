import type { MetadataRoute } from 'next';
import { site } from '@/config/site';
import { catalog } from '@/lib/catalog';
import { siteUrl } from '@/lib/env';
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const u = siteUrl(); const products = await catalog.all().catch(() => []);   // still list every other page if the database is briefly unreachable
  const paths = ['', '/shop', '/about', ...Object.keys(site.info).map((k) => `/info/${k}`), ...site.categories.map((c) => `/category/${c.toLowerCase()}`), ...site.collections.map((c) => `/collection/${c.slug}`), ...products.map((p) => `/product/${p.slug}`)];
  return paths.map((p) => ({ url: `${u}${p}`, lastModified: new Date() }));
}
