import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { TimerPage } from './page-objects/timer.page';
import { AuthPage } from './page-objects/auth.page';

test.describe('Time Tracking', () => {
  let appPage: AppPage;
  let taskPage: TaskPage;
  let timerPage: TimerPage;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    taskPage = new TaskPage(page);
    timerPage = new TimerPage(page);
    authPage = new AuthPage(page);
    await appPage.goto();

    // Clear local storage to start fresh
    await page.evaluate(() => localStorage.clear());
    await appPage.page.reload();
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

    // Start the timer
    await timerPage.startTimer('Timer Test Task');
    await timerPage.verifyTimerRunning('Timer Test Task');

    // Wait a moment for time to elapse
    await appPage.page.waitForTimeout(3000);

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
    test.setTimeout(60000); // Increase timeout for this test

    // Login first as export requires authentication
    await authPage.goToLogin();
    await authPage.login(
      process.env.E2E_TEST_USER_EMAIL || 'taski-test@yopmail.com',
      process.env.E2E_TEST_USER_PASSWORD || 'password123'
    );
    await authPage.expectLoggedIn();
    await appPage.goto();
    await appPage.page.waitForLoadState('networkidle');
    await appPage.waitForLoadingComplete();
    await appPage.page.waitForTimeout(2000); // Give it a bit more time for the UI to settle

    // Create a task and record time
    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title: 'Export Test Task Unique',
      description: 'Task for testing data export'
    });

    // Wait for the task to be visible and stable
    const taskCard = appPage.page.locator('.group').filter({ hasText: 'Export Test Task Unique' });
    await expect(taskCard).toBeVisible();
    await appPage.page.waitForTimeout(1000);

    await timerPage.startTimer('Export Test Task Unique');
    await appPage.page.waitForTimeout(5000);
    await timerPage.pauseTimer('Export Test Task Unique');

    // Brief wait to ensure session/state is stable
    await appPage.page.waitForTimeout(2000);

    // Test export functionality
    const downloadPromise = appPage.page.waitForEvent('download', { timeout: 30000 });
    await appPage.exportTasks();
    const download = await downloadPromise;

    // Verify download occurred
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});
