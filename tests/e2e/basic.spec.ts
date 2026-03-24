/**
 * Базовые E2E тесты
 */

import { test, expect } from '@playwright/test';

test('приложение загружается', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Fluid\+Portal Vox Launcher/);
});

test('HUD отображается', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000); // ждём загрузки
  const hud = page.locator('#hud');
  await expect(hud).toBeVisible();
});

