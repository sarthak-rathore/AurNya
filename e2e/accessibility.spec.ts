import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Automated WCAG 2.2 AA checks. These catch many problems but are not a substitute for testing with a real screen reader.
const pages = ['/', '/shop', '/category/rings', '/collection/gifts', '/product/solitaire-ring', '/product/twist-band-ring', '/about', '/info/faq', '/info/tracking', '/info/contact', '/wishlist'];
// Both colour themes are checked, because contrast problems often hide in one of them.
for (const [name, size, scheme] of [['desktop light', { width: 1360, height: 900 }, 'light'], ['desktop dark', { width: 1360, height: 900 }, 'dark'], ['phone light', { width: 390, height: 844 }, 'light'], ['phone dark', { width: 390, height: 844 }, 'dark']] as const) {
  test.describe(name, () => {
    test.use({ viewport: size, reducedMotion: 'reduce', colorScheme: scheme });
    for (const u of pages) {
      test(`no accessibility violations on ${u}`, async ({ page }) => {
        await page.goto(u);
        expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(scheme);
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
        expect(r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes[0].html.slice(0, 80)})`)).toEqual([]);
      });
    }
  });
}

test.describe('dialogs in dark mode', () => {
  test.use({ colorScheme: 'dark', reducedMotion: 'reduce' });
  test('open bag, search and menu have no violations', async ({ page }) => {
    await page.goto('/product/solitaire-ring');
    await page.click('label:has-text("7")'); await page.click('text=Add to bag');
    await expect(page.locator('aside[aria-label="Shopping bag"]')).toBeVisible();
    await page.fill('#coupon', 'AURDEMO10'); await page.click('button:has-text("Apply")');
    let r = await new AxeBuilder({ page }).include('aside[aria-label="Shopping bag"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.map((v) => v.id + ': ' + v.help)).toEqual([]);
    await page.keyboard.press('Escape');
    await page.click('button[aria-label^="Search"]'); await page.fill('#site-search', 'hoop');
    await expect(page.locator('[role=option]').first()).toBeVisible();
    r = await new AxeBuilder({ page }).include('[role=dialog][aria-label="Search"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.map((v) => v.id + ': ' + v.help)).toEqual([]);
  });
});
