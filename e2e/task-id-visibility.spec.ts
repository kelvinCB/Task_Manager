import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { BoardPage } from './page-objects/board.page';

test.describe('Task ID visibility', () => {
  let appPage: AppPage;
  let taskPage: TaskPage;
  let boardPage: BoardPage;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    taskPage = new TaskPage(page);
    boardPage = new BoardPage(page);

    await appPage.goto();

    // Start clean
    await page.evaluate(() => localStorage.clear());
    await appPage.page.reload();
  });

  test('should show a #ID in board cards and in task detail modal header', async ({ page }) => {
    const title = 'Task With Visible ID';

    await appPage.openAddTaskModal();
    await taskPage.createTask({ title });

    await appPage.switchToView('board');
    const card = boardPage.getTaskCard(title);

    // Board card should show a mono badge starting with '#'
    const idBadge = card.locator('span.font-mono').first();
    await expect(idBadge).toBeVisible();
    await expect(idBadge).toHaveText(/^#.+/);

    // Open modal and validate header contains same ID
    await card.click();

    const modalHeaderBadge = page.locator('[role="dialog"] h2 span.font-mono').first();
    await expect(modalHeaderBadge).toBeVisible();
    await expect(modalHeaderBadge).toHaveText(/^#.+/);

    // Same ID in both places
    const boardId = (await idBadge.textContent())?.trim();
    const modalId = (await modalHeaderBadge.textContent())?.trim();
    expect(boardId).toBeTruthy();
    expect(modalId).toBeTruthy();
    expect(modalId).toBe(boardId);
  });
});
