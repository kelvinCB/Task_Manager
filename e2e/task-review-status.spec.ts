import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { BoardPage } from './page-objects/board.page';

const unique = (base: string) => `${base} - ${Date.now()}-${Math.floor(Math.random() * 1000)}`;

test.describe('Review Status E2E Flow', () => {
  let appPage: AppPage;
  let taskPage: TaskPage;
  let boardPage: BoardPage;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    taskPage = new TaskPage(page);
    boardPage = new BoardPage(page);

    await appPage.goto();
    await page.evaluate(() => localStorage.clear());
    await appPage.page.reload();
  });

  test('should create a task directly in Review and show it in Review column', async () => {
    const title = unique('E2E Review Create');

    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title,
      description: 'Task created in Review status',
      status: 'Review'
    });

    await appPage.switchToView('board');
    await boardPage.verifyColumnsVisible();
    await boardPage.verifyTaskInColumn(title, 'Review');
  });

  test('should move task across In Progress → Review → Done using drag and drop', async () => {
    const title = unique('E2E Review DnD');

    await appPage.openAddTaskModal();
    await taskPage.createTask({
      title,
      description: 'Drag and drop review flow',
      status: 'In Progress'
    });

    await appPage.switchToView('board');

    const taskCard = boardPage.getTaskCard(title);
    await taskCard.dragTo(boardPage.getColumn('Review'));
    await boardPage.verifyTaskInColumn(title, 'Review');

    await taskCard.dragTo(boardPage.getColumn('Done'));
    await boardPage.verifyTaskInColumn(title, 'Done');
  });

  test('should filter by Review and keep UI stable when switching Board/Tree views', async ({ page }) => {
    const reviewTitle = unique('E2E Review Filter');
    const openTitle = unique('E2E Open Control');

    await appPage.openAddTaskModal();
    await taskPage.createTask({ title: reviewTitle, status: 'Review' });

    await appPage.openAddTaskModal();
    await taskPage.createTask({ title: openTitle, status: 'Open' });

    await appPage.switchToView('board');

    // Open global filter and select Review
    const filterButtons = await page.locator('button[title="Filter"], button[title="Filters"]').all();
    let clickedFilter = false;
    for (const btn of filterButtons) {
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        clickedFilter = true;
        break;
      }
    }
    expect(clickedFilter).toBeTruthy();

    const allSelects = page.locator('select');
    const count = await allSelects.count();
    let selected = false;

    for (let i = 0; i < count; i++) {
      const select = allSelects.nth(i);
      if (!(await select.isVisible().catch(() => false))) continue;
      const options = await select.locator('option').allTextContents().catch(() => [] as string[]);
      if (options.includes('Review') && (options.includes('All Status') || options.includes('All'))) {
        await select.selectOption('Review');
        selected = true;
        break;
      }
    }

    expect(selected).toBeTruthy();

    await expect(page.getByText(reviewTitle).first()).toBeVisible();
    await expect(page.getByText(openTitle).first()).not.toBeVisible();

    // Switch to tree and validate no blank/corruption + task still present
    await appPage.switchToView('tree');
    await appPage.verifyCurrentView('tree');
    await expect(page.locator('[data-testid="tree-view-container"]')).toBeVisible();
    await expect(page.getByText(reviewTitle).first()).toBeVisible();

    // Back to board and validate again
    await appPage.switchToView('board');
    await appPage.verifyCurrentView('board');
    await expect(page.locator('[data-testid="board-view-container"]')).toBeVisible();
    await expect(page.getByText(reviewTitle).first()).toBeVisible();
  });
});
