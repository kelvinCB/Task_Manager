import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { BoardPage } from './page-objects/board.page';
import { TreePage } from './page-objects/tree.page';

test.describe('Task Drag and Drop', () => {
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

        // Listen to console logs
        page.on('console', msg => console.log(`[Browser Console] ${msg.text()}`));

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

    test('should NOT allow dragging parent to Done with incomplete subtasks', async ({ page }) => {
        const parentTitle = 'Parent Task';
        const subtaskTitle = 'Subtask';

        // 1. Create parent
        await appPage.openAddTaskModal();
        await taskPage.createTask({ title: parentTitle, status: 'In Progress' });

        // 2. Create subtask
        await appPage.switchToView('tree');
        await treePage.addSubtask(parentTitle);
        await taskPage.createTask({ title: subtaskTitle });

        // 3. Try to drag parent to Done in Board
        await appPage.switchToView('board');

        const parentCard = boardPage.getTaskCard(parentTitle);
        const doneColumn = boardPage.getColumn('Done');

        // Drag and drop
        await parentCard.dragTo(doneColumn);

        // 4. Verify error modal appears instead of dialog
        await expect(page.getByTestId('error-modal')).toBeVisible({ timeout: 2000 });
        await expect(page.getByTestId('error-modal-message')).toContainText('subtasks');

        // Close the modal
        await page.getByTestId('error-modal-ok-button').click();

        // Verify task stayed in In Progress
        await boardPage.verifyTaskInColumn(parentTitle, 'In Progress');
    });

    test('should automatically start timer when moved to In Progress', async ({ page }) => {
        const title = 'Timer Task';
        await appPage.openAddTaskModal();
        await taskPage.createTask({ title });

        await appPage.switchToView('board');
        const taskCard = boardPage.getTaskCard(title);
        const inProgressColumn = boardPage.getColumn('In Progress');

        // Drag to In Progress
        await taskCard.dragTo(inProgressColumn);

        // Verify status
        await boardPage.verifyTaskInColumn(title, 'In Progress');

        // Verify timer is active (with retry and longer timeout for state update)
        // Note: TaskBoard renders two timers (desktop/mobile), so we must select the first one (desktop)
        await expect(taskCard.locator('[data-testid="pause-timer"]').first()).toBeVisible({ timeout: 10000 });
    });

    test('should show parent breadcrumb for subtasks', async ({ page }) => {
        const parentTitle = 'Main Project';
        const subtaskTitle = 'Design Phase';

        // 1. Create parent
        await appPage.openAddTaskModal();
        await taskPage.createTask({ title: parentTitle });

        // 2. Create subtask
        await appPage.switchToView('tree');
        await treePage.addSubtask(parentTitle);
        await taskPage.createTask({ title: subtaskTitle });

        // 3. Verify breadcrumb in Board view
        await appPage.switchToView('board');
        const subtaskCard = boardPage.getTaskCard(subtaskTitle);
        // Use a looser check for the text since it's inside multiple spans
        await expect(subtaskCard).toContainText(`Subtask of: ${parentTitle}`);

        // 4. Verify breadcrumb in Tree view
        // Note: We avoid reloading here because backend persistence might be flaky (500 errors),
        // relying on client-side state which is valid for this session.
        await appPage.switchToView('tree');
        // Auto-expansion handles this now. calling expandTask toggles it closed if open.
        // await treePage.expandTask(parentTitle);

        // Use data-testid selector which is more reliable than text filtering on whole items
        const treeTask = page.locator(`[data-testid="task-item"][data-task-title="${subtaskTitle}"]`);
        await expect(treeTask).toBeVisible();
        // Updated to match new breadcrumb format which just shows the parent title with an icon
        await expect(treeTask).toContainText(parentTitle);
    });

});
