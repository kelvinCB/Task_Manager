import { test, expect } from '@playwright/test';
import { AppPage } from './page-objects/app.page';
import { TaskPage } from './page-objects/task.page';

test.describe('Delete Confirmation Modal', () => {
  let appPage: AppPage;
  let taskPage: TaskPage;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    taskPage = new TaskPage(page);

    await appPage.goto();
    
    // Clear local storage and reload to start fresh
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should show confirmation modal when deleting task in Board View', async ({ page }) => {
    // Create a task first
    await appPage.openAddTaskModal();
    const taskTitle = 'Task to Delete from Board';
    await taskPage.createTask({
      title: taskTitle,
      description: 'This will be deleted'
    });
    await taskPage.verifyModalClosed();

    // Switch to Board View
    await appPage.switchToView('board');

    // Hover over the task to reveal delete button
    const taskCard = page.locator('[data-testid="board-task-item"]', { hasText: taskTitle });
    await taskCard.hover();

    // Click delete button
    const deleteButton = taskCard.locator('[data-testid="delete-task-button"]');
    await deleteButton.click();

    // Verify modal appears
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('[id="delete-modal-title"]')).toContainText('Delete Task');
    await expect(page.getByText('Are you sure you want to delete this task?')).toBeVisible();
    await expect(page.getByText(`"${taskTitle}"`)).toBeVisible();

    // Verify both buttons are present
    await expect(page.getByText('Cancel')).toBeVisible();
    await expect(page.getByTestId('confirm-delete-button')).toBeVisible();
  });

  test('should cancel deletion when clicking Cancel button in Board View', async ({ page }) => {
    // Create a task
    await appPage.openAddTaskModal();
    const taskTitle = 'Task Not to Delete';
    await taskPage.createTask({
      title: taskTitle,
      description: 'Will remain'
    });
    await taskPage.verifyModalClosed();

    // Switch to Board View
    await appPage.switchToView('board');

    // Click delete
    const taskCard = page.locator('[data-testid="board-task-item"]', { hasText: taskTitle });
    await taskCard.hover();
    await taskCard.locator('[data-testid="delete-task-button"]').click();

    // Click Cancel
    await page.getByText('Cancel').click();

    // Verify modal is closed
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify task still exists
    await expect(page.locator('[data-testid="board-task-item"]', { hasText: taskTitle })).toBeVisible();
  });

  test('should delete task when confirming in Board View', async ({ page }) => {
    // Create a task
    await appPage.openAddTaskModal();
    const taskTitle = 'Task to Actually Delete';
    await taskPage.createTask({
      title: taskTitle,
      description: 'Will be deleted'
    });
    await taskPage.verifyModalClosed();

    // Switch to Board View
    await appPage.switchToView('board');

    // Click delete and confirm
    const taskCard = page.locator('[data-testid="board-task-item"]', { hasText: taskTitle });
    await taskCard.hover();
    await taskCard.locator('[data-testid="delete-task-button"]').click();
    await page.getByTestId('confirm-delete-button').click();

    // Verify task is deleted
    await expect(page.locator('[data-testid="board-task-item"]', { hasText: taskTitle })).not.toBeVisible();
  });

  test('should close modal when clicking X button in Board View', async ({ page }) => {
    // Create a task
    await appPage.openAddTaskModal();
    const taskTitle = 'Task to Keep via X';
    await taskPage.createTask({
      title: taskTitle,
      description: 'Description'
    });
    await taskPage.verifyModalClosed();

    // Switch to Board View
    await appPage.switchToView('board');

    // Click delete
    const taskCard = page.locator('[data-testid="board-task-item"]', { hasText: taskTitle });
    await taskCard.hover();
    await taskCard.locator('[data-testid="delete-task-button"]').click();

    // Click X button
    await page.getByLabel('Close modal').click();

    // Verify modal is closed and task remains
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.locator('[data-testid="board-task-item"]', { hasText: taskTitle })).toBeVisible();
  });

  test('should show confirmation modal when deleting task in Tree View', async ({ page }) => {
    // Create a task
    await appPage.openAddTaskModal();
    const taskTitle = 'Task to Delete from Tree';
    await taskPage.createTask({
      title: taskTitle,
      description: 'This will be deleted'
    });
    await taskPage.verifyModalClosed();

    // Already in Tree View by default
    await appPage.switchToView('tree');

    // Find task and open menu
    const taskItem = page.locator('[data-testid="task-item"]', { hasText: taskTitle });
    const moreButton = taskItem.locator('button').filter({ has: page.locator('svg.lucide-more-horizontal') }).first();
    await moreButton.click();

    // Click delete in menu
    await page.locator('[data-testid="delete-task-button"]').click();

    // Verify modal appears
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('[id="delete-modal-title"]')).toContainText('Delete Task');
    await expect(page.getByText(`"${taskTitle}"`)).toBeVisible();
  });

  test('should cancel deletion in Tree View', async ({ page }) => {
    // Create a task
    await appPage.openAddTaskModal();
    const taskTitle = 'Task Not to Delete Tree';
    await taskPage.createTask({
      title: taskTitle,
      description: 'Will remain'
    });
    await taskPage.verifyModalClosed();

    // Tree View
    await appPage.switchToView('tree');

    // Open menu and click delete
    const taskItem = page.locator('[data-testid="task-item"]', { hasText: taskTitle });
    const moreButton = taskItem.locator('button').filter({ has: page.locator('svg.lucide-more-horizontal') }).first();
    await moreButton.click();
    await page.locator('[data-testid="delete-task-button"]').click();

    // Cancel
    await page.getByText('Cancel').click();

    // Verify task still exists
    await expect(page.locator('[data-testid="task-item"]', { hasText: taskTitle })).toBeVisible();
  });

  test('should delete task when confirming in Tree View', async ({ page }) => {
    // Create a task
    await appPage.openAddTaskModal();
    const taskTitle = 'Tree Task to Delete';
    await taskPage.createTask({
      title: taskTitle,
      description: 'Will be deleted'
    });
    await taskPage.verifyModalClosed();

    // Tree View
    await appPage.switchToView('tree');

    // Open menu, delete, and confirm
    const taskItem = page.locator('[data-testid="task-item"]', { hasText: taskTitle });
    const moreButton = taskItem.locator('button').filter({ has: page.locator('svg.lucide-more-horizontal') }).first();
    await moreButton.click();
    await page.locator('[data-testid="delete-task-button"]').click();
    await page.getByTestId('confirm-delete-button').click();

    // Verify task is deleted
    await expect(page.locator('[data-testid="task-item"]', { hasText: taskTitle })).not.toBeVisible();
  });

  test('should work with Spanish translations', async ({ page }) => {
    // Switch to Spanish
    await appPage.toggleLanguage();

    // Create a task
    await appPage.openAddTaskModal();
    const taskTitle = 'Tarea para Eliminar';
    await taskPage.createTask({
      title: taskTitle,
      description: 'Descripción'
    });
    await taskPage.verifyModalClosed();

    // Board View
    await appPage.switchToView('board');

    // Delete task
    const taskCard = page.locator('[data-testid="board-task-item"]', { hasText: taskTitle });
    await taskCard.hover();
    await taskCard.locator('[data-testid="delete-task-button"]').click();

    // Verify Spanish text in modal - scope to dialog to avoid ambiguity
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('¿Eliminar Tarea?')).toBeVisible();
    await expect(dialog.getByText('¿Estás seguro de que quieres eliminar esta tarea?')).toBeVisible();
    await expect(dialog.getByText('Sí, Eliminar')).toBeVisible();
    await expect(dialog.getByText('Cancelar')).toBeVisible();
  });
});
