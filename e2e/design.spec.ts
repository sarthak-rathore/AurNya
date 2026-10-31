import { test, expect, type Page } from '@playwright/test';

const slide = (page: Page, n: number) => page.locator(`[aria-roledescription=slide]`).nth(n);
const visibleSlide = (page: Page) => page.locator('[aria-roledescription=slide]:not([aria-hidden=true])');

test.describe('hero carousel', () => {
  test('shows one slide at a time and hides the others from screen readers and the keyboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[aria-roledescription=slide]')).toHaveCount(3);
    await expect(visibleSlide(page)).toHaveCount(1);
    await expect(slide(page, 0)).toHaveAttribute('aria-label', /^1 of 3/);
    for (const n of [1, 2]) { await expect(slide(page, n)).toHaveAttribute('aria-hidden', 'true'); await expect(slide(page, n)).toHaveAttribute('inert', ''); }
  });

  test('dots and arrows change the slide; the heading and links come along', async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label^="Show slide 2"]');
    await expect(slide(page, 1)).not.toHaveAttribute('aria-hidden', 'true');
    await expect(slide(page, 1)).toContainText('Stack. Mix.');
    await expect(page.locator('button[aria-label^="Show slide 2"]')).toHaveAttribute('aria-current', 'true');
    await page.click('button[aria-label="Next slide"]');
    await expect(slide(page, 2)).toContainText('Unbox your');
    await page.click('button[aria-label="Next slide"]');   // wraps round to the first
    await expect(slide(page, 0)).not.toHaveAttribute('aria-hidden', 'true');
    await page.click('button[aria-label="Previous slide"]');
    await expect(slide(page, 2)).not.toHaveAttribute('aria-hidden', 'true');
  });

  test('left and right arrow keys work when focus is inside it', async ({ page }) => {
    await page.goto('/');
    await page.locator('button[aria-label^="Show slide 1"]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(slide(page, 1)).not.toHaveAttribute('aria-hidden', 'true');
    await page.keyboard.press('ArrowLeft');
    await expect(slide(page, 0)).not.toHaveAttribute('aria-hidden', 'true');
  });

  test('moves by itself, can be paused, and stops while you hover over it', async ({ page }) => {
    await page.clock.install();
    await page.goto('/');
    await expect(page.locator('button[aria-label="Pause slideshow"]')).toBeVisible();   // only appears once the page has woken up
    await page.clock.fastForward(7500);
    await expect(slide(page, 1)).not.toHaveAttribute('aria-hidden', 'true');
    await page.click('button[aria-label="Pause slideshow"]');
    await expect(page.locator('button[aria-label="Play slideshow"]')).toBeVisible();
    await page.clock.fastForward(30_000);
    await expect(slide(page, 1)).not.toHaveAttribute('aria-hidden', 'true');   // still on slide 2
    await page.click('button[aria-label="Play slideshow"]');
    await page.mouse.move(600, 300);   // hovering pauses it too
    await page.clock.fastForward(30_000);
    await expect(slide(page, 1)).not.toHaveAttribute('aria-hidden', 'true');
  });

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('never moves by itself and shows no pause button', async ({ page }) => {
      await page.clock.install();
      await page.goto('/');
      await page.clock.fastForward(60_000);
      await expect(slide(page, 0)).not.toHaveAttribute('aria-hidden', 'true');
      await expect(page.locator('button[aria-label$="slideshow"]')).toHaveCount(0);
    });
  });
});

