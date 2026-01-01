import { Page, Locator, expect } from '@playwright/test';

export class TreePage {
  readonly page: Page;
  readonly treeContainer: Locator;
  readonly taskItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.treeContainer = page.getByTestId('tree-view-container');
    this.taskItems = this.treeContainer.locator('[data-testid="task-item"]');
  }

  async verifyTreeViewVisible() {
    await expect(this.treeContainer).toBeVisible();
  }

  getTaskItem(taskTitle: string) {
    return this.page.locator(`[data-testid="task-item"][data-task-title="${taskTitle}"]`);
  }

  async editTask(taskTitle: string) {
    const taskItem = this.getTaskItem(taskTitle);
    // Hover over the task item to make buttons visible
    await taskItem.hover();

    // Open the menu
    const moreButton = taskItem.locator('button').filter({ has: this.page.locator('svg') }).last();
    await moreButton.click();

    // Click edit button
    await this.page.getByTestId('edit-task-button').click();
  }

  async deleteTask(taskTitle: string) {
    const taskItem = this.getTaskItem(taskTitle);
    // Hover over the task item to make buttons visible
    await taskItem.hover();

    // Open the menu
    const moreButton = taskItem.locator('button').filter({ has: this.page.locator('svg') }).last();
    await moreButton.click();

    // Click delete button
    await this.page.getByTestId('delete-task-button').click();
  }

  async toggleExpand(taskTitle: string) {
    const taskItem = this.getTaskItem(taskTitle);
    const expandButton = taskItem.locator('button').first();
    await expandButton.click();
  }

  async addSubtask(parentTaskTitle: string) {
    const taskItem = this.getTaskItem(parentTaskTitle);
    // Hover over the task item to make buttons visible
    await taskItem.hover();

    // Open the menu
    const moreButton = taskItem.locator('button').filter({ has: this.page.locator('svg') }).last();
    await moreButton.click();

    // Click "Add Subtask"
    await this.page.getByTestId('add-subtask-button').click();
  }

  async verifyTaskExists(taskTitle: string) {
    const taskItem = this.getTaskItem(taskTitle);
    await expect(taskItem).toBeVisible();
  }

  async verifyTaskNotExists(taskTitle: string) {
    const taskItem = this.getTaskItem(taskTitle);
    await expect(taskItem).not.toBeVisible();
  }

  async verifyTaskDetails(taskTitle: string, details: {
    description?: string;
    dueDate?: string;
    status?: string;
  }) {
    const taskItem = this.getTaskItem(taskTitle);

    if (details.description) {
      await expect(taskItem.getByText(details.description)).toBeVisible();
    }

    if (details.dueDate) {
      await expect(taskItem.getByText(details.dueDate)).toBeVisible();
    }

    if (details.status) {
      const statusElement = taskItem.locator('.status, .badge, [data-testid*="status"]');
      await expect(statusElement).toContainText(details.status);
    }
  }

  async getTasksCount(): Promise<number> {
    return await this.taskItems.count();
  }

  async verifyEmptyState() {
    await expect(this.page.getByText('No tasks found').or(
      this.page.getByText('No tasks available')
    )).toBeVisible();
  }

  async expandTask(taskTitle: string) {
    const taskItem = this.getTaskItem(taskTitle);
    const expandButton = taskItem.locator('.expand-button, [data-testid*="expand"]').first();

    if (await expandButton.isVisible()) {
      await expandButton.click();
    }
  }

  async collapseTask(taskTitle: string) {
    const taskItem = this.getTaskItem(taskTitle);
    const collapseButton = taskItem.locator('.collapse-button, [data-testid*="collapse"]').first();

    if (await collapseButton.isVisible()) {
      await collapseButton.click();
    }
  }

  async verifyTaskHierarchy(parentTask: string, childTask: string) {
    const parentItem = this.getTaskItem(parentTask);
    const childItem = this.getTaskItem(childTask);

    // Verify both tasks exist
    await expect(parentItem).toBeVisible();
    await expect(childItem).toBeVisible();

    // Verify child is nested under parent (this might need adjustment based on actual implementation)
    const parentBounds = await parentItem.boundingBox();
    const childBounds = await childItem.boundingBox();

    if (parentBounds && childBounds) {
      // Child should be indented (more to the right) than parent
      expect(childBounds.x).toBeGreaterThan(parentBounds.x);
    }
  }
}
