import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { TreePage } from './page-objects/tree.page';

test.describe('Deep Nesting and Persistence', () => {
    let appPage: AppPage;
    let taskPage: TaskPage;
    let treePage: TreePage;

    test.beforeEach(async ({ page }) => {
        appPage = new AppPage(page);
        taskPage = new TaskPage(page);
        treePage = new TreePage(page);

        await appPage.goto();
        // Clear storage for fresh state
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('should allow creating deep nested subtasks (Level 3+) and persist view', async ({ page }) => {
       
        // 1. Switch to Tree View
        await appPage.switchToView('tree');
        await appPage.verifyCurrentView('tree');

        // Create Root Task
        const rootTitle = 'Deep Nest Root';
        await appPage.openAddTaskModal();
        await taskPage.createTask({ title: rootTitle });
        await treePage.verifyTaskExists(rootTitle);

        // Level 1 -> Level 2
        const level2Title = 'Level 2 Child';
        await treePage.addSubtask(rootTitle);
        await taskPage.createTask({ title: level2Title });

        // Verify Level 2 visibility (Auto-expand check)
        // Usually TreePage.addSubtask doesn't expand, but our new useTasks code should auto-expand properties
        // Wait a bit for state update
        await page.waitForTimeout(500);
        await treePage.verifyTaskExists(level2Title);

        // Level 2 -> Level 3
        // We need to find the Level 2 task and add subtask
        const level3Title = 'Level 3 Grandchild';
        await treePage.addSubtask(level2Title);
        await taskPage.createTask({ title: level3Title });

        await page.waitForTimeout(500);
        await treePage.verifyTaskExists(level3Title);

        // Level 3 -> Level 4 (Just to be sure)
        const level4Title = 'Level 4 Deep';
        await treePage.addSubtask(level3Title);
        await taskPage.createTask({ title: level4Title });

        await page.waitForTimeout(500);
        await treePage.verifyTaskExists(level4Title);

        // 2. Test View Persistence
        // Reload page
        await page.reload();
        // Should still be in tree view
        await appPage.verifyCurrentView('tree');

        // Items should still be visible because expandedNodes is persisted in useTasks
        await treePage.verifyTaskExists(level4Title);
    });
});
