import { Page, Locator, expect } from '@playwright/test';

export class AppPage {
  readonly page: Page;
  readonly boardViewButton: Locator;
  readonly treeViewButton: Locator;
  readonly timeStatsButton: Locator;
  readonly themeToggle: Locator;
  readonly searchInput: Locator;
  readonly addTaskButton: Locator;
  readonly accountMenu: Locator;
  readonly importInput: Locator;

  constructor(page: Page) {
    this.page = page;
    // Navigation buttons use specific titles - use first() to handle desktop/mobile duplicates
    this.boardViewButton = page.getByTitle('Board View').first();
    this.treeViewButton = page.getByTitle('Tree View').first();
    this.timeStatsButton = page.getByTitle('Time Stats').first();
    this.themeToggle = page.getByTitle('Toggle Dark Mode').first();
    // Search input - Mobile uses 'Search...', Desktop uses 'Search tasks...'
    this.searchInput = page.getByPlaceholder('Search tasks...').or(page.getByPlaceholder('Search...')).first();
    // Add task button - Mobile shows 'Add', Desktop shows 'Add Task'
    this.addTaskButton = page.getByRole('button', { name: /Add/i }).first();
    // My Account menu
    this.accountMenu = page.getByTitle('My Account').first();
    this.importInput = page.locator('input[type="file"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async switchToView(view: 'board' | 'tree' | 'stats', force = false) {
    let buttonSelector: string;
    switch (view) {
      case 'board':
        buttonSelector = 'button[title="Board View"]';
        break;
      case 'tree':
        buttonSelector = 'button[title="Tree View"]';
        break;
      case 'stats':
        buttonSelector = 'button[title="Time Stats"]';
        break;
    }
    
    // Find all buttons and try each one until one works
    const buttons = await this.page.locator(buttonSelector).all();
    
    if (buttons.length === 0) {
      throw new Error(`No ${view} view button found`);
    }
    
    let viewSwitched = false;
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const isVisible = await button.isVisible().catch(() => false);
      
      if (isVisible || force) {
        try {
          await button.click({ force });
          await this.page.waitForTimeout(1000);
          viewSwitched = true;
          break;
        } catch (e) {
          // Continue to next button
        }
      }
    }
    
    if (!viewSwitched) {
      throw new Error(`Could not switch to ${view} view - no button was clickable`);
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
    // Open account menu first
    await this.accountMenu.click();
    // Click the Export Tasks option in the dropdown
    await this.page.getByRole('menuitem').filter({ hasText: 'Export Tasks' }).click();
  }

  async importTasks(filePath: string) {
    // Open account menu first
    await this.accountMenu.click();
    // Click on the Import Tasks option which is associated with a hidden file input
    await this.page.getByRole('menuitem').filter({ hasText: 'Import Tasks' }).click();
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
