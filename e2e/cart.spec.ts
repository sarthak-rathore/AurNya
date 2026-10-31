import { test, expect } from '@playwright/test';

const drawer = 'aside[aria-label="Shopping bag"]';
const bagBadge = 'button[aria-label^="Shopping bag"]';

test.describe('product options, bag and coupon', () => {
  test('a size must be chosen before adding a ring', async ({ page }) => {
    await page.goto('/product/solitaire-ring');
    await page.click('text=Add to bag');
    await expect(page.locator('p[role=alert]')).toContainText('choose a size');
    await expect(page.locator(bagBadge)).not.toContainText(/\d/);
  });

  test('sold-out products cannot be added', async ({ page }) => {
    await page.goto('/product/twist-band-ring');
    await expect(page.locator('button:has-text("Add to bag")')).toBeDisabled();
    await expect(page.locator('body')).toContainText('Currently sold out');
  });

  test('add two, apply coupon, change quantity, remove', async ({ page }) => {
    await page.goto('/product/solitaire-ring');
    await page.click('label:has-text("7")');
    await page.click('button[aria-label="Increase quantity"]');
    await page.click('text=Add to bag');
    await expect(page.locator(drawer)).toBeVisible();
    await expect(page.locator(drawer)).toContainText('₹1,398');
    await expect(page.locator(bagBadge)).toHaveText('2');

    await page.fill('#coupon', 'nope');
    await page.click('button:has-text("Apply")');
    await expect(page.locator(drawer)).toContainText('not valid');

    await page.fill('#coupon', 'aurdemo10');
    await page.click('button:has-text("Apply")');
    await expect(page.locator(drawer)).toContainText('−₹140');
    await expect(page.locator(drawer)).toContainText('₹1,258');

    await page.click('button[aria-label="Decrease Solitaire Ring"]');
    await expect(page.locator(bagBadge)).toHaveText('1');
    await page.click('text=Remove');
    await expect(page.locator(drawer)).toContainText('Your bag is empty');
  });

  test('the bag survives a page reload', async ({ page }) => {
    await page.goto('/product/everyday-hoops');
    await page.click('text=Add to bag');
    await page.reload();
    await expect(page.locator(bagBadge)).toHaveText('1');
  });
});

test.describe('the server checks the bag', () => {
  const stored = (lines: object[]) => (page: import('@playwright/test').Page) => page.addInitScript((l) => localStorage.setItem('aur_cart', JSON.stringify(l)), lines);
  const line = (over: object) => ({ productId: 6, slug: 'everyday-hoops', name: 'Everyday Hoops', category: 'Earrings', pricePaise: 49900, variant: null, qty: 1, ...over });

  test('says when prices and stock have been checked', async ({ page }) => {
    await page.goto('/product/everyday-hoops');
    await page.click('text=Add to bag');
    await expect(page.locator(drawer)).toContainText('Prices and stock checked by our server');
  });

  test('a price changed in the browser is corrected by the server, and the shopper is told', async ({ page }) => {
    await stored([line({ pricePaise: 1, qty: 2 })])(page);
    await page.goto('/');
    await page.click(bagBadge);
    await expect(page.locator(drawer)).toContainText('Price is now ₹499');
    await expect(page.locator(drawer)).toContainText('₹998');
    await expect(page.locator(drawer)).not.toContainText('₹2');   // the fake price never appears in a total
    await page.click('button:has-text("Update bag")');
    await expect(page.locator(drawer).locator('[role=alert]')).toHaveCount(0);
    await expect(page.locator(drawer)).toContainText('₹998');
  });

  test('a product that no longer exists is flagged and can be removed in one tap', async ({ page }) => {
    await stored([line({ productId: 9999, slug: 'gone', name: 'Gone Ring' })])(page);
    await page.goto('/');
    await page.click(bagBadge);
    await expect(page.locator(drawer)).toContainText('No longer available');
    await page.click('button:has-text("Update bag")');
    await expect(page.locator(drawer)).toContainText('Your bag is empty');
  });

  test('asking for more than is in stock is cut down and explained', async ({ page }) => {
    await stored([line({ productId: 5, slug: 'solitaire-ring', name: 'Solitaire Ring', category: 'Rings', pricePaise: 69900, variant: '9', qty: 5 })])(page);
    await page.goto('/');
    await page.click(bagBadge);
    await expect(page.locator(drawer)).toContainText('Only 1 available, so we counted 1');
    await expect(page.locator(drawer)).toContainText('₹699');
    await page.click('button:has-text("Update bag")');
    await expect(page.locator(drawer).locator('[role=alert]')).toHaveCount(0);
    await expect(page.locator(bagBadge)).toHaveText('1');
  });

  test('if the server cannot be reached the bag still works and says its numbers are an estimate', async ({ page }) => {
    await page.route('**/api/cart/quote', (r) => r.abort());
    await page.goto('/product/everyday-hoops');
    await page.click('text=Add to bag');
    await expect(page.locator(drawer)).toContainText('₹499');
    await expect(page.locator(drawer)).toContainText('could not double-check prices');
  });
});
