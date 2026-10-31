/**
 * DEMO IMAGE STRATEGY — AurNya Storefront
 * =========================================
 *
 * All 39 product/hero images in `public/images/` are DEMO VISUALS.
 * They populate the storefront before the store owner uploads real photos
 * via the Phase 6 admin panel.
 *
 * HOW IT WORKS (Phase 6+):
 * ─────────────────────────
 * 1. Hero / section images:
 *    - Stored in the `settings` DB table under the key `hero_images` (JSON blob).
 *    - `getHeroImages()` in `src/lib/get-hero-images.ts` reads this setting.
 *    - Falls back to `DEMO_HERO_IMAGES` in `src/lib/hero-images.ts` when not set.
 *    - Revalidates every 60 s (Next.js unstable_cache), tagged as `settings`.
 *
 * 2. Product images:
 *    - Each `Product` has an optional `image` field (see `src/lib/types.ts`).
 *    - Demo products in `src/data/products.ts` pre-fill this field with demo images.
 *    - When a product row is saved to the DB with a real image URL, the DB value wins
 *      (the catalog layer in `src/lib/catalog.ts` prefers DB rows over demo data).
 *    - No code deletion required — setting a DB value automatically replaces the demo.
 *
 * UPDATING DEMO IMAGES:
 * ─────────────────────
 * - Drop new .png files into `public/images/` (URL-safe names, lowercase, hyphens).
 * - Update `DEMO_HERO_IMAGES` in `hero-images.ts` or product rows in `products.ts`.
 * - The static demo images are NEVER shown once the admin has set a DB override.
 */
export {};
