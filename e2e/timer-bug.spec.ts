import { test, expect } from '@playwright/test';

test.describe('Task Timer Bug Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: login
    await page.goto('/login');
    await page.locator('[data-testid="email-input"]').fill(process.env.E2E_USER_AUTH_EMAIL!);
    await page.locator('[data-testid="password-input"]').fill(process.env.E2E_USER_AUTH_PASSWORD!);
    await page.locator('[data-testid="login-button"]').click();
    await page.waitForURL(url => url.pathname === '/' || url.pathname === '');
  });

  test('Timer should not be visible or active on completed tasks', async ({ page }) => {
    // 1. Create a task
    await page.getByTestId('add-task-button').click();
    const taskTitle = `Timer Test ${Date.now()}`;
    await page.locator('#task-title').fill(taskTitle);
    await page.getByTestId('task-form-submit-button').click();

    // 2. Start the timer
    const taskItem = page.locator('[data-testid="board-task-item"]').filter({ hasText: taskTitle });
    await taskItem.getByTestId('start-timer').click();

    // 3. Verify timer is active (pause button visible)
    await expect(taskItem.getByTestId('pause-timer')).toBeVisible();

    // 4. Move to Done (using the dropdown in the edit modal to simulate the bug report fix)
    await taskItem.getByTestId('edit-task-button').click();
    await page.locator('#task-status').selectOption('Done');
    await page.getByTestId('task-form-submit-button').click();

    // 5. Verify the task is in the Done column and timer is NOT visible/active
    // The columns have headers like "Completado" or "Done"
    const doneColumn = page.locator('div').filter({ hasText: /Completado|Done/ }).first().locator('xpath=./../..');
    const completedTask = page.locator('[data-testid="board-task-item"]').filter({ hasText: taskTitle });
    
    await expect(completedTask).toBeVisible();
    
    // The timer component should now be disabled (buttons hidden)
    await expect(completedTask.getByTestId('start-timer')).not.toBeVisible();
    await expect(completedTask.getByTestId('pause-timer')).not.toBeVisible();
  });
});
