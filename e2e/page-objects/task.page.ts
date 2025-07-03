import { Page, Locator, expect } from '@playwright/test';

export class TaskPage {
  readonly page: Page;
  readonly taskModal: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly dueDateInput: Locator;
  readonly statusSelect: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;
  readonly aiButton: Locator;
  readonly aiGenerateButton: Locator;
  readonly aiCancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.taskModal = page.locator('[role="dialog"]');
    this.titleInput = page.getByLabel(/task title/i);
    this.descriptionInput = page.getByLabel(/description/i);
    this.dueDateInput = page.getByLabel(/due date/i);
    this.statusSelect = page.getByLabel(/status/i);
    this.createButton = page.getByRole('button', { name: /create task/i });
    this.updateButton = page.getByRole('button', { name: /update task/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
    this.closeButton = page.getByRole('button', { name: /close/i });
    this.aiButton = page.getByRole('button', { name: /ai/i });
    this.aiGenerateButton = page.getByRole('button', { name: /generate/i });
    this.aiCancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async verifyModalOpen() {
    await expect(this.taskModal).toBeVisible();
  }

  async verifyModalClosed() {
    await expect(this.taskModal).not.toBeVisible();
  }

  async fillTaskForm(data: {
    title: string;
    description?: string;
    dueDate?: string;
    status?: string;
  }) {
    await this.titleInput.fill(data.title);
    
    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }
    
    if (data.dueDate) {
      await this.dueDateInput.fill(data.dueDate);
    }
    
    if (data.status) {
      await this.statusSelect.selectOption(data.status);
    }
  }

  async createTask(data: {
    title: string;
    description?: string;
    dueDate?: string;
    status?: string;
  }) {
    await this.fillTaskForm(data);
    await this.createButton.click();
  }

  async updateTask(data: {
    title?: string;
    description?: string;
    dueDate?: string;
    status?: string;
  }) {
    if (data.title !== undefined) {
      await this.titleInput.clear();
      await this.titleInput.fill(data.title);
    }
    
    if (data.description !== undefined) {
      await this.descriptionInput.clear();
      await this.descriptionInput.fill(data.description);
    }
    
    if (data.dueDate !== undefined) {
      await this.dueDateInput.clear();
      await this.dueDateInput.fill(data.dueDate);
    }
    
    if (data.status) {
      await this.statusSelect.selectOption(data.status);
    }
    
    await this.updateButton.click();
  }

  async cancelTask() {
    await this.cancelButton.click();
  }

  async closeTask() {
    await this.closeButton.click();
  }

  async useAIGeneration() {
    await this.aiButton.click();
    await expect(this.aiGenerateButton).toBeVisible();
    await this.aiGenerateButton.click();
  }

  async cancelAIGeneration() {
    await this.aiButton.click();
    await this.aiCancelButton.click();
  }

  async verifyFormValues(data: {
    title?: string;
    description?: string;
    dueDate?: string;
    status?: string;
  }) {
    if (data.title !== undefined) {
      await expect(this.titleInput).toHaveValue(data.title);
    }
    
    if (data.description !== undefined) {
      await expect(this.descriptionInput).toHaveValue(data.description);
    }
    
    if (data.dueDate !== undefined) {
      await expect(this.dueDateInput).toHaveValue(data.dueDate);
    }
    
    if (data.status !== undefined) {
      await expect(this.statusSelect).toHaveValue(data.status);
    }
  }

  async verifyValidationErrors() {
    // Check for validation error messages
    const errorMessages = this.page.locator('.error, [role="alert"], .text-red-500');
    await expect(errorMessages).toBeVisible();
  }
}
