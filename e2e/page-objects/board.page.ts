import { Page, Locator, expect } from '@playwright/test';

export class BoardPage {
  readonly page: Page;
  readonly openColumn: Locator;
  readonly inProgressColumn: Locator;
  readonly reviewColumn: Locator;
  readonly doneColumn: Locator;
  readonly taskCards: Locator;

  constructor(page: Page) {
    this.page = page;
    // Column headers (strict, heading-only)
    this.openColumn = page.getByRole('heading', { name: 'Open', exact: true });
    this.inProgressColumn = page.getByRole('heading', { name: 'In Progress', exact: true });
    this.reviewColumn = page.getByRole('heading', { name: 'Review', exact: true });
    this.doneColumn = page.getByRole('heading', { name: 'Done', exact: true });
    this.taskCards = page.locator('[data-testid="board-task-item"]');
  }

  getColumn(status: 'Open' | 'In Progress' | 'Review' | 'Done') {
    return this.page
      .locator('.flex.flex-col.h-full')
      .filter({ has: this.page.getByRole('heading', { name: status, exact: true }) })
      .locator('div.flex-1.rounded-lg.border-2.border-dashed');
  }

  async verifyColumnsVisible() {
    await expect(this.openColumn).toBeVisible();
    await expect(this.inProgressColumn).toBeVisible();
    await expect(this.reviewColumn).toBeVisible();
    await expect(this.doneColumn).toBeVisible();
  }

  getTaskCard(taskTitle: string) {
    return this.page.locator(`[data-testid="board-task-item"][data-task-title="${taskTitle}"]`);
  }

  async verifyTaskInColumn(taskTitle: string, columnTitle: 'Open' | 'In Progress' | 'Review' | 'Done') {
    const column = this.getColumn(columnTitle);
    const taskCard = column.locator(`[data-testid="board-task-item"][data-task-title="${taskTitle}"]`);
    await expect(taskCard).toBeVisible();
  }

  async openTaskMenu(taskTitle: string) {
    const taskCard = this.getTaskCard(taskTitle);
    await taskCard.hover();
    const editButton = taskCard.getByTitle('Edit task');
    if (await editButton.isVisible()) {
      await editButton.click();
    } else {
      const menuButton = taskCard.locator('button').filter({ hasText: '' }).last();
      await menuButton.click();
    }
  }

  async editTask(taskTitle: string) {
    const taskCard = this.getTaskCard(taskTitle);
    await taskCard.hover();
    const editButton = taskCard.getByTestId('edit-task-button');
    await editButton.click();
  }

  async deleteTask(taskTitle: string) {
    const taskCard = this.getTaskCard(taskTitle);
    await taskCard.hover();
    const deleteButton = taskCard.getByTestId('delete-task-button');
    await deleteButton.click();
  }

  async verifyTaskExists(taskTitle: string) {
    await expect(this.getTaskCard(taskTitle)).toBeVisible();
  }

  async verifyTaskNotExists(taskTitle: string) {
    await expect(this.getTaskCard(taskTitle)).not.toBeVisible();
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

  async isTimerActive(taskTitle: string): Promise<boolean> {
    const taskCard = this.getTaskCard(taskTitle);
    const pauseButton = taskCard.locator('[data-testid="pause-timer"]');
    return await pauseButton.isVisible();
  }
}
