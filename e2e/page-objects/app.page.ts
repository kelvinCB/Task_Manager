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
    // Navigation buttons use specific titles - use first() to handle desktop/mobile duplicates
    this.boardViewButton = page.getByTitle('Board View').first();
    this.treeViewButton = page.getByTitle('Tree View').first();
    this.timeStatsButton = page.getByTitle('Time Stats').first();
    this.themeToggle = page.getByTitle('Toggle Dark Mode').first();
    // Search input has specific placeholder
    this.searchInput = page.getByPlaceholder('Search tasks...');
    // Add task button - look for the button with Add Task text or Plus icon
    this.addTaskButton = page.getByRole('button', { name: /Add Task/i }).or(page.getByText('Add Task')).first();
    // Export/Import buttons - use first() to handle desktop/mobile duplicates
    this.exportButton = page.getByTitle('Export').first();
    this.importButton = page.getByTitle('Import').first();
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
    // Use first() to handle desktop/mobile duplicates
    await expect(this.page.getByTitle('Board View').first()).toBeVisible();
    await expect(this.page.getByTitle('Tree View').first()).toBeVisible();
    await expect(this.page.getByTitle('Time Stats').first()).toBeVisible();
  }

  async verifyCurrentView(view: 'board' | 'tree' | 'stats') {
    switch (view) {
      case 'board':
        // Verify board view by looking for board grid structure
        await expect(this.page.locator('.grid-cols-1.md\\:grid-cols-3')).toBeVisible();
        // Also verify column structure
        await expect(this.page.getByRole('heading', { name: 'Open', exact: true }).first()).toBeVisible();
        break;
      case 'tree':
        // Verify tree view by looking for container with tree-view-container data-testid
        await expect(this.page.getByTestId('tree-view-container')).toBeVisible();
        break;
      case 'stats':
        // Verify stats view by looking for characteristic elements - use first() for duplicates
        await expect(this.page.getByText(/Time Tracking Statistics/i).first()).toBeVisible();
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
