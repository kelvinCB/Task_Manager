import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { TimerPage } from './page-objects/timer.page';

test.describe('Time Tracking', () => {
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

  test('should start and stop timer for a task', async () => {
    // Create a task first
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: 'Timer Test Task',
      description: 'Task for testing timer functionality'
    });

    // Verify the task was created and is visible
    await expect(appPage.page.getByText('Timer Test Task')).toBeVisible();
    
    // Verify that a timer component exists for this task
    const timer = timerPage.getTaskTimer('Timer Test Task');
    await expect(timer).toBeVisible();
    
    // Start the timer
    await timerPage.startTimer('Timer Test Task');
    await timerPage.verifyTimerRunning('Timer Test Task');

    // Wait a moment for time to elapse
    await appPage.page.waitForTimeout(2000);

    // Stop the timer
    await timerPage.pauseTimer('Timer Test Task');
    await timerPage.verifyTimerStopped('Timer Test Task');

    // Verify that time was recorded
    const elapsedTime = await timerPage.getElapsedTimeText('Timer Test Task');
    expect(timerPage.timeToSeconds(elapsedTime)).toBeGreaterThan(0);
  });

  test('should track time accurately', async () => {
    // Create a task
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: 'Accuracy Test Task',
      description: 'Task for testing timer accuracy'
    });

    // Record initial time
    const initialTime = await timerPage.getElapsedTimeText('Accuracy Test Task');

    // Start timer
    await timerPage.startTimer('Accuracy Test Task');

    // Wait for a specific duration (3 seconds)
    await appPage.page.waitForTimeout(3000);

    // Stop timer
    await timerPage.pauseTimer('Accuracy Test Task');

    // Verify time increased appropriately
    await timerPage.verifyTimerIncreased('Accuracy Test Task', initialTime);
  });

  test('should export time tracking data', async () => {
    // Create a task and record time
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: 'Export Test Task',
      description: 'Task for testing data export'
    });

    await timerPage.startTimer('Export Test Task');
    await appPage.page.waitForTimeout(2000);
    await timerPage.pauseTimer('Export Test Task');

    // Test export functionality
    const downloadPromise = appPage.page.waitForEvent('download');
    await appPage.exportTasks();
    const download = await downloadPromise;

    // Verify download occurred
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});
