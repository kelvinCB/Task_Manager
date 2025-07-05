import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { TimerPage } from './page-objects/timer.page';

test.describe('Time Stats View', () => {
  let appPage: AppPage;
  let taskPage: TaskPage;
  let timerPage: TimerPage;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    taskPage = new TaskPage(page);
    timerPage = new TimerPage(page);
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

  // Helper function to create a task and record some time
  async function createTaskWithTime(taskTitle: string) {
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: taskTitle,
      description: `Task for time tracking: ${taskTitle}`
    });

    // Record some time for the task
    await timerPage.startTimer(taskTitle);
    await appPage.page.waitForTimeout(2000); // Wait 2 seconds
    await timerPage.pauseTimer(taskTitle);
  }

  test('should display Time Stats view and all filter options', async () => {
    // Create a task with time to ensure stats have data
    await createTaskWithTime('Stats Test Task');

    // Switch to Time Stats view
    await appPage.switchToView('stats');
    await appPage.verifyCurrentView('stats');

    // Verify that all time filter buttons are present
    await expect(appPage.page.getByRole('button', { name: 'Today' })).toBeVisible();
    await expect(appPage.page.getByRole('button', { name: 'This Week' })).toBeVisible();
    await expect(appPage.page.getByRole('button', { name: 'This Month' })).toBeVisible();
    await expect(appPage.page.getByRole('button', { name: 'This Year' })).toBeVisible();
    await expect(appPage.page.getByRole('button', { name: 'Custom' })).toBeVisible();

    // Verify Time Stats title/header is visible
    await expect(appPage.page.getByText(/Time Tracking Statistics/i)).toBeVisible();
  });

  test('should filter time stats by "Today"', async () => {
    // Create a task with time data
    await createTaskWithTime('Today Task');

    // Switch to Time Stats view
    await appPage.switchToView('stats');
    await appPage.verifyCurrentView('stats');

    // Click Today filter
    const todayFilter = appPage.page.getByRole('button', { name: 'Today' });
    await todayFilter.click();

    // Verify Today filter is active (using correct indigo classes)
    await expect(todayFilter).toHaveClass(/bg-indigo-100.*text-indigo-700|text-indigo-700.*bg-indigo-100/);

    // Verify that today's data is shown
    await expect(appPage.page.getByText('Today Task')).toBeVisible();
    
    // Verify some time stats are displayed
    const timeElements = appPage.page.locator('text=/\\d+:\\d+|\\d+h|\\d+m|\\d+ seconds/');
    await expect(timeElements.first()).toBeVisible();
  });

  test('should filter time stats by "This Week"', async () => {
    // Create a task with time data
    await createTaskWithTime('Week Task');

    // Switch to Time Stats view
    await appPage.switchToView('stats');
    await appPage.verifyCurrentView('stats');

    // Click This Week filter
    const weekFilter = appPage.page.getByRole('button', { name: 'This Week' });
    await weekFilter.click();

    // Verify This Week filter is active (using correct indigo classes)
    await expect(weekFilter).toHaveClass(/bg-indigo-100.*text-indigo-700|text-indigo-700.*bg-indigo-100/);

    // Verify that this week's data is shown
    await expect(appPage.page.getByText('Week Task')).toBeVisible();
    
    // Verify some time stats are displayed
    const timeElements = appPage.page.locator('text=/\\d+:\\d+|\\d+h|\\d+m|\\d+ seconds/');
    await expect(timeElements.first()).toBeVisible();
  });

  test('should filter time stats by "This Month"', async () => {
    // Create a task with time data
    await createTaskWithTime('Month Task');

    // Switch to Time Stats view
    await appPage.switchToView('stats');
    await appPage.verifyCurrentView('stats');

    // Click This Month filter
    const monthFilter = appPage.page.getByRole('button', { name: 'This Month' });
    await monthFilter.click();

    // Verify This Month filter is active (using correct indigo classes)
    await expect(monthFilter).toHaveClass(/bg-indigo-100.*text-indigo-700|text-indigo-700.*bg-indigo-100/);

    // Verify that this month's data is shown
    await expect(appPage.page.getByText('Month Task')).toBeVisible();
    
    // Verify some time stats are displayed
    const timeElements = appPage.page.locator('text=/\\d+:\\d+|\\d+h|\\d+m|\\d+ seconds/');
    await expect(timeElements.first()).toBeVisible();
  });

  test('should filter time stats by "This Year"', async () => {
    // Create a task with time data
    await createTaskWithTime('Year Task');

    // Switch to Time Stats view
    await appPage.switchToView('stats');
    await appPage.verifyCurrentView('stats');

    // Click This Year filter
    const yearFilter = appPage.page.getByRole('button', { name: 'This Year' });
    await yearFilter.click();

    // Verify This Year filter is active (using correct indigo classes)
    await expect(yearFilter).toHaveClass(/bg-indigo-100.*text-indigo-700|text-indigo-700.*bg-indigo-100/);

    // Verify that this year's data is shown
    await expect(appPage.page.getByText('Year Task')).toBeVisible();
    
    // Verify some time stats are displayed
    const timeElements = appPage.page.locator('text=/\\d+:\\d+|\\d+h|\\d+m|\\d+ seconds/');
    await expect(timeElements.first()).toBeVisible();
  });

  test('should open and interact with "Custom" date filter', async () => {
    // Create a task with time data
    await createTaskWithTime('Custom Range Task');

    // Switch to Time Stats view
    await appPage.switchToView('stats');
    await appPage.verifyCurrentView('stats');

    // Click Custom filter
    const customFilter = appPage.page.getByRole('button', { name: 'Custom' });
    await customFilter.click();

    // Verify Custom filter is active (using correct indigo classes)
    await expect(customFilter).toHaveClass(/bg-indigo-100.*text-indigo-700|text-indigo-700.*bg-indigo-100/);

    // Look for custom date range inputs or date picker
    const dateInputs = appPage.page.locator('input[type="date"], input[placeholder*="date"], .date-picker');
    
    // There should be at least one date input for custom range
    await expect(dateInputs.first()).toBeVisible();
    
    // If there are start and end date inputs, verify both
    const dateInputCount = await dateInputs.count();
    if (dateInputCount >= 2) {
      await expect(dateInputs.nth(0)).toBeVisible(); // Start date
      await expect(dateInputs.nth(1)).toBeVisible(); // End date
    }

    // Verify apply/confirm button for custom range
    const applyButton = appPage.page.getByRole('button', { name: /Apply|Confirm|Set Range/i });
    if (await applyButton.isVisible()) {
      await expect(applyButton).toBeVisible();
    }
  });

  test('should switch between different time filter options', async () => {
    // Create multiple tasks with time data
    await createTaskWithTime('Multi Filter Task 1');
    await createTaskWithTime('Multi Filter Task 2');

    // Switch to Time Stats view
    await appPage.switchToView('stats');
    await appPage.verifyCurrentView('stats');

    // Test switching between different filters
    const filters = [
      { name: 'Today', button: appPage.page.getByRole('button', { name: 'Today' }) },
      { name: 'This Week', button: appPage.page.getByRole('button', { name: 'This Week' }) },
      { name: 'This Month', button: appPage.page.getByRole('button', { name: 'This Month' }) },
      { name: 'This Year', button: appPage.page.getByRole('button', { name: 'This Year' }) },
      { name: 'Custom', button: appPage.page.getByRole('button', { name: 'Custom' }) }
    ];

    // Click each filter and verify it becomes active
    for (const filter of filters) {
      await filter.button.click();
      await expect(filter.button).toHaveClass(/bg-indigo-100.*text-indigo-700|text-indigo-700.*bg-indigo-100/);
      
      // Wait a bit for any data loading
      await appPage.page.waitForTimeout(500);
    }
  });

  test('should display time statistics data correctly', async () => {
    // Create tasks and record time
    await createTaskWithTime('Stats Data Task 1');
    await createTaskWithTime('Stats Data Task 2');

    // Switch to Time Stats view
    await appPage.switchToView('stats');
    await appPage.verifyCurrentView('stats');

    // Verify basic stats elements are present
    // Look for total time, charts, or other statistics displays
    const possibleStatsElements = [
      'Total Time',
      'Total:',
      'Time Spent',
      'Duration',
      'Hours',
      'Minutes',
      'Chart',
      'Graph'
    ];

    let statsFound = false;
    for (const statsText of possibleStatsElements) {
      try {
        await expect(appPage.page.getByText(new RegExp(statsText, 'i'))).toBeVisible({ timeout: 1000 });
        statsFound = true;
        break;
      } catch (e) {
        // Continue to next element
      }
    }

    // If no specific stats text found, look for time format patterns
    if (!statsFound) {
      const timePatterns = appPage.page.locator('text=/\\d+:\\d+|\\d+h \\d+m|\\d+ seconds|\\d+\\.\\d+ hours/');
      await expect(timePatterns.first()).toBeVisible();
    }

    // Verify tasks with recorded time are visible in stats
    await expect(appPage.page.getByText('Stats Data Task 1')).toBeVisible();
    await expect(appPage.page.getByText('Stats Data Task 2')).toBeVisible();
  });
});
