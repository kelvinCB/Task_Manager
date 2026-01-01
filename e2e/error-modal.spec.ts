import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';
import { TreePage } from './page-objects/tree.page';
import { BoardPage } from './page-objects/board.page';

test.describe('Error Modal', () => {
    let appPage: AppPage;
    let taskPage: TaskPage;
    let treePage: TreePage;
    let boardPage: BoardPage;

    test.beforeEach(async ({ page }) => {
        appPage = new AppPage(page);
        taskPage = new TaskPage(page);
        treePage = new TreePage(page);
        boardPage = new BoardPage(page);
        await appPage.goto();

        // Clear local storage to start fresh
        await page.evaluate(() => localStorage.clear());
        await appPage.page.reload();
    });

    test('should show error modal when adding subtask to completed task', async ({ page }) => {
        // Switch to Tree View
        await appPage.switchToView('tree');

        // Create parent task
        const parentTitle = 'Completed Parent Task';
        await appPage.openAddTaskModal();
        await taskPage.createTask({
            title: parentTitle,
            description: 'This task will be completed'
        });

        // Mark parent as Done
        const parentItem = treePage.getTaskItem(parentTitle);
        const statusSelect = parentItem.locator('select');
        await statusSelect.selectOption('Done');

        // Wait for status to update
        await page.waitForTimeout(300);

        // Try to add a subtask
        await treePage.addSubtask(parentTitle);

        // Verify error modal appears
        await expect(page.getByTestId('error-modal')).toBeVisible();
        await expect(page.getByTestId('error-modal-title')).toHaveText('Oops!');
        await expect(page.getByTestId('error-modal-message')).toContainText('Cannot add a subtask');
        await expect(page.getByTestId('error-modal-icon')).toBeVisible();
    });

    test('should show error modal when completing task with incomplete subtasks', async ({ page }) => {
        // Create parent task with In Progress status
        const parentTitle = 'Parent with Subtask';
        const subtaskTitle = 'Incomplete Subtask';

        await appPage.openAddTaskModal();
        await taskPage.createTask({ title: parentTitle, status: 'In Progress' });

        // Add subtask in Tree View
        await appPage.switchToView('tree');
        await treePage.addSubtask(parentTitle);
        await taskPage.createTask({ title: subtaskTitle });

        // Switch to Board View and try to drag parent to Done
        await appPage.switchToView('board');

        const parentCard = boardPage.getTaskCard(parentTitle);
        const doneColumn = boardPage.getColumn('Done');

        // Drag and drop to Done column
        await parentCard.dragTo(doneColumn);

        // Verify error modal appears
        await expect(page.getByTestId('error-modal')).toBeVisible({ timeout: 2000 });
        await expect(page.getByTestId('error-modal-title')).toHaveText('Oops!');
        await expect(page.getByTestId('error-modal-message')).toContainText('Cannot complete a task');

        // Close modal and verify task stayed in In Progress
        await page.getByTestId('error-modal-ok-button').click();
        await boardPage.verifyTaskInColumn(parentTitle, 'In Progress');
    });

    test('should dismiss error modal with OK button', async ({ page }) => {
        // Switch to Tree View
        await appPage.switchToView('tree');

        // Create and complete a parent task
        const parentTitle = 'Completed Task';
        await appPage.openAddTaskModal();
        await taskPage.createTask({ title: parentTitle });

        const parentItem = treePage.getTaskItem(parentTitle);
        const statusSelect = parentItem.locator('select');
        await statusSelect.selectOption('Done');
        await page.waitForTimeout(300);

        // Try to add subtask to trigger error
        await treePage.addSubtask(parentTitle);

        // Verify modal is visible
        await expect(page.getByTestId('error-modal')).toBeVisible();

        // Click OK button
        await page.getByTestId('error-modal-ok-button').click();

        // Verify modal is dismissed
        await expect(page.getByTestId('error-modal')).not.toBeVisible();
    });

    test('should dismiss error modal with X button', async ({ page }) => {
        // Switch to Tree View
        await appPage.switchToView('tree');

        // Create and complete a parent task
        const parentTitle = 'Completed Task X';
        await appPage.openAddTaskModal();
        await taskPage.createTask({ title: parentTitle });

        const parentItem = treePage.getTaskItem(parentTitle);
        const statusSelect = parentItem.locator('select');
        await statusSelect.selectOption('Done');
        await page.waitForTimeout(300);

        // Try to add subtask to trigger error
        await treePage.addSubtask(parentTitle);

        // Verify modal is visible
        await expect(page.getByTestId('error-modal')).toBeVisible();

        // Click close (X) button
        await page.getByTestId('error-modal-close-button').click();

        // Verify modal is dismissed
        await expect(page.getByTestId('error-modal')).not.toBeVisible();
    });

    test('should display error modal in Spanish when language is changed', async ({ page }) => {
        // Switch language to Spanish
        const toggle = page.getByTestId('language-toggle').filter({ visible: true }).first();
        await toggle.click();

        // Wait for language change
        await page.waitForTimeout(500);

        // Create parent task with In Progress status
        const parentTitle = 'Tarea con Subtarea';
        const subtaskTitle = 'Subtarea Incompleta';

        await appPage.openAddTaskModal();
        // Fill form and use Spanish button
        await taskPage.fillTaskForm({ title: parentTitle, status: 'In Progress' });
        await page.getByRole('button', { name: /crear tarea/i }).click();

        // Add subtask in Tree View
        await appPage.switchToView('tree');
        await treePage.addSubtask(parentTitle);
        // Fill form and use Spanish button
        await taskPage.fillTaskForm({ title: subtaskTitle });
        await page.getByRole('button', { name: /crear tarea/i }).click();

        // Switch to Board View and try to drag parent to Done
        await appPage.switchToView('board');

        const parentCard = boardPage.getTaskCard(parentTitle);
        // Use Spanish column name "Completado" instead of "Done"
        const doneColumn = page.locator('.flex.flex-col.h-full').filter({ has: page.getByText('Completado', { exact: true }) }).locator('div.flex-1.rounded-lg.border-2.border-dashed');

        // Drag and drop to Done column
        await parentCard.dragTo(doneColumn);

        // Wait for setTimeout delay in TaskBoard (100ms) plus animation
        await page.waitForTimeout(500);

        // Verify error modal appears in Spanish
        await expect(page.getByTestId('error-modal')).toBeVisible({ timeout: 3000 });
        await expect(page.getByTestId('error-modal-title')).toHaveText('¡Ups!');
        await expect(page.getByTestId('error-modal-message')).toContainText('subtareas');

        // Close modal and verify task stayed in In Progress (En Progreso in Spanish)
        await page.getByTestId('error-modal-ok-button').click();
        // Use Spanish column name for verification
        const inProgressColumn = page.locator('.flex.flex-col.h-full').filter({ has: page.getByText('En Progreso', { exact: true }) }).locator('div.flex-1.rounded-lg.border-2.border-dashed');
        const taskCard = inProgressColumn.locator(`[data-testid="board-task-item"][data-task-title="${parentTitle}"]`);
        await expect(taskCard).toBeVisible();
    });

    test('should have proper animations', async ({ page }) => {
        // Switch to Tree View
        await appPage.switchToView('tree');

        // Create and complete a parent task
        const parentTitle = 'Animation Test';
        await appPage.openAddTaskModal();
        await taskPage.createTask({ title: parentTitle });

        const parentItem = treePage.getTaskItem(parentTitle);
        const statusSelect = parentItem.locator('select');
        await statusSelect.selectOption('Done');
        await page.waitForTimeout(300);

        // Try to add subtask to trigger error
        await treePage.addSubtask(parentTitle);

        // Verify modal has animation classes
        const modal = page.getByTestId('error-modal');
        await expect(modal).toBeVisible();

        // Check for animation-related classes
        const modalClasses = await modal.getAttribute('class');
        expect(modalClasses).toContain('transition');
        expect(modalClasses).toContain('duration');
    });

    test('should respect dark theme', async ({ page }) => {
        // Switch to dark theme
        const themeToggle = page.locator('button[title="Toggle Dark Mode"]').filter({ visible: true }).first();
        await themeToggle.click();
        await page.waitForTimeout(300);

        // Switch to Tree View
        await appPage.switchToView('tree');

        // Create and complete a parent task
        const parentTitle = 'Dark Theme Test';
        await appPage.openAddTaskModal();
        await taskPage.createTask({ title: parentTitle });

        const parentItem = treePage.getTaskItem(parentTitle);
        const statusSelect = parentItem.locator('select');
        await statusSelect.selectOption('Done');
        await page.waitForTimeout(300);

        // Try to add subtask to trigger error
        await treePage.addSubtask(parentTitle);

        // Verify modal appears with dark theme classes
        const modal = page.getByTestId('error-modal');
        await expect(modal).toBeVisible();

        const modalClasses = await modal.getAttribute('class');
        expect(modalClasses).toContain('bg-gray-900');
    });

    test('should respect light theme', async ({ page }) => {
        // Ensure light theme is active (default)
        await appPage.switchToView('tree');

        // Create and complete a parent task
        const parentTitle = 'Light Theme Test';
        await appPage.openAddTaskModal();
        await taskPage.createTask({ title: parentTitle });

        const parentItem = treePage.getTaskItem(parentTitle);
        const statusSelect = parentItem.locator('select');
        await statusSelect.selectOption('Done');
        await page.waitForTimeout(300);

        // Try to add subtask to trigger error
        await treePage.addSubtask(parentTitle);

        // Verify modal appears with light theme classes
        const modal = page.getByTestId('error-modal');
        await expect(modal).toBeVisible();

        const modalClasses = await modal.getAttribute('class');
        expect(modalClasses).toContain('bg-white');
    });
});
