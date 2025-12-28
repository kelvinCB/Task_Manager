
import { test, expect } from '@playwright/test';
import { AuthPage } from './page-objects/auth.page';
import { TaskPage } from './page-objects/task.page';
import { TimerPage } from './page-objects/timer.page';
import { BoardPage } from './page-objects/board.page';

test.describe('Time Accumulation Bug Reproduction', () => {
  let authPage: AuthPage;
  let taskPage: TaskPage;
  let timerPage: TimerPage;
  let boardPage: BoardPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    taskPage = new TaskPage(page);
    timerPage = new TimerPage(page);
    boardPage = new BoardPage(page);

    await authPage.goToLogin();
    const email = process.env.E2E_TEST_USER_EMAIL || 'testuser@example.com';
    const password = process.env.E2E_TEST_USER_PASSWORD || 'password123';
    await authPage.login(email, password);
    // Ensure we are logged in
    await authPage.expectLoggedIn();
    
    // Ensure we are on the board view or tasks page
    // Assuming default is tree view, we might need to switch to board view for drag/drop
    // Or just ensure we are in a view that supports drag. 
    // Let's assume the root '/' is fine, but BoardPage selectors rely on columns.
    // If needed, we can navigate to board view. 
    // Let's check if there is a way to switch view. 
    // For now, assuming drag works in Board View.
    // Let's force board view if possible.
    await page.goto('/');
    const boardToggle = page.getByTitle('Board View').first();
    if (await boardToggle.isVisible()) {
        await boardToggle.click();
    }
  });

  test('should not accumulate duplicate time when moving between Done and In Progress', async ({ page }) => {
    const taskTitle = `Bug Repro Task ${Date.now()}`;
    
    // 1. Create a task
    await page.getByRole('button', { name: 'Add Task' }).click();
    await taskPage.createTask({ title: taskTitle });
    
    // 2. Start timer
    // We need to find the task first.
    await expect(page.getByText(taskTitle)).toBeVisible();
    await timerPage.startTimer(taskTitle);
    
    // Let it run for 2 seconds
    await page.waitForTimeout(2000);
    
    // 3. Move to Done
    const taskCard = boardPage.getTaskCard(taskTitle);
    
    // Ensure task card is visible and draggable
    await expect(taskCard).toBeVisible();
    
    // Drag to Done column
    await taskCard.dragTo(boardPage.getColumn('Done'), { force: true });
    
    // Wait for status update
    await page.waitForTimeout(2000);
    
    // Verify time is roughly 2s
    let timeText = await timerPage.getElapsedTimeText(taskTitle);
    console.log(`[DEBUG] Time after first Done: ${timeText}`);
    
    // 4. Move back to In Progress
    console.log('[DEBUG] Moving back to In Progress');
    await taskCard.dragTo(boardPage.getColumn('In Progress'), { force: true });
    await page.waitForTimeout(2000);
    
    // 5. Start timer again
    console.log('[DEBUG] Starting timer again');
    await timerPage.startTimer(taskTitle);
    
    // Let it run for 2 seconds
    await page.waitForTimeout(2000);
    
    // 6. Move to Done again
    console.log('[DEBUG] Moving to Done again');
    await taskCard.dragTo(boardPage.getColumn('Done'), { force: true });
    await page.waitForTimeout(2000);
    
    // Verify total time
    timeText = await timerPage.getElapsedTimeText(taskTitle);
    console.log(`[DEBUG] Final Time: ${timeText}`);
    
    const timeToSeconds = (str: string) => {
      const parts = str.split(':').map(Number);
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      return 0;
    };
    
    const totalSeconds = timeToSeconds(timeText);
    console.log('Total Seconds:', totalSeconds);
    
    // Expected: 2s + 2s = 4s (approx 4-5s)
    // Bug: 2 + (2+2) = 6s or more.
    expect(totalSeconds).toBeLessThan(10); // Generous buffer, but definitely < 10 if we only ran for 4s total.
    expect(totalSeconds).toBeGreaterThan(3);
  });
});
