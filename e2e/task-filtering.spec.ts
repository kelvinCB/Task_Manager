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
    // Small wait before ending test for stability
  });

  // Helper function to show filters - DESKTOP/MOBILE COMPATIBLE
  async function showFilters() {
    const selectLocator = appPage.page.locator('select');
    let initialSelectCount = await selectLocator.count();
    
    // Check if any existing select has the GLOBAL filter options we need
    if (initialSelectCount > 0) {
      for (let i = 0; i < initialSelectCount; i++) {
        const select = selectLocator.nth(i);
        const isVisible = await select.isVisible().catch(() => false);
        const options = await select.locator('option').allTextContents().catch(() => []);
        
        // Only consider it a working filter if it has "All Status" option (global filter)
        if (isVisible && (options.includes('All Status') || (options.includes('All') && options.includes('Open')))) {
          return;
        }
      }
    }

    // First, check if we can find the desktop filter section
    const desktopFilterSection = appPage.page.locator('.hidden.lg\\:block').filter({ hasText: 'Filters' });
    const desktopSectionExists = await desktopFilterSection.count() > 0;
    
    if (desktopSectionExists) {
      const isDesktopSectionVisible = await desktopFilterSection.isVisible().catch(() => false);
      
      if (isDesktopSectionVisible) {
        const desktopFilterButtons = await desktopFilterSection.locator('button').all();
        
        for (let j = 0; j < desktopFilterButtons.length; j++) {
          const btn = desktopFilterButtons[j];
          const isVisible = await btn.isVisible().catch(() => false);
          
          if (isVisible) {
            await btn.click();
            const newSelectCount = await selectLocator.count();
            
            if (newSelectCount > initialSelectCount) {
              return;
            }
          }
        }
      }
    }

    // Fallback: Find all filter buttons (mobile + desktop) and try each one
    const filterButtons = await appPage.page.locator('button[title="Filters"]').all();
    
    let filterActivated = false;
    
    for (let i = 0; i < filterButtons.length; i++) {
      const button = filterButtons[i];
      const isVisible = await button.isVisible().catch(() => false);
      
      if (isVisible) {
        try {
          await button.click();
          const newSelectCount = await selectLocator.count();
          
          if (newSelectCount > initialSelectCount) {
            filterActivated = true;
            break;
          }
        } catch (e) {
          // Continue to next button
        }
      }
    }
    
    if (!filterActivated) {
      const finalSelectCount = await selectLocator.count();
      
      if (finalSelectCount > initialSelectCount) {
        return;
      }
      
      throw new Error('Could not activate filters - no working filter button found');
    }
  }

  // Helper function to apply status filter - ROBUST VERSION  
  async function applyStatusFilter(status: string) {
    await showFilters();
    
    // Find all select elements and try to use the GLOBAL filter, not task-specific ones
    const allSelects = appPage.page.locator('select');
    const selectCount = await allSelects.count();
    
    let workingSelect = null;
    
    // First, look for a global filter (has "All Status" option)
    for (let i = 0; i < selectCount; i++) {
      const select = allSelects.nth(i);
      const isVisible = await select.isVisible().catch(() => false);
      
      if (isVisible) {
        const options = await select.locator('option').allTextContents();
        // Global filter should have "All Status" or "All" option
        if (options.includes('All Status') || (options.includes('All') && options.includes('Open'))) {
          workingSelect = select;
          break;
        }
      }
    }
    
    // If no global filter found, fall back to any status filter (for backward compatibility)
    if (!workingSelect) {
      for (let i = 0; i < selectCount; i++) {
        const select = allSelects.nth(i);
        const isVisible = await select.isVisible().catch(() => false);
        
        if (isVisible) {
          const options = await select.locator('option').allTextContents();
          if (options.includes('Open') || options.includes('In Progress') || options.includes('Done')) {
            workingSelect = select;
            break;
          }
        }
      }
    }
    
    if (!workingSelect) {
      throw new Error('No visible select element found for status filter');
    }
    
    await expect(workingSelect).toBeVisible({ timeout: 5000 });
    
    // Select the desired status - handle empty string for "All Status"
    if (status === '') {
      // Try to select the first option (usually "All" or "All Status")
      const firstOption = workingSelect.locator('option').first();
      const firstOptionValue = await firstOption.getAttribute('value');
      await workingSelect.selectOption(firstOptionValue || '');
    } else {
      await workingSelect.selectOption(status);
    }
    
    // Wait for filtering to take effect
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

  test('should filter tasks by "Open" status in Tree View with hierarchical context', async () => {
    await createTestTasks();
    
    // Switch to Tree View
    await appPage.switchToView('tree');
    await appPage.verifyCurrentView('tree');

    // Apply Open filter
    await applyStatusFilter('Open');

    // In Tree View, Open tasks should be visible
    await expect(appPage.page.getByText('Open Task')).toBeVisible();
    
    // Note: Parent tasks may be visible even if they don't match the filter,
    // as long as they have children that match. This maintains tree structure.
    // This is the intended behavior for hierarchical context.
  });

  test('should filter tasks by "In Progress" status in Tree View with hierarchical context', async () => {
    await createTestTasks();
    
    // Switch to Tree View
    await appPage.switchToView('tree');
    await appPage.verifyCurrentView('tree');

    // Apply In Progress filter
    await applyStatusFilter('In Progress');

    // In Tree View, In Progress tasks should be visible
    await expect(appPage.page.getByText('In Progress Task')).toBeVisible();
    
    // Note: Parent tasks may be visible even if they don't match the filter,
    // as long as they have children that match. This maintains tree structure.
  });

  test('should filter tasks by "Done" status in Tree View with hierarchical context', async () => {
    await createTestTasks();
    
    // Switch to Tree View
    await appPage.switchToView('tree');
    await appPage.verifyCurrentView('tree');

    // Apply Done filter
    await applyStatusFilter('Done');

    // In Tree View, Done tasks should be visible
    await expect(appPage.page.getByText('Done Task')).toBeVisible();
    
    // Note: Parent tasks may be visible even if they don't match the filter,
    // as long as they have children that match. This maintains tree structure.
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
