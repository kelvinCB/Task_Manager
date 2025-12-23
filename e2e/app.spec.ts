import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';

test.describe('Task Manager App', () => {
  let appPage: AppPage;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    await appPage.goto();
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Wait 1 second before ending test    // Take final screenshot with test name
    const testName = testInfo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  });

  test('should load the application successfully', async () => {
    await appPage.verifyPageLoaded();
    await expect(appPage.page).toHaveTitle(/Task Manager/i);
  });

  test('should display board view by default', async () => {
    await appPage.verifyCurrentView('board');
  });

  test('should display navigation buttons and switch between views', async () => {
    // Verify navigation buttons are visible (covers display requirement)
    await expect(appPage.boardViewButton).toBeVisible();
    await expect(appPage.treeViewButton).toBeVisible();
    await expect(appPage.timeStatsButton).toBeVisible();

    // Test switching functionality
    await appPage.switchToView('tree');
    await appPage.verifyCurrentView('tree');

    await appPage.switchToView('stats');
    await appPage.verifyCurrentView('stats');

    await appPage.switchToView('board');
    await appPage.verifyCurrentView('board');
  });

  test('should handle theme toggle and persistence', async () => {
    // Verify initial theme
    await appPage.verifyTheme('light');

    // Use visible theme toggle button (check both desktop and mobile versions)
    const themeButton = appPage.page.getByTitle('Toggle Dark Mode').locator('visible=true').first();
    await themeButton.click();
    await appPage.verifyTheme('dark');

    // Test persistence: reload page
    await appPage.page.reload();
    await appPage.verifyPageLoaded();
    await appPage.verifyTheme('dark');

    // Toggle back to light theme
    const themeButtonAfterReload = appPage.page.getByTitle('Toggle Dark Mode').locator('visible=true').first();
    await themeButtonAfterReload.click();
    await appPage.verifyTheme('light');
  });

  test('should have responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const mobileAppPage = new AppPage(page);
    await mobileAppPage.goto();

    // On mobile, navigation buttons are in a different layout (hidden desktop version)
    // Instead of checking visibility of first(), check that mobile versions exist
    await expect(page.getByTitle('Board View').nth(1)).toBeVisible(); // Mobile version
    await expect(page.getByTitle('Tree View').nth(1)).toBeVisible(); // Mobile version
    await expect(page.getByTitle('Time Stats').nth(1)).toBeVisible(); // Mobile version

    // Verify mobile-specific elements work
    await page.getByTitle('Board View').nth(1).click();
    await mobileAppPage.verifyCurrentView('board');
  });

  test('should display search functionality', async () => {
    await expect(appPage.searchInput).toBeVisible();
    await expect(appPage.searchInput).toHaveAttribute('placeholder', 'Search tasks...');
  });

  test('should show My Account menu button', async () => {
    // Verify the My Account menu button is visible
    await expect(appPage.accountMenu).toBeVisible();
  });

  test('should show Authentication Required modal when clicking Export Tasks while logged out', async () => {
    // Open the account menu
    await appPage.accountMenu.click();

    // Click Export Tasks
    await appPage.page.getByRole('menuitem').filter({ hasText: 'Export Tasks' }).click();

    // Verify AuthRequiredModal appears
    await expect(appPage.page.getByText('Unlock Full Potential')).toBeVisible();
    await expect(appPage.page.getByText('Please sign in to export your tasks')).toBeVisible();

    // Close modal
    await appPage.page.getByRole('button', { name: 'Close modal' }).click();
  });

  test('should show Authentication Required modal when clicking Import Tasks while logged out', async () => {
    // Open the account menu
    await appPage.accountMenu.click();

    // Click Import Tasks
    await appPage.page.getByRole('menuitem').filter({ hasText: 'Import Tasks' }).click();

    // Verify AuthRequiredModal appears
    await expect(appPage.page.getByText('Unlock Full Potential')).toBeVisible();
    await expect(appPage.page.getByText('Please sign in to import your tasks')).toBeVisible();

    // Close modal
    await appPage.page.getByRole('button', { name: 'Close modal' }).click();
  });

  test('should maintain view state when navigating between views', async () => {
    // Start in board view
    await appPage.verifyCurrentView('board');

    // Switch to tree view
    await appPage.switchToView('tree');
    await appPage.verifyCurrentView('tree');

    // Switch to stats view
    await appPage.switchToView('stats');
    await appPage.verifyCurrentView('stats');

    // Go back to board view
    await appPage.switchToView('board');
    await appPage.verifyCurrentView('board');
  });

  test('should handle browser back/forward navigation gracefully', async ({ page }) => {
    await appPage.verifyCurrentView('board');

    // Switch to tree view
    await appPage.switchToView('tree');
    await appPage.verifyCurrentView('tree');

    // Use browser back button
    await page.goBack();
    // Note: This test might need adjustment based on actual routing implementation

    // Use browser forward button
    await page.goForward();
  });
});
