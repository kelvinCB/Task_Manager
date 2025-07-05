import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';

test.describe('Task Manager App', () => {
  let appPage: AppPage;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    await appPage.goto();
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Wait 1 second before ending test
    await page.waitForTimeout(1000);
    
    // Take final screenshot with test name
    const testName = testInfo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    await page.screenshot({ 
      path: `test-results/screenshots/${testName}_final.png`,
      fullPage: true 
    });
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

    // Toggle to dark theme
    await appPage.toggleTheme();
    await appPage.verifyTheme('dark');

    // Test persistence: reload page
    await appPage.page.reload();
    await appPage.verifyPageLoaded();
    await appPage.verifyTheme('dark');

    // Toggle back to light theme
    await appPage.toggleTheme();
    await appPage.verifyTheme('light');
  });

  test('should have responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const mobileAppPage = new AppPage(page);
    await mobileAppPage.goto();
    await mobileAppPage.verifyPageLoaded();

    // Verify that navigation elements are still accessible
    await expect(mobileAppPage.boardViewButton).toBeVisible();
    await expect(mobileAppPage.treeViewButton).toBeVisible();
    await expect(mobileAppPage.timeStatsButton).toBeVisible();
  });

  test('should display search functionality', async () => {
    await expect(appPage.searchInput).toBeVisible();
    await expect(appPage.searchInput).toHaveAttribute('placeholder', 'Search tasks...');
  });

  test('should show export and import buttons', async () => {
    await expect(appPage.exportButton).toBeVisible();
    await expect(appPage.importButton).toBeVisible();
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
