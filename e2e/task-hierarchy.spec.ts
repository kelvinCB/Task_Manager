import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { TreePage } from './page-objects/tree.page';

test.describe('Task Hierarchy', () => {
    let appPage: AppPage;
    let taskPage: TaskPage;
    let treePage: TreePage;

    test.beforeEach(async ({ page }) => {
        appPage = new AppPage(page);
        taskPage = new TaskPage(page);
        treePage = new TreePage(page);
        await appPage.goto();

        // Clear local storage to start fresh
        await page.evaluate(() => localStorage.clear());
        await appPage.page.reload();
    });

    test('should create a subtask and verify hierarchy in Tree View', async ({ page }) => {
        // Switch to Tree View
        await appPage.switchToView('tree');
        await appPage.verifyCurrentView('tree');

        // Create parent task
        const parentTitle = 'Parent Task';
        await appPage.openAddTaskModal();
        await taskPage.createTask({
            title: parentTitle,
            description: 'This is a parent task'
        });

        // Verify parent task exists
        await treePage.verifyTaskExists(parentTitle);

        // Add a subtask
        const subtaskTitle = 'Subtask 1';
        await treePage.addSubtask(parentTitle);
        await taskPage.verifyModalOpen();
        await taskPage.createTask({
            title: subtaskTitle,
            description: 'This is a subtask'
        });

        // Expand parent to see the subtask if it's not already
        await treePage.toggleExpand(parentTitle);

        // Wait for subtask to appear and state to update
        await page.waitForTimeout(500);

        // Verify subtask exists and is nested
        await treePage.verifyTaskExists(subtaskTitle);
        await treePage.verifyTaskHierarchy(parentTitle, subtaskTitle);
    });

    test('should update subtask status independently of parent', async ({ page }) => {
        // Switch to Tree View
        await appPage.switchToView('tree');

        // Create parent and subtask
        const parentTitle = 'Parent Task Status';
        const subtaskTitle = 'Subtask Status';

        await appPage.openAddTaskModal();
        await taskPage.createTask({ title: parentTitle });

        await treePage.addSubtask(parentTitle);
        await taskPage.createTask({ title: subtaskTitle });

        // Expand parent to see the subtask
        await treePage.toggleExpand(parentTitle);

        // Wait for subtask to appear and state to update
        await page.waitForTimeout(500);

        // Change subtask status to In Progress
        const subtaskItem = treePage.getTaskItem(subtaskTitle);
        const statusSelect = subtaskItem.locator('select');
        await statusSelect.selectOption('In Progress');

        // Verify subtask is In Progress
        await expect(statusSelect).toHaveValue('In Progress');

        // Verify parent is still Open
        const parentItem = treePage.getTaskItem(parentTitle);
        const parentStatusSelect = parentItem.locator('select');
        await expect(parentStatusSelect).toHaveValue('Open');
    });
});
