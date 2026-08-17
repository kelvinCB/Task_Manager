import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { BoardPage } from './page-objects/board.page';

test.describe('Task ID visibility', () => {
  let appPage: AppPage;
  let boardPage: BoardPage;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    boardPage = new BoardPage(page);

    await appPage.goto();

    // Start clean
    await page.evaluate(() => localStorage.clear());
    await appPage.page.reload();
  });

  test('should show a numeric #ID in board cards and in task detail modal header', async ({ page }) => {
    const title = 'Task With Visible ID';

    await page.evaluate(({ title }) => {
      localStorage.setItem('taskflow_tasks', JSON.stringify([{
        id: '2781',
        title,
        description: '',
        status: 'Open',
        createdAt: new Date().toISOString(),
        childIds: [],
        depth: 0,
        timeTracking: {
          totalTimeSpent: 0,
          isActive: false,
          timeEntries: []
        }
      }]));
    }, { title });
    await page.reload();

    const card = boardPage.getTaskCard(title);

    // Board card should show a mono badge starting with '#'
    const idBadge = card.getByTestId('task-id-badge');
    await expect(idBadge).toBeVisible();
    await expect(idBadge).toHaveText('#2781');

    // Open modal and validate header contains same ID
    await card.click();

    const modalHeaderBadge = page.locator('[role="dialog"] h2 [data-testid="task-id-badge"]');
    await expect(modalHeaderBadge).toBeVisible();
    await expect(modalHeaderBadge).toHaveText(/^#.+/);

    // Same ID in both places
    const boardId = (await idBadge.textContent())?.trim();
    const modalId = (await modalHeaderBadge.textContent())?.trim();
    expect(boardId).toBeTruthy();
    expect(modalId).toBeTruthy();
    expect(modalId).toBe(boardId);
  });

  test('should not render a long temporary id from local storage', async ({ page }) => {
    const title = 'Task With Temporary ID';

    await page.evaluate(({ title }) => {
      localStorage.setItem('taskflow_tasks', JSON.stringify([{
        id: 'ms7xgti5lgqk5g1vn5',
        title,
        description: '',
        status: 'Open',
        createdAt: new Date().toISOString(),
        childIds: [],
        depth: 0,
        timeTracking: {
          totalTimeSpent: 0,
          isActive: false,
          timeEntries: []
        }
      }]));
    }, { title });
    await page.reload();

    const card = boardPage.getTaskCard(title);
    await expect(card).toBeVisible();
    await expect(card.getByTestId('task-id-badge')).toHaveCount(0);
    await expect(page.getByText('#ms7xgti5lgqk5g1vn5')).toHaveCount(0);
  });
});
