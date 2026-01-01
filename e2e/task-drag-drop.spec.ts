import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { BoardPage } from './page-objects/board.page';

test.describe('Task Drag and Drop', () => {
    let appPage: AppPage;
    let taskPage: TaskPage;
    let boardPage: BoardPage;

    test.beforeEach(async ({ page }) => {
        appPage = new AppPage(page);
        taskPage = new TaskPage(page);
        boardPage = new BoardPage(page);
        await appPage.goto();

        // Clear local storage to start fresh
        await page.evaluate(() => localStorage.clear());
        await appPage.page.reload();
    });

    test('should drag a task from Open to In Progress', async ({ page }) => {
        const title = 'Drag Task';
        await appPage.openAddTaskModal();
        await taskPage.createTask({ title });

        await appPage.switchToView('board');
        const taskCard = boardPage.getTaskCard(title);
        const inProgressColumn = boardPage.getColumn('In Progress');

        // Perform drag and drop
        await taskCard.dragTo(inProgressColumn);

        // Verify status change
        await boardPage.verifyTaskInColumn(title, 'In Progress');
    });

    test('should drag a task from In Progress to Done', async ({ page }) => {
        const title = 'Drag Task Done';
        await appPage.openAddTaskModal();
        await taskPage.createTask({
            title,
            status: 'In Progress'
        });

        await appPage.switchToView('board');
        const taskCard = boardPage.getTaskCard(title);
        const doneColumn = boardPage.getColumn('Done');

        // Perform drag and drop
        await taskCard.dragTo(doneColumn);

        // Verify status change
        await boardPage.verifyTaskInColumn(title, 'Done');
    });
});
