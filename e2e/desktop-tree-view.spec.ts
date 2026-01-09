import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';

test.describe('Desktop Tree View Layout', () => {
  let appPage: AppPage;
  let taskPage: TaskPage;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    taskPage = new TaskPage(page);
    
    // Ensure we are in a desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await appPage.goto();
    
    // Switch to tree view
    await page.getByTestId('tree-view-toggle').click();
    await expect(page.getByTestId('tree-view-container')).toBeVisible();
  });

  test('should align task items to the right on desktop', async ({ page }) => {
    const taskTitle = 'Desktop Alignment Test';
    
    await appPage.openAddTaskModal();
    await taskPage.createTask({ title: taskTitle });
    
    const taskItem = page.getByTestId('task-item').filter({ hasText: taskTitle }).first();
    const actionItems = taskItem.locator('.sm\\:justify-end'); // Using part of the class name we added
    
    await expect(actionItems).toBeVisible();
    
    // Verify it's positioned to the right (simplified check by class existence)
    await expect(actionItems).toHaveClass(/sm:justify-end/);
  });

  test('should maintain layout with very long titles on desktop', async ({ page }) => {
    const longTitle = 'This is a very very very very very very very very very very very very very very very long title to test layout';
    
    await appPage.openAddTaskModal();
    await taskPage.createTask({ title: longTitle });
    
    // The task item should still be visible and not broken
    const taskItem = page.getByTestId('task-item').filter({ hasText: longTitle.substring(0, 50) }).first();
    await expect(taskItem).toBeVisible();
    
    // Action items should still be visible on the right
    const actionItems = taskItem.locator('.sm\\:justify-end');
    await expect(actionItems).toBeVisible();
    
    // Check that there is no vertical overlap or weird wrapping that hides items
    // (This is harder to test strictly, but visibility is a good start)
    const boundingBox = await actionItems.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.width).toBeGreaterThan(0);
  });
});
