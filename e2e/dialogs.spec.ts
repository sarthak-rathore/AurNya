import { test, expect, type Page } from '@playwright/test';

// Menus, the bag and search are dialogs: focus must stay inside, the page behind must not scroll,
// Escape must close them and focus must go back to the button that opened them.
const stays = async (page: Page, selector: string, key: string, presses: number) => {
  for (let i = 0; i < presses; i++) { await page.keyboard.press(key); expect(await page.evaluate((s) => !!document.activeElement?.closest(s), selector), `${key} #${i + 1}`).toBe(true); }
};

test('bag dialog traps focus, locks scroll and returns focus', async ({ page }) => {
  await page.goto('/shop');
  await page.click('button[aria-label^="Shopping bag"]');
  await expect(page.locator('aside[aria-label="Shopping bag"]')).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await stays(page, 'aside[aria-label="Shopping bag"]', 'Tab', 14);
  await stays(page, 'aside[aria-label="Shopping bag"]', 'Shift+Tab', 14);
  await page.keyboard.press('Escape');
  await expect(page.locator('aside[aria-label="Shopping bag"]')).toBeHidden();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toMatch(/^Shopping bag/);
});

test('search dialog focuses the input, traps focus and returns focus', async ({ page }) => {
  await page.goto('/shop');
  await page.click('button[aria-label^="Search"]');
  await expect(page.locator('#site-search')).toBeFocused();
  await stays(page, '[role=dialog][aria-label="Search"]', 'Tab', 6);
  await page.keyboard.press('Escape');
  await expect(page.locator('button[aria-label^="Search"]')).toBeFocused();
});

test.describe('phone menu', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test('opens, traps focus, closes with Escape and returns focus', async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label="Open menu"]');
    await expect(page.locator('#mobile-nav')).toBeVisible();
    await expect(page.locator('button[aria-label="Close menu"]')).toBeFocused();
    await stays(page, '#mobile-nav', 'Tab', 25);
    await page.keyboard.press('Escape');
    await expect(page.locator('button[aria-label="Open menu"]')).toBeFocused();
  });
});
