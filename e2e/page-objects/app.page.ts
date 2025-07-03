import { Page, Locator, expect } from '@playwright/test';

export class AppPage {
  readonly page: Page;
  readonly boardViewButton: Locator;
  readonly treeViewButton: Locator;
  readonly timeStatsButton: Locator;
  readonly themeToggle: Locator;
  readonly searchInput: Locator;
  readonly addTaskButton: Locator;
  readonly exportButton: Locator;
  readonly importButton: Locator;
  readonly importInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.boardViewButton = page.getByTitle('Board View');
    this.treeViewButton = page.getByTitle('Tree View');
    this.timeStatsButton = page.getByTitle('Time Stats');
    this.themeToggle = page.getByTitle('Toggle Dark Mode');
    this.searchInput = page.getByPlaceholder(/search tasks/i);
    this.addTaskButton = page.getByRole('button', { name: /add task/i });
    this.exportButton = page.getByTitle('Export');
    this.importButton = page.getByTitle('Import');
    this.importInput = page.locator('input[type="file"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async switchToView(view: 'board' | 'tree' | 'stats') {
    switch (view) {
      case 'board':
        await this.boardViewButton.click();
        break;
      case 'tree':
        await this.treeViewButton.click();
        break;
      case 'stats':
        await this.timeStatsButton.click();
        break;
    }
  }

  async toggleTheme() {
    await this.themeToggle.click();
  }

  async searchTasks(query: string) {
    await this.searchInput.fill(query);
  }

  async clearSearch() {
    await this.searchInput.clear();
  }

  async openAddTaskModal() {
    await this.addTaskButton.click();
  }

  async exportTasks() {
    await this.exportButton.click();
  }

  async importTasks(filePath: string) {
    await this.importButton.click();
    await this.importInput.setInputFiles(filePath);
  }

  async verifyPageLoaded() {
    await expect(this.boardViewButton).toBeVisible();
    await expect(this.treeViewButton).toBeVisible();
    await expect(this.timeStatsButton).toBeVisible();
  }

  async verifyCurrentView(view: 'board' | 'tree' | 'stats') {
    switch (view) {
      case 'board':
        // Verify board view by looking for characteristic elements
        await expect(this.page.getByText('Open')).toBeVisible();
        await expect(this.page.getByText('In Progress')).toBeVisible();
        await expect(this.page.getByText('Done')).toBeVisible();
        break;
      case 'tree':
        // Verify tree view by looking for container with tree-view-container data-testid
        await expect(this.page.getByTestId('tree-view-container')).toBeVisible();
        break;
      case 'stats':
        // Verify stats view by looking for characteristic elements
        await expect(this.page.getByText(/time statistics/i)).toBeVisible();
        break;
    }
  }

  async verifyTheme(theme: 'light' | 'dark') {
    const htmlElement = this.page.locator('html');
    if (theme === 'dark') {
      await expect(htmlElement).toHaveClass(/dark/);
    } else {
      await expect(htmlElement).not.toHaveClass(/dark/);
    }
  }
}
