import { test, expect } from '@playwright/test';

test.describe('MCG Study App - Smoke Tests', () => {

  test('App loads and redirects to sign-in', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Should redirect to sign-in (since not authenticated)
    await page.waitForURL(/sign-in/, { timeout: 10000 });

    // Verify Clerk sign-in component is present
    await expect(page.locator('text=Sign in')).toBeVisible({ timeout: 10000 });

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/smoke-signin.png' });
  });

  test('Sign-in page renders correctly', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('domcontentloaded');

    // Verify MCG Study App branding
    await expect(page.locator('text=MCG Study App')).toBeVisible({ timeout: 15000 });

    // Verify Clerk component loaded
    const clerkComponent = page.locator('[class*="cl-"], [data-clerk]').first();
    await expect(clerkComponent).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'tests/screenshots/smoke-signin-page.png' });
  });

  test('Dashboard redirects unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to sign-in
    await page.waitForURL(/sign-in/, { timeout: 10000 });
  });

  test('Patient page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/patient/test-id');

    // Should redirect to sign-in
    await page.waitForURL(/sign-in/, { timeout: 10000 });
  });

});
