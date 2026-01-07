import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';

if (!process.env.E2E_USER_TASK_EMAIL || !process.env.E2E_USER_TASK_PASSWORD) {
  throw new Error('E2E_USER_TASK_EMAIL and E2E_USER_TASK_PASSWORD must be set in environment variables');
}

const TEST_EMAIL = process.env.E2E_USER_TASK_EMAIL;
const TEST_PASSWORD = process.env.E2E_USER_TASK_PASSWORD;

test.describe('Import Tasks E2E Tests', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    
    // Login before each test
    await authPage.goToLogin();
    await authPage.login(TEST_EMAIL, TEST_PASSWORD);
    await authPage.expectLoggedIn();
  });

  test('should show import option in account menu for authenticated users', async ({ page }) => {
    // Open account menu
    await page.click('[data-testid="account-menu-button"]');
    
    // Verify import option is visible
    await expect(page.locator('text=Import Tasks')).toBeVisible();
    
    // Verify file input exists and accepts CSV
    const fileInput = page.locator('input[type="file"][accept=".csv"]');
    await expect(fileInput).toHaveCount(1);
    
    // Verify input is enabled (not disabled) for authenticated user
    await expect(fileInput).not.toBeDisabled();
  });
});
