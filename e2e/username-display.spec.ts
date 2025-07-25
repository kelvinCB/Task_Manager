import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { AuthPage } from './page-objects/auth.page';

test.describe('Username Display Feature', () => {
  let appPage: AppPage;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    authPage = new AuthPage(page);
    await appPage.goto();
    
    // Clear local storage to start fresh
    await page.evaluate(() => localStorage.clear());
    await appPage.page.reload();
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Take screenshot after each test for debugging
    if (testInfo.status !== 'passed') {
      await page.screenshot({ 
        path: `test-results/username-display-${testInfo.title.replace(/\s+/g, '-')}-failed.png`,
        fullPage: true 
      });
    }
  });

  test('should display "My Account" in button for unauthenticated users', async () => {
    // Check that My Account button is visible
    const accountButton = appPage.page.locator('[data-testid="account-menu-button"]').first();
    await expect(accountButton).toBeVisible();
    await expect(accountButton).toContainText('My Account');
  });

  test('should display "My Account" in button even when user is authenticated', async () => {
    // Login first
    await authPage.loginViaAccountMenu();
    await authPage.login('test@example.com', 'password123');
    await authPage.expectLoggedIn();

    // The button should still show "My Account"
    const accountButton = appPage.page.locator('[data-testid="account-menu-button"]').first();
    await expect(accountButton).toBeVisible();
    await expect(accountButton).toContainText('My Account');
    
    // Username should NOT be in the button text
    await expect(accountButton).not.toContainText('@');
  });

  test('should display username in dropdown when authenticated user clicks My Account', async () => {
    // Login first
    await authPage.loginViaAccountMenu();
    await authPage.login('test@example.com', 'password123');
    await appPage.page.waitForTimeout(5000); // Wait to ensure complete loading
    await authPage.expectLoggedIn();

    // Click the My Account button to open dropdown
    const accountButton = appPage.page.locator('[data-testid="account-menu-button"]').first();
    await accountButton.click();

    // Wait for dropdown to appear and check for username pattern
    await expect(appPage.page.locator('text=/^@[a-z]+[0-9]+$/')).toBeVisible({ timeout: 10000 });
    
    // Check that it follows the expected pattern (food name + numbers)
    const usernameText = await appPage.page.locator('text=/^@[a-z]+[0-9]+$/').textContent();
    expect(usernameText).toMatch(/^@[a-z]+[0-9]+$/);
    
    // Verify it's in the user info section (has proper styling)
    const userInfoSection = appPage.page.locator('div').filter({ hasText: usernameText });
    await expect(userInfoSection).toBeVisible();
  });

  test('should show both username and display name in dropdown', async () => {
    // Login first
    await authPage.loginViaAccountMenu();
    await authPage.login('test@example.com', 'password123');
    await authPage.expectLoggedIn();

    // Click the My Account button to open dropdown
    const accountButton = appPage.page.locator('[data-testid="account-menu-button"]').first();
    await accountButton.click();

    // Check for username
    await expect(appPage.page.locator('text=/^@[a-z]+[0-9]+$/')).toBeVisible();
    
    // Check for display name (should be the part before @ in email)
    await expect(appPage.page.locator('text=test')).toBeVisible();
  });

  test('should maintain username display consistency in mobile view', async () => {
    // Set mobile viewport
    await appPage.page.setViewportSize({ width: 375, height: 667 });

    // Login first
    await authPage.loginViaAccountMenu();
    await authPage.login('test@example.com', 'password123');
    await authPage.expectLoggedIn();

    // In mobile, the account button might be in a different location
    const accountButton = appPage.page.locator('[data-testid="account-menu-button"]').last(); // Use last for mobile
    await expect(accountButton).toBeVisible();
    
    // Click to open dropdown
    await accountButton.click();

    // Username should still be visible in mobile dropdown
    await expect(appPage.page.locator('text=/^@[a-z]+[0-9]+$/')).toBeVisible({ timeout: 10000 });
  });

  test('should not show username section when user is not authenticated', async () => {
    // Ensure we're not logged in
    await authPage.expectLoggedOut();

    // Click the My Account button to open dropdown
    const accountButton = appPage.page.locator('[data-testid="account-menu-button"]').first();
    await accountButton.click();

    // Should see login button instead of username
    await expect(appPage.page.locator('[data-testid="login-button-menu"]')).toBeVisible();
    
    // Should NOT see any username
    await expect(appPage.page.locator('text=/^@[a-z]+[0-9]+$/')).not.toBeVisible();
  });

  test('should show logout option alongside username when authenticated', async () => {
    // Login first
    await authPage.loginViaAccountMenu();
    await authPage.login('test@example.com', 'password123');
    await authPage.expectLoggedIn();

    // Click the My Account button to open dropdown
    const accountButton = appPage.page.locator('[data-testid="account-menu-button"]').first();
    await accountButton.click();

    // Should see both username and logout button
    await expect(appPage.page.locator('text=/^@[a-z]+[0-9]+$/')).toBeVisible();
    await expect(appPage.page.locator('[data-testid="logout-button"]')).toBeVisible();
    
    // Should also see Export/Import options
    await expect(appPage.page.locator('text=Export Tasks')).toBeVisible();
    await expect(appPage.page.locator('text=Import Tasks')).toBeVisible();
  });

  test('should close dropdown when clicking outside', async () => {
    // Login first
    await authPage.loginViaAccountMenu();
    await authPage.login('test@example.com', 'password123');
    await authPage.expectLoggedIn();

    // Click the My Account button to open dropdown
    const accountButton = appPage.page.locator('[data-testid="account-menu-button"]').first();
    await accountButton.click();

    // Verify dropdown is open
    await expect(appPage.page.locator('text=/^@[a-z]+[0-9]+$/')).toBeVisible();

    // Click somewhere else to close
    await appPage.page.click('body', { position: { x: 100, y: 100 } });

    // Dropdown should be closed
    await expect(appPage.page.locator('text=/^@[a-z]+[0-9]+$/')).not.toBeVisible();
  });
});
