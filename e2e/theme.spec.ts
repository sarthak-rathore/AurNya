import { test, expect } from '@playwright/test';

const theme = (page: import('@playwright/test').Page) => page.evaluate(() => document.documentElement.dataset.theme);
const bg = (page: import('@playwright/test').Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test.describe('follows the device when nothing is saved', () => {
  test.use({ colorScheme: 'dark' });
  test('device in dark mode shows dark', async ({ page }) => {
    await page.goto('/');
    expect(await theme(page)).toBe('dark');
    expect(await bg(page)).toBe('rgb(24, 21, 29)');
    expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe('dark');
  });
});
test.describe('light device', () => {
  test.use({ colorScheme: 'light' });
  test('device in light mode shows light', async ({ page }) => {
    await page.goto('/');
    expect(await theme(page)).toBe('light');
    expect(await bg(page)).toBe('rgb(251, 247, 238)');
  });

  test('header button switches theme and the choice survives a reload and other pages', async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label="Switch to dark mode"]');
    expect(await theme(page)).toBe('dark');
    expect(await page.evaluate(() => localStorage.getItem('aur_theme'))).toBe('dark');
    await expect(page.getByRole('status').filter({ hasText: 'Dark mode on' })).toHaveCount(1);
    await page.reload();
    expect(await theme(page)).toBe('dark');
    await page.goto('/shop');
    expect(await theme(page)).toBe('dark');
    await page.click('button[aria-label="Switch to light mode"]');
    expect(await theme(page)).toBe('light');
  });

  test('no flash: the right theme is painted before the page wakes up', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('aur_theme', 'dark'));
    await page.goto('/', { waitUntil: 'commit' });
    await page.waitForFunction(() => document.readyState !== 'loading' || !!document.body);
    // As soon as the document exists the theme is already set, before React has run.
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
    expect(await bg(page)).toBe('rgb(24, 21, 29)');
  });

  test('footer Light / Dark / System choice works, and System hands control back to the device', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await footer.getByText('Dark', { exact: true }).click();
    expect(await theme(page)).toBe('dark');
    await expect(footer.locator('input[value=dark]')).toBeChecked();
    await footer.getByText('System', { exact: true }).click();
    expect(await theme(page)).toBe('light'); // device is light
    expect(await page.evaluate(() => localStorage.getItem('aur_theme'))).toBeNull();
    await page.emulateMedia({ colorScheme: 'dark' }); // the device switches while on System
    await expect.poll(() => theme(page)).toBe('dark');
  });

  test('the footer switch is keyboard operable (arrow keys change the choice)', async ({ page }) => {
    await page.goto('/');
    await page.locator('footer input[value=light]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('footer input[value=dark]')).toBeChecked();
    expect(await theme(page)).toBe('dark');
  });

  test('phone bar colour (theme-color) follows the theme', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[name=theme-color]')).toHaveAttribute('content', '#FBF7EE');
    await page.click('button[aria-label="Switch to dark mode"]');
    await expect(page.locator('meta[name=theme-color]')).toHaveAttribute('content', '#18151D');
  });

  test('a theme changed in one tab updates another open tab', async ({ context, page }) => {
    await page.goto('/');
    const other = await context.newPage();
    await other.goto('/shop');
    await page.click('button[aria-label="Switch to dark mode"]');
    await expect.poll(() => theme(other)).toBe('dark');
  });
});

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'light' });
  test('the phone menu has the appearance switch', async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label="Open menu"]');
    const nav = page.locator('#mobile-nav');
    await nav.getByText('Dark', { exact: true }).click();
    expect(await theme(page)).toBe('dark');
    await expect(nav.locator('input[value=dark]')).toBeChecked();
  });
});
