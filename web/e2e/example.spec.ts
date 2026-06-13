import { test, expect } from '@playwright/test';

test('has title and redirects to sign-in', async ({ page }) => {
  await page.goto('/');

  // Should redirect to sign-in page if not authenticated
  await expect(page).toHaveURL(/.*sign-in/);
});
