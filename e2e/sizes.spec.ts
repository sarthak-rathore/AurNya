import { test, expect } from '@playwright/test';

test.describe('stock is tracked per size', () => {
  test('a sold-out size cannot be chosen, and says why to screen readers', async ({ page }) => {
    await page.goto('/product/petal-stack-ring');
    const sold = page.locator('input[name=variant][value="9"]');
    await expect(sold).toBeDisabled();
    await expect(page.locator('label:has(input[value="9"])')).toContainText('(sold out)');
    for (const size of ['6', '7', '8']) await expect(page.locator(`input[name=variant][value="${size}"]`)).toBeEnabled();
  });

  test('the quantity limit follows the chosen size', async ({ page }) => {
    await page.goto('/product/solitaire-ring');
    const qty = page.locator('output');
    await page.click('label:has-text("9")');   // only 1 left
    await page.click('button[aria-label="Increase quantity"]'); await page.click('button[aria-label="Increase quantity"]');
    await expect(qty).toHaveText('1');
    await expect(page.getByText('Only 1 left in size 9')).toBeVisible();
    await page.click('label:has-text("6")');   // 3 left
    for (let i = 0; i < 5; i++) await page.click('button[aria-label="Increase quantity"]');
    await expect(qty).toHaveText('3');
  });

  test('switching to a size with less stock lowers a quantity that is now too high', async ({ page }) => {
    await page.goto('/product/solitaire-ring');
    await page.click('label:has-text("6")');
    for (let i = 0; i < 3; i++) await page.click('button[aria-label="Increase quantity"]');
    await expect(page.locator('output')).toHaveText('3');
    await page.click('label:has-text("9")');
    await expect(page.locator('output')).toHaveText('1');
  });
});
