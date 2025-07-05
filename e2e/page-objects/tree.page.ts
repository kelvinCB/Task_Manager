import { Page, Locator, expect } from '@playwright/test';

export class TreePage {
  readonly page: Page;
  readonly treeContainer: Locator;
  readonly taskItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.treeContainer = page.getByTestId('tree-view-container');
    this.taskItems = this.treeContainer.locator('.task-item, [data-testid*="task"]');
  }

  async verifyTreeViewVisible() {
    await expect(this.treeContainer).toBeVisible();
  }

  getTaskItem(taskTitle: string) {
    return this.taskItems.filter({ hasText: taskTitle });
  }

  async editTask(taskTitle: string) {
    const taskItem = this.getTaskItem(taskTitle);
    // Hover over the task item to make buttons visible
    await taskItem.hover();
    
    // Look for edit button in tree view
    const editButton = taskItem.getByTitle('Edit task').or(
      taskItem.locator('button').filter({ hasText: 'Edit' })
    );
    await editButton.click();
  }

  async deleteTask(taskTitle: string) {
    const taskItem = this.getTaskItem(taskTitle);
    // Hover over the task item to make buttons visible
    await taskItem.hover();
    
    // Look for delete button in tree view
    const deleteButton = taskItem.getByTitle('Delete task').or(
      taskItem.locator('button').filter({ hasText: 'Delete' })
    );
    await deleteButton.click();
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
