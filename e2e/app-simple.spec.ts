import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';

test.describe('Task Manager App - Basic Tests', () => {
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
    // Check basic elements are present
    await expect(appPage.page).toHaveTitle(/Task Manager/i);
    await expect(appPage.page.getByText('TasksFun')).toBeVisible();
    await expect(appPage.page.getByText('Hierarchical Task Management')).toBeVisible();
  });

  test('should display navigation buttons', async () => {
    await expect(appPage.boardViewButton).toBeVisible();
    await expect(appPage.treeViewButton).toBeVisible();
    await expect(appPage.timeStatsButton).toBeVisible();
  });

  test('should display theme toggle button', async () => {
    await expect(appPage.themeToggle).toBeVisible();
  });

  test('should display search input', async () => {
    await expect(appPage.searchInput).toBeVisible();
  });

  test('should switch between views when clicking navigation buttons', async () => {
    // Click Tree view
    await appPage.switchToView('tree');
    // Wait for tree view to load
    await appPage.page.waitForTimeout(500);
    
    // Click Board view
    await appPage.switchToView('board');
    // Wait for board view to load
    await appPage.page.waitForTimeout(500);
    
    // Click Stats view
    await appPage.switchToView('stats');
    // Wait for stats view to load
    await appPage.page.waitForTimeout(500);
  });
});
