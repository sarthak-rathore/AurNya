import { revalidatePath, revalidateTag } from 'next/cache';

// Admin changes must show on the shop right away, not after the one-minute page cache. Route handlers only.
export function refreshStore(slugs: (string | null | undefined)[] = []) {
  try {
    for (const s of new Set(slugs.filter(Boolean) as string[])) revalidatePath(`/product/${s}`);
    revalidatePath('/'); revalidatePath('/shop'); revalidatePath('/sitemap.xml');
    revalidatePath('/category/[slug]', 'page'); revalidatePath('/collection/[slug]', 'page');
  } catch (e) { console.error('[admin] revalidate failed', e); }
}
export function refreshSettings() {
  try { revalidateTag('settings', { expire: 0 }); revalidatePath('/', 'layout'); } catch (e) { console.error('[admin] revalidate failed', e); }
}
