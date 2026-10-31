import { test, expect } from '@playwright/test';

// These only run when the site is started with a DATABASE_URL (see README, "Testing against a database").
test.skip(!process.env.DATABASE_URL, 'only runs when a database is connected');

test('the announcement bar shows the text stored in the database', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Announcement' })).toContainText(process.env.E2E_ANNOUNCEMENT || 'Phase 2 build');
});

test('products on the shop page come from the database', async ({ page }) => {
  await page.goto('/shop');
  await expect(page.locator('main')).toContainText('10 pieces');
});