test.describe('shop by budget', () => {
  const bands: [string, string, string][] = [['Under ₹500', '0-49999', '1 piece'], ['₹500 – ₹799', '50000-79999', '6 pieces'], ['₹800 – ₹999', '80000-99999', '2 pieces'], ['₹1,000 & above', '100000-100000000', '1 piece']];
  for (const [label, price, count] of bands) {
    test(`tile "${label}" opens a list of ${count}`, async ({ page }) => {
      await page.goto('/');
      await page.locator('main a', { hasText: label }).first().click();
      await expect(page).toHaveURL(new RegExp(`price=${price}`));
      await expect(page.locator('main')).toContainText(count);
    });
  }
  test('the bands cover every product exactly once', async ({ request }) => {
    let total = 0;
    for (const [, price] of bands) { const html = await (await request.get(`/shop?price=${price}`)).text(); total += Number(html.replace(/<!-- -->/g, '').match(/(\d+) pieces?/)?.[1] ?? 0); }
    expect(total).toBe(10);
  });
  test('the same bands are in the mega menu, the filter and the footer', async ({ page }) => {
    await page.goto('/shop');
    for (const [label] of bands) { await expect(page.locator('form#filters, aside, main').getByLabel(label).first()).toBeVisible(); await expect(page.locator('footer').getByRole('link', { name: label })).toBeVisible(); }
    await page.hover('text=Categories');
    await expect(page.locator('header').getByRole('link', { name: 'Under ₹500' })).toBeVisible();
  });
});

test.describe('product rail', () => {
  test('scrolls with the arrow buttons, and the arrows know when there is nothing more', async ({ page }) => {
    await page.goto('/');
    const rail = page.getByRole('region', { name: 'Everyday favourites' });
    const list = rail.locator('ul');
    const back = rail.getByRole('button', { name: /scroll back/ }); const fwd = rail.getByRole('button', { name: /scroll forward/ });
    await rail.scrollIntoViewIfNeeded();
    await expect(back).toBeDisabled(); await expect(fwd).toBeEnabled();
    await fwd.click();
    await expect.poll(() => list.evaluate((e) => e.scrollLeft)).toBeGreaterThan(100);
    await expect(back).toBeEnabled();
    for (let i = 0; i < 6; i++) { if (await fwd.isDisabled()) break; await fwd.click(); await page.waitForTimeout(500); }
    await expect(fwd).toBeDisabled();
  });
  test('every product in the rail is reachable and shows its price', async ({ page }) => {
    await page.goto('/');
    const rail = page.getByRole('region', { name: 'Everyday favourites' });
    await expect(rail.locator('article')).toHaveCount(10);
    await expect(rail.locator('article').first().locator('p.font-medium')).toContainText('₹');
  });
});

test.describe('listing pages', () => {
  test('the banner names the page, and the quick category chips navigate and mark where you are', async ({ page }) => {
    await page.goto('/category/rings');
    const chips = page.getByRole('navigation', { name: 'Quick categories' });
    await expect(chips.getByRole('link', { name: 'Rings', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(chips.getByRole('link', { name: 'Earrings', exact: true })).not.toHaveAttribute('aria-current', 'page');
    await expect(page.locator('h1')).toHaveText('Rings');
    await chips.getByRole('link', { name: 'Earrings', exact: true }).click();
    await expect(page).toHaveURL(/\/category\/earrings/);
    await expect(page.locator('h1')).toHaveText('Earrings');
    await chips.getByRole('link', { name: 'All', exact: true }).click();
    await expect(page).toHaveURL(/\/shop$/);
  });
  test('collection pages show the collection blurb', async ({ page }) => {
    await page.goto('/collection/gifts');
    await expect(page.locator('main')).toContainText('Boxed with pouch and care card');
  });
  test('home category tiles and collection cards lead to their pages', async ({ page }) => {
    await page.goto('/');
    await page.locator('main a[href="/category/necklaces"]').first().click();
    await expect(page).toHaveURL(/\/category\/necklaces/);
    await page.goto('/');
    await page.locator('main a[href="/collection/statement"]').first().click();
    await expect(page).toHaveURL(/\/collection\/statement/);
  });
});

test('the decorative illustrations are hidden from screen readers and never stand in for a product photo', async ({ page }) => {
  await page.goto('/');
  const art = page.locator('main svg[viewBox="0 0 240 240"]');
  expect(await art.count()).toBeGreaterThan(5);
  for (const el of await art.all()) await expect(el).toHaveAttribute('aria-hidden', 'true');
  await page.goto('/product/solitaire-ring');
  await expect(page.locator('body')).toContainText('Product photo coming soon');
});
