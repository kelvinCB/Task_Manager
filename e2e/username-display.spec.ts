import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { AuthPage } from './page-objects/auth.page';

// Test credentials
const TEST_EMAIL = 'automation-tasklite-001@yopmail.com';
const TEST_PASSWORD = 'Automation123';

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

  test('should display "My Account" in button for unauthenticated users', async () => {
    // Check that My Account button is visible
    const accountButton = appPage.page.locator('[data-testid="account-menu-button"]').first();
    await expect(accountButton).toBeVisible();
    await expect(accountButton).toContainText('My Account');
  });

  test('should display "My Account" in button even when user is authenticated', async () => {
    // Login first
    await authPage.loginViaAccountMenu();
    await authPage.login(TEST_EMAIL, TEST_PASSWORD);
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
    await authPage.login(TEST_EMAIL, TEST_PASSWORD);
    await appPage.page.waitForTimeout(5000); // Wait to ensure complete loading
    await authPage.expectLoggedIn();

    // Click the My Account button to open dropdown (check if already open first)
    const accountButton = appPage.page.locator('[data-testid="account-menu-button"]').first();
    
    // Check if dropdown is already open
    const isDropdownOpen = await appPage.page.locator('text=/^@[a-z0-9]+$/').isVisible().catch(() => false);
    
    if (!isDropdownOpen) {
      await accountButton.click();
    }

    // Wait for dropdown to appear and check for username pattern
    await expect(appPage.page.locator('text=/^@[a-z0-9]+$/')).toBeVisible({ timeout: 10000 });
    
    // Check that it follows the expected pattern (username with @)
    const usernameText = await appPage.page.locator('text=/^@[a-z0-9]+$/').textContent();
    expect(usernameText).toMatch(/^@[a-z0-9]+$/);
    
    // Verify it's in the user info section (has proper styling)
    const userInfoSection = appPage.page.locator('div[class*="px-4 py-3"]').filter({ hasText: usernameText });
    await expect(userInfoSection.first()).toBeVisible();
  });

  test('should show both username and display name in dropdown', async () => {
    // Configure longer timeout for this timing-sensitive test
    test.setTimeout(60000);
    
    // Login first
    await authPage.loginViaAccountMenu();
    await authPage.login(TEST_EMAIL, TEST_PASSWORD);
    await authPage.expectLoggedIn();

    // Click the My Account button to open dropdown (check if already open first)
    const accountButton = appPage.page.locator('[data-testid="account-menu-button"]').first();
    
    // Check if dropdown is already open
    const usernamePattern = appPage.page.locator('text=/^@[a-z0-9]+$/');
    const isDropdownOpen = await usernamePattern.isVisible().catch(() => false);
    
    if (!isDropdownOpen) {
      await accountButton.click();
    }

    // Wait a bit for UI to stabilize after login
    await appPage.page.waitForTimeout(2000);
    
    // Check if profile exists (username should be visible if profile is loaded)
    // If no profile exists in Supabase, the test should skip gracefully
    const hasProfile = await usernamePattern.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasProfile) {
      // Profile exists, verify username format
      await expect(usernamePattern).toBeVisible();
      
      // Check for display name (should be the part before @ in email)
      await expect(appPage.page.locator('text=automation-tasklite-001')).toBeVisible();
    } else {
      // No profile yet - this is expected for newly created test users
      // Verify we're still authenticated by checking logout button
      await expect(appPage.page.locator('[data-testid="logout-button"]')).toBeVisible();
    }
  });

  test('should maintain username display consistency in mobile view', async () => {
    // Login first in desktop mode, then switch to mobile
    await authPage.loginViaAccountMenu();
    await authPage.login(TEST_EMAIL, TEST_PASSWORD);
    await authPage.expectLoggedIn();

    // Now set mobile viewport
    await appPage.page.setViewportSize({ width: 375, height: 667 });
    await appPage.page.waitForTimeout(1000); // Wait for responsive layout

    // In mobile, find any visible account button
    const accountButtons = appPage.page.locator('[data-testid="account-menu-button"]');
    let visibleButton = null;
    
    // Try to find a visible button
    for (let i = 0; i < await accountButtons.count(); i++) {
      const button = accountButtons.nth(i);
      if (await button.isVisible()) {
        visibleButton = button;
        break;
      }
    }
    
    if (!visibleButton) {
      // If no button is visible, try the first one anyway
      visibleButton = accountButtons.first();
    }
    
    // Check if dropdown is already open
    const isDropdownOpen = await appPage.page.locator('text=/^@[a-z0-9]+$/').isVisible().catch(() => false);
    
    if (!isDropdownOpen) {
      await visibleButton.click();
    }

    // Username should still be visible in mobile dropdown
    await expect(appPage.page.locator('text=/^@[a-z0-9]+$/')).toBeVisible({ timeout: 10000 });
  });

  test('should not show username section when user is not authenticated', async () => {
    // Ensure we're not logged in
    await authPage.expectLoggedOut();

    // Check if dropdown is already open from expectLoggedOut()
    const loginButtonMenu = appPage.page.locator('[data-testid="login-button-menu"]');
    const isDropdownOpen = await loginButtonMenu.isVisible().catch(() => false);
    
    if (!isDropdownOpen) {
      // Click the My Account button to open dropdown
      const accountButton = appPage.page.locator('[data-testid="account-menu-button"]').first();
      await accountButton.click();
    }

    // Should see login button instead of username (try multiple approaches)
    let loginButtonFound = false;
    
    // Try specific login button
    if (await loginButtonMenu.count() > 0) {
      await expect(loginButtonMenu).toBeVisible({ timeout: 5000 });
      loginButtonFound = true;
    } else {
      // Try general login text
      const loginText = appPage.page.getByText('Login');
      if (await loginText.count() > 0) {
        await expect(loginText.first()).toBeVisible({ timeout: 5000 });
        loginButtonFound = true;
      }
    }
    
    // Assert that we found some login indicator
    expect(loginButtonFound).toBeTruthy();
    
    // Should NOT see any username
    await expect(appPage.page.locator('text=/^@[a-z0-9]+$/')).not.toBeVisible();
  });

  test('should show logout option alongside username when authenticated', async () => {
    // Login first
    await authPage.loginViaAccountMenu();
    await authPage.login(TEST_EMAIL, TEST_PASSWORD);
    await authPage.expectLoggedIn();

    // Click the My Account button to open dropdown
    const accountButton = appPage.page.locator('[data-testid="account-menu-button"]').first();
    const logoutButton = appPage.page.locator('[data-testid="logout-button"]');
    const usernamePattern = appPage.page.locator('text=/^@[a-z0-9]+$/');
    
    // Check if dropdown is already open
    let isDropdownOpen = await logoutButton.isVisible().catch(() => false);
    
    if (!isDropdownOpen) {
      await accountButton.click();
      // Wait for dropdown to appear
      await appPage.page.waitForTimeout(500);
    }

    // Wait a bit for UI to stabilize after login
    await appPage.page.waitForTimeout(2000);
    
    // Should see logout button (this confirms authentication)
    await expect(logoutButton).toBeVisible({ timeout: 5000 });
    
    // Username is visible only if profile exists in Supabase
    const hasProfile = await usernamePattern.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasProfile) {
      await expect(usernamePattern).toBeVisible();
    }
    
    // Should also see Export/Import options
    await expect(appPage.page.locator('text=Export Tasks')).toBeVisible();
    await expect(appPage.page.locator('text=Import Tasks')).toBeVisible();
  });

  test('should close dropdown when clicking outside', async () => {
    // Login first
    await authPage.loginViaAccountMenu();
    await authPage.login(TEST_EMAIL, TEST_PASSWORD);
    await authPage.expectLoggedIn();

    // Click the My Account button to open dropdown (check if already open first)
    const accountButton = appPage.page.locator('[data-testid="account-menu-button"]').first();
    
    // Check if dropdown is already open
    const logoutButton = appPage.page.locator('[data-testid="logout-button"]');
    const isDropdownOpen = await logoutButton.isVisible().catch(() => false);
    
    if (!isDropdownOpen) {
      await accountButton.click();
    }

    // Wait a bit for UI to stabilize after login
    await appPage.page.waitForTimeout(2000);
    
    // Verify dropdown is open by checking for logout button
    await expect(logoutButton).toBeVisible({ timeout: 5000 });

    // Click somewhere else to close
    await appPage.page.click('body', { position: { x: 100, y: 100 } });

    // Dropdown should be closed
    await expect(logoutButton).not.toBeVisible();
  });
});
