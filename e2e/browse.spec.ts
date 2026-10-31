import { test, expect } from '@playwright/test';

test.describe('browsing', () => {
  test('home page shows the hero heading, a search bar and the main menu', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Adorn your');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('header nav[aria-label=Main]')).toBeVisible();
    await expect(page.locator('button[aria-label^="Search"]')).toContainText('Search rings, earrings, necklaces');
  });

  test('desktop mega menu opens on hover', async ({ page }) => {
    await page.goto('/');
    await page.hover('text=Categories');
    await expect(page.getByText('Shop by category').first()).toBeVisible();
  });

  for (const [url, expected] of [['/shop', '10 pieces'], ['/shop?category=Rings', '3 pieces'], ['/shop?stock=1', '9 pieces'], ['/shop?price=0-59900', '3 pieces'], ['/shop?tag=new', '3 pieces'], ['/shop?q=zzz', '0 pieces']] as const) {
    test(`filters: ${url} → ${expected}`, async ({ page }) => {
      await page.goto(url);
      await expect(page.locator('main')).toContainText(expected);
    });
  }

  test('empty search shows a helpful empty state', async ({ page }) => {
    await page.goto('/shop?q=zzz');
    await expect(page.getByText('No pieces found')).toBeVisible();
  });

  test('filter form applies category and sort', async ({ page }) => {
    await page.goto('/shop');
    await page.check('input[name=category][value=Rings]');
    await page.selectOption('select[name=sort]', 'price-asc');
    await page.click('button:has-text("Apply")');
    await expect(page).toHaveURL(/category=Rings/);
    const prices = await page.locator('article p.font-medium').allTextContents();
    expect(prices.map((p) => p.replace(/[^\d]/g, ''))).toEqual(['549', '599', '699']);
  });

  test('keyboard search: suggestions, arrow keys, Enter', async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label^="Search"]');
    await page.fill('#site-search', 'hoop');
    await expect(page.locator('[role=option]:has-text("Everyday Hoops")')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#site-search')).toHaveAttribute('aria-activedescendant', /suggestion-/);
    await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/product\/everyday-hoops$/);
  });

  test('clicking a suggestion opens the product', async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label^="Search"]');
    await page.fill('#site-search', 'hoop');
    await page.locator('[role=option]:has-text("Everyday Hoops")').click();
    await expect(page).toHaveURL(/\/product\/everyday-hoops$/);
  });

  test('search with no match offers a way forward, Enter goes to results', async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label^="Search"]');
    await page.fill('#site-search', 'zzzz');
    await expect(page.locator('#search-empty')).toContainText('No matches');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/shop\?q=zzzz/);
  });

  test('wishlist: save from shop, see it on the wishlist page', async ({ page }) => {
    await page.goto('/shop');
    await page.click('button[aria-label="Add to wishlist: Everyday Hoops"]');
    await expect(page.locator('a[aria-label="Wishlist"]')).toContainText('1');
    await page.goto('/wishlist');
    await expect(page.locator('main')).toContainText('Everyday Hoops');
  });

  test('unknown pages return a real 404', async ({ request }) => {
    for (const u of ['/nope', '/product/nope', '/category/nope', '/collection/nope', '/info/nope']) expect((await request.get(u)).status(), u).toBe(404);
  });

  test('every public page loads', async ({ request }) => {
    for (const u of ['/', '/shop', '/category/rings', '/collection/gifts', '/product/solitaire-ring', '/about', '/wishlist', '/info/faq', '/info/shipping', '/info/returns', '/info/privacy', '/info/terms', '/info/care', '/info/tracking', '/info/contact']) expect((await request.get(u)).status(), u).toBe(200);
  });
});
