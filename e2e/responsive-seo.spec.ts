import { test, expect } from '@playwright/test';

test.describe('layout never scrolls sideways', () => {
  for (const width of [320, 390, 768, 1360]) {
    test(`at ${width}px wide`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const u of ['/', '/shop', '/product/solitaire-ring', '/info/faq', '/about']) {
        await page.goto(u);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${u} @ ${width}`).toBeLessThanOrEqual(0);
      }
    });
  }
  test('header logo never overlaps the menu or search buttons', async ({ page }) => {
    await page.goto('/');
    for (const width of [320, 360, 390, 430, 600, 768, 1100]) {
      await page.setViewportSize({ width, height: 800 });
      const r = await page.evaluate(() => { const b = (e: string) => document.querySelector(e)!.getBoundingClientRect(); return { l: b('a[aria-label="AurNya home"]'), m: b('button[aria-label="Open menu"]'), s: b('button[aria-label^="Search"]') }; });
      expect(r.l.left, `${width}px`).toBeGreaterThanOrEqual(r.m.right - 0.5);
      expect(r.l.right, `${width}px`).toBeLessThanOrEqual(r.s.left + 0.5);
    }
  });
});

test.describe('SEO and security basics', () => {
  test('product page has a title, canonical link, Open Graph image and structured data', async ({ page }) => {
    await page.goto('/product/solitaire-ring');
    await expect(page).toHaveTitle(/Solitaire Ring/);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', /\/product\/solitaire-ring$/);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    const types: string[] = [];
    for (const s of await page.locator('script[type="application/ld+json"]').allTextContents()) { const d = JSON.parse(s); for (const n of d['@graph'] ?? [d]) types.push(n['@type']); }
    expect(types).toEqual(expect.arrayContaining(['Product', 'BreadcrumbList']));
  });
  test('home page has Organization and WebSite structured data', async ({ page }) => {
    await page.goto('/');
    const types: string[] = [];
    for (const s of await page.locator('script[type="application/ld+json"]').allTextContents()) { const d = JSON.parse(s); for (const n of d['@graph'] ?? [d]) types.push(n['@type']); }
    expect(types).toEqual(expect.arrayContaining(['Organization', 'WebSite']));
  });
  test('search-result and paged pages are kept out of search engines', async ({ page }) => {
    await page.goto('/shop?q=ring');
    await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/);
    await page.goto('/shop');
    await expect(page.locator('meta[name=robots][content*=noindex]')).toHaveCount(0);
  });
  test('sitemap lists products; robots points to the sitemap', async ({ request }) => {
    const sm = await (await request.get('/sitemap.xml')).text();
    expect(sm).toContain('/product/solitaire-ring');
    expect((sm.match(/<loc>/g) ?? []).length).toBeGreaterThanOrEqual(25);
    expect(await (await request.get('/robots.txt')).text()).toMatch(/Sitemap:/i);
  });
  test('security headers are sent', async ({ request }) => {
    const h = (await request.get('/')).headers();
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['x-frame-options']).toBeTruthy();
    expect(h['referrer-policy']).toBeTruthy();
    expect(h['x-powered-by']).toBeUndefined();
  });
  test('search API trims input and never errors', async ({ request }) => {
    const r = await request.get('/api/search?q=' + 'a'.repeat(500));
    expect(r.status()).toBe(200);
    expect(Array.isArray((await r.json()).items)).toBe(true);
  });
});
