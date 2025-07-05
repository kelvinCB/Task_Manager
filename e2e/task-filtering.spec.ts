import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { BoardPage } from './page-objects/board.page';

test.describe('Task Filtering', () => {
  let appPage: AppPage;
  let taskPage: TaskPage;
  let boardPage: BoardPage;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    taskPage = new TaskPage(page);
    boardPage = new BoardPage(page);
    await appPage.goto();
    
    // Clear local storage to start fresh
    await page.evaluate(() => localStorage.clear());
    await appPage.page.reload();
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

  // Helper function to show filters - FIXED VERSION
  async function showFilters() {
    // Check if filters are already visible
    const statusLabel = appPage.page.getByText('Status:');
    const isFiltersOpen = await statusLabel.isVisible();
    
    if (!isFiltersOpen) {
      // Find and click the filter toggle button (icon next to "Filters" text)
      const filterButton = appPage.page.locator('button').filter({ 
        has: appPage.page.locator('[data-lucide="filter"]') 
      }).or(
        appPage.page.locator('button:near(:text("Filters"))')
      ).first();
      
      await filterButton.click();
      
      // Wait for the filters to be visible - use first() to handle duplicates
      await expect(statusLabel.first()).toBeVisible({ timeout: 5000 });
      await appPage.page.waitForTimeout(500); // Small wait for UI to settle
    }
  }

  // Helper function to apply status filter - FIXED VERSION  
  async function applyStatusFilter(status: string) {
    await showFilters();
    
    // Find the status filter dropdown
    const statusSelect = appPage.page.locator('select').first();
    await expect(statusSelect).toBeVisible();
    
    // Select the desired status
    await statusSelect.selectOption(status);
    
    // Wait for filtering to take effect
    await appPage.page.waitForTimeout(1000);
  }

  // Helper function to create tasks with different statuses
  async function createTestTasks() {
    // Create Open task
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: 'Open Task',
      description: 'Task in Open status',
      status: 'Open'
    });

    // Create In Progress task
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: 'In Progress Task',
      description: 'Task in In Progress status',
      status: 'In Progress'
    });

    // Create Done task
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: 'Done Task',
      description: 'Task in Done status',
      status: 'Done'
    });
  }

  test('should filter tasks by "Open" status in Board View', async () => {
    await createTestTasks();
    
    // Ensure we're in Board View
    await appPage.switchToView('board');
    await appPage.verifyCurrentView('board');

    // Apply Open filter using the fixed helper
    await applyStatusFilter('Open');

    // Verify only Open tasks are visible
    await expect(appPage.page.getByText('Open Task')).toBeVisible();
    await expect(appPage.page.getByText('In Progress Task')).not.toBeVisible();
    await expect(appPage.page.getByText('Done Task')).not.toBeVisible();
  });

  test('should filter tasks by "In Progress" status in Board View', async () => {
    await createTestTasks();
    
    // Ensure we're in Board View
    await appPage.switchToView('board');
    await appPage.verifyCurrentView('board');

    // Apply In Progress filter
    await applyStatusFilter('In Progress');

    // Verify only In Progress tasks are visible
    await expect(appPage.page.getByText('In Progress Task')).toBeVisible();
    await expect(appPage.page.getByText('Open Task')).not.toBeVisible();
    await expect(appPage.page.getByText('Done Task')).not.toBeVisible();
  });

  test('should filter tasks by "Done" status in Board View', async () => {
    await createTestTasks();
    
    // Ensure we're in Board View
    await appPage.switchToView('board');
    await appPage.verifyCurrentView('board');

    // Apply Done filter
    await applyStatusFilter('Done');

    // Verify only Done tasks are visible
    await expect(appPage.page.getByText('Done Task')).toBeVisible();
    await expect(appPage.page.getByText('Open Task')).not.toBeVisible();
    await expect(appPage.page.getByText('In Progress Task')).not.toBeVisible();
  });

  test('should show all tasks when "All Status" filter is selected in Board View', async () => {
    await createTestTasks();
    
    // Ensure we're in Board View
    await appPage.switchToView('board');
    await appPage.verifyCurrentView('board');

    // Apply a specific filter first, then switch to All Status
    await applyStatusFilter('Open');
    await applyStatusFilter(''); // Empty string for "All Status"

    // Verify all tasks are visible
    await expect(appPage.page.getByText('Open Task')).toBeVisible();
    await expect(appPage.page.getByText('In Progress Task')).toBeVisible();
    await expect(appPage.page.getByText('Done Task')).toBeVisible();
  });

  test('should filter tasks by "Open" status in Tree View', async () => {
    await createTestTasks();
    
    // Switch to Tree View
    await appPage.switchToView('tree');
    await appPage.verifyCurrentView('tree');

    // Apply Open filter
    await applyStatusFilter('Open');

    // Verify only Open tasks are visible
    await expect(appPage.page.getByText('Open Task')).toBeVisible();
    await expect(appPage.page.getByText('In Progress Task')).not.toBeVisible();
    await expect(appPage.page.getByText('Done Task')).not.toBeVisible();
  });

  test('should filter tasks by "In Progress" status in Tree View', async () => {
    await createTestTasks();
    
    // Switch to Tree View
    await appPage.switchToView('tree');
    await appPage.verifyCurrentView('tree');

    // Apply In Progress filter
    await applyStatusFilter('In Progress');

    // Verify only In Progress tasks are visible
    await expect(appPage.page.getByText('In Progress Task')).toBeVisible();
    await expect(appPage.page.getByText('Open Task')).not.toBeVisible();
    await expect(appPage.page.getByText('Done Task')).not.toBeVisible();
  });

  test('should filter tasks by "Done" status in Tree View', async () => {
    await createTestTasks();
    
    // Switch to Tree View
    await appPage.switchToView('tree');
    await appPage.verifyCurrentView('tree');

    // Apply Done filter
    await applyStatusFilter('Done');

    // Verify only Done tasks are visible
    await expect(appPage.page.getByText('Done Task')).toBeVisible();
    await expect(appPage.page.getByText('Open Task')).not.toBeVisible();
    await expect(appPage.page.getByText('In Progress Task')).not.toBeVisible();
  });

  test('should show all tasks when "All Status" filter is selected in Tree View', async () => {
    await createTestTasks();
    
    // Switch to Tree View
    await appPage.switchToView('tree');
    await appPage.verifyCurrentView('tree');

    // Apply a specific filter first, then switch to All Status
    await applyStatusFilter('Open');
    await applyStatusFilter(''); // Empty string for "All Status"

    // Verify all tasks are visible
    await expect(appPage.page.getByText('Open Task')).toBeVisible();
    await expect(appPage.page.getByText('In Progress Task')).toBeVisible();
    await expect(appPage.page.getByText('Done Task')).toBeVisible();
  });
});
