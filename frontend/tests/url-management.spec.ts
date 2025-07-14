import { test, expect } from '@playwright/test';

test.describe.serial('URL Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should add a new URL', async ({ page }) => {
    // await page.getByRole('button', { name: 'Add URL' }).click();
    const url = `https://example.com/${Math.random()}`;
    await page.getByLabel('URL').fill(url);
    await page.getByRole('button', { name: 'Add URL' }).click();

    await expect(page.getByText('URL added successfully!')).toBeVisible();
    await expect(page.getByText(url)).toBeVisible();
  });

  test('should show an error for a duplicate URL', async ({ page }) => {
    // await page.getByRole('button', { name: 'Add URL' }).click();
    await page.getByLabel('URL').fill('https://google.com');
    await page.getByRole('button', { name: 'Add URL' }).click();

    await expect(page.getByText('URL already exists')).toBeVisible();
  });

  test('should delete a URL', async ({ page }) => {
    const url = `https://example-to-delete.com/${Math.random()}`;
    // await page.getByRole('button', { name: 'Add URL' }).click();
    await page.getByLabel('URL').fill(url);
    await page.getByRole('button', { name: 'Add URL' }).click();
    await expect(page.getByText('URL added successfully!')).toBeVisible();

    await page.getByRole('row', { name: new RegExp(url) }).getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Delete Selected' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByText('Selected URLs deleted successfully!')).toBeVisible();
    await expect(page.getByText(url)).not.toBeVisible();
  });

  test('should filter URLs by name', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Search by title or URL...' }).fill('google');
    await expect(page.getByRole('row')).toHaveCount(2);
  });
});
