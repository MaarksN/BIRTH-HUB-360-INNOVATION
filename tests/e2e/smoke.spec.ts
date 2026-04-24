import { test, expect } from '@playwright/test';

test('healthcheck básico da aplicação', async ({ page }) => {
  const response = await page.goto('/');
  expect(response).not.toBeNull();
  expect(response?.ok()).toBeTruthy();

  await expect(page).toHaveURL(/127\.0\.0\.1:3000|localhost:3000/);
});
