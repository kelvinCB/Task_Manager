import { Page, Locator, expect } from '@playwright/test';

export class BoardPage {
  readonly page: Page;
  readonly openColumn: Locator;
  readonly inProgressColumn: Locator;
  readonly doneColumn: Locator;
  readonly taskCards: Locator;

  constructor(page: Page) {
    this.page = page;
    // Column headers
    this.openColumn = page.getByText('Open');
    this.inProgressColumn = page.getByText('In Progress');
    this.doneColumn = page.getByText('Done');
    // Task cards
    this.taskCards = page.locator('.bg-white.border.rounded-lg');
  }

  async verifyColumnsVisible() {
    await expect(this.openColumn).toBeVisible();
    await expect(this.inProgressColumn).toBeVisible();
    await expect(this.doneColumn).toBeVisible();
  }

  getTaskCard(taskTitle: string) {
    return this.taskCards.filter({ hasText: taskTitle });
  }

  async verifyTaskInColumn(taskTitle: string, column: 'Open' | 'In Progress' | 'Done') {
    const taskCard = this.getTaskCard(taskTitle);
    await expect(taskCard).toBeVisible();
    
    // Verify the task is in the correct column by checking the status badge
    const statusBadge = taskCard.locator('.inline-flex.items-center.px-2\\.5.py-0\\.5');
    await expect(statusBadge).toContainText(column);
  }

  async openTaskMenu(taskTitle: string) {
    const taskCard = this.getTaskCard(taskTitle);
    // Hover over the task card to make the edit/delete buttons visible
    await taskCard.hover();
    // Look for the edit button (Edit2 icon) or three dots menu
    const editButton = taskCard.getByTitle('Edit task');
    if (await editButton.isVisible()) {
      await editButton.click();
    } else {
      // Fallback to three dots menu if available
      const menuButton = taskCard.locator('button').filter({ hasText: '' }).last();
      await menuButton.click();
    }
  }

  async editTask(taskTitle: string) {
    const taskCard = this.getTaskCard(taskTitle);
    // Hover over the task card to make the edit/delete buttons visible
    await taskCard.hover();
    // Click the edit button directly
    const editButton = taskCard.getByTitle('Edit task');
    await editButton.click();
  }

  async deleteTask(taskTitle: string) {
    const taskCard = this.getTaskCard(taskTitle);
    // Hover over the task card to make the edit/delete buttons visible
    await taskCard.hover();
    // Click the delete button directly
    const deleteButton = taskCard.getByTitle('Delete task');
    await deleteButton.click();
  }

  async verifyTaskExists(taskTitle: string) {
    const taskCard = this.getTaskCard(taskTitle);
    await expect(taskCard).toBeVisible();
  }

  async verifyTaskNotExists(taskTitle: string) {
    const taskCard = this.getTaskCard(taskTitle);
    await expect(taskCard).not.toBeVisible();
  }

  async verifyEmptyState() {
    await expect(this.page.getByText('No tasks found')).toBeVisible();
  }

  async getTasksCount(): Promise<number> {
    return await this.taskCards.count();
  }

  async verifyTaskDetails(taskTitle: string, details: {
    description?: string;
    dueDate?: string;
    status?: string;
  }) {
    const taskCard = this.getTaskCard(taskTitle);
    
    if (details.description) {
      await expect(taskCard.getByText(details.description)).toBeVisible();
    }
    
    if (details.dueDate) {
      await expect(taskCard.getByText(details.dueDate)).toBeVisible();
    }
    
    if (details.status) {
      const statusBadge = taskCard.locator('.inline-flex.items-center.px-2\\.5.py-0\\.5');
      await expect(statusBadge).toContainText(details.status);
    }
  }
}
