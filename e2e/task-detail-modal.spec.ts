import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { TreePage } from './page-objects/tree.page';

test.describe('Task Detail Modal', () => {
    let appPage: AppPage;
    let taskPage: TaskPage;
    let treePage: TreePage;

    test.beforeEach(async ({ page }) => {
        appPage = new AppPage(page);
        taskPage = new TaskPage(page);
        treePage = new TreePage(page);
        await appPage.goto();

        // Clear local storage
        await page.evaluate(() => localStorage.clear());
        await appPage.page.reload();
    });

    test('should show correct subtask count', async ({ page }) => {
        const parentTitle = 'Parent for Modal';
        const subtaskTitle1 = 'Subtask 1';
        const subtaskTitle2 = 'Subtask 2';

        // 1. Create parent task
        await appPage.openAddTaskModal();
        await taskPage.createTask({ title: parentTitle });

        // 2. Add subtasks in Tree View
        await appPage.switchToView('tree');
        
        // Add first subtask
        await treePage.addSubtask(parentTitle);
        await taskPage.createTask({ title: subtaskTitle1 });

        // Add second subtask
        await treePage.addSubtask(parentTitle);
        await taskPage.createTask({ title: subtaskTitle2 });
        
        // Expand the parent task to ensure we can see subtasks (optional, but good for visibility)
        // await treePage.toggleExpand(parentTitle); 
        // Not strictly needed to open modal, but confirms hierarchy.
        
        await expect(treePage.getTaskItem(parentTitle)).toBeVisible();

        // 3. Open Detail Modal
        // Click the title element specifically to avoid hitting buttons
        const parentItem = treePage.getTaskItem(parentTitle);
        // The title is in an h3 tag
        await parentItem.locator('h3').filter({ hasText: parentTitle }).click();

        // 4. Verify subtask count in modal
        await expect(page.getByRole('dialog')).toBeVisible();
        
        // Check that the task title is in the modal header
        await expect(page.locator('h2').filter({ hasText: parentTitle })).toBeVisible();

        // Check for subtask count "2"
        // Based on TaskDetailModal.tsx structure:
        // <div className="space-y-1"> ... <CheckCircle ... /> {t('tasks.subtasks')} ... <p>{count}</p> ... </div>
        // We can search for the section containing "Subtasks" text (case sensitive or not depending on translation)
        // Ideally we should use the translation key but here we depend on english defaults "Subtasks"
        
        // Find the container that has "Subtasks" and check for "2"
        const subtasksLabel = page.getByText('Subtasks', { exact: true });
        await expect(subtasksLabel).toBeVisible();
        
        // The count is in a sibling p tag or parent's sibling.
        // Let's look for the text "2" in the vicinity. 
        // We can scope it to the stats container.
        const statsContainer = page.locator('.grid.grid-cols-1.sm\\:grid-cols-2');
        await expect(statsContainer).toContainText('Subtasks');
        await expect(statsContainer).toContainText('2');
    });
});
