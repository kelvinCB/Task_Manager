import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { BoardPage } from './page-objects/board.page';

test.describe('Task Detail View', () => {
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

    test('should open task detail modal when clicking on task title', async ({ page }) => {
        const title = 'Detail Task Test';
        const description = 'Detailed description for testing modal content';

        await appPage.openAddTaskModal();
        await taskPage.createTask({
            title,
            description
        });

        // Click on the task title in the board view
        await appPage.switchToView('board');
        await page.getByText(title).first().click();

        // Verify details modal is open and has correct content
        const detailModal = page.getByRole('dialog');
        await expect(detailModal).toBeVisible();
        await expect(detailModal.getByText(title)).toBeVisible();
        await expect(detailModal.getByText(description)).toBeVisible();

        // Close modal
        await detailModal.getByLabel('Close modal').click();
        await expect(detailModal).not.toBeVisible();
    });
});
