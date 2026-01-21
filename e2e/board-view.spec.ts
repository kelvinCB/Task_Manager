import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { BoardPage } from './page-objects/board.page';
import { TreePage } from './page-objects/tree.page';

test.describe('Board View Badges', () => {
    let appPage: AppPage;
    let taskPage: TaskPage;
    let boardPage: BoardPage;
    let treePage: TreePage;

    test.beforeEach(async ({ page }) => {
        appPage = new AppPage(page);
        taskPage = new TaskPage(page);
        boardPage = new BoardPage(page);
        treePage = new TreePage(page);
        await appPage.goto();

        // Clear local storage to start fresh
        await page.evaluate(() => localStorage.clear());
        await appPage.page.reload();
    });

    test('should show "Created" date when no due date is present', async () => {
        const title = 'Badge Task';
        await appPage.openAddTaskModal();
        await taskPage.createTask({ title });

        await appPage.switchToView('board');
        const taskCard = boardPage.getTaskCard(title);

        // Verify "Created" text is visible (it should show the current year or month/day)
        await expect(taskCard).toContainText(/Created/i);
    });

    test('should show "Has subtasks" badge on board view', async () => {
        const parentTitle = 'Parent Task';
        const subtaskTitle = 'Subtask Task';

        // 1. Create parent
        await appPage.openAddTaskModal();
        await taskPage.createTask({ title: parentTitle });

        // 2. Add subtask in Tree View
        await appPage.switchToView('tree');
        await treePage.addSubtask(parentTitle);
        await taskPage.createTask({ title: subtaskTitle });

        // 3. Go back to Board View
        await appPage.switchToView('board');
        const parentCard = boardPage.getTaskCard(parentTitle);

        // 4. Verify "Has subtasks" badge is visible
        const badge = parentCard.getByTestId('subtask-badge');
        await expect(badge).toBeVisible();
        await expect(badge).toContainText(/Has subtasks/i);
    });

    test('should show "Level" badge for subtasks on board view', async () => {
        const parentTitle = 'Parent Project';
        const subtaskTitle = 'Child Task';

        // 1. Create parent
        await appPage.openAddTaskModal();
        await taskPage.createTask({ title: parentTitle });

        // 2. Add subtask in Tree View
        await appPage.switchToView('tree');
        await treePage.addSubtask(parentTitle);
        await taskPage.createTask({ title: subtaskTitle });

        // 3. Go back to Board View
        await appPage.switchToView('board');
        const subtaskCard = boardPage.getTaskCard(subtaskTitle);

        // 4. Verify "Level 1" badge is visible (since childIds is 0)
        const badge = subtaskCard.getByTestId('subtask-badge');
        await expect(badge).toBeVisible();
        await expect(badge).toContainText(/Level 1/i);
    });
});
