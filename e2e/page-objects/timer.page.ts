import { Page, Locator, expect } from '@playwright/test';

export class TimerPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Get timer for a specific task by task title or index
  getTaskTimer(taskIdentifier: string | number) {
    if (typeof taskIdentifier === 'string') {
      // Find the task by text content, then find the timer within the same container
      // Use a more robust selector that works across different views (board, tree)
      return this.page.getByText(taskIdentifier).locator('..').locator('..').locator('[data-testid="task-timer"]').first();
    } else {
      // Find timer by index
      return this.page.locator('[data-testid="task-timer"]').nth(taskIdentifier);
    }
  }

  getStartButton(taskIdentifier: string | number) {
    const timer = this.getTaskTimer(taskIdentifier);
    return timer.getByTitle('Start timer');
  }

  getPauseButton(taskIdentifier: string | number) {
    const timer = this.getTaskTimer(taskIdentifier);
    return timer.getByTitle('Pause timer');
  }

  getElapsedTime(taskIdentifier: string | number) {
    const timer = this.getTaskTimer(taskIdentifier);
    return timer.locator('[data-testid="elapsed-time"]');
  }

  async startTimer(taskIdentifier: string | number) {
    const startButton = this.getStartButton(taskIdentifier);
    await startButton.click();
  }

  async pauseTimer(taskIdentifier: string | number) {
    const pauseButton = this.getPauseButton(taskIdentifier);
    await pauseButton.click();
  }

  async verifyTimerRunning(taskIdentifier: string | number) {
    const pauseButton = this.getPauseButton(taskIdentifier);
    await expect(pauseButton).toBeVisible();
    
    // Verify that the timer is actively updating
    const elapsedTime = this.getElapsedTime(taskIdentifier);
    const initialTime = await elapsedTime.textContent();
    
    // Wait a moment and check if time has changed
    await this.page.waitForTimeout(1500);
    const updatedTime = await elapsedTime.textContent();
    
    expect(updatedTime).not.toBe(initialTime);
  }

  async verifyTimerStopped(taskIdentifier: string | number) {
    const startButton = this.getStartButton(taskIdentifier);
    await expect(startButton).toBeVisible();
  }

  async verifyElapsedTime(taskIdentifier: string | number, expectedTime: string) {
    const elapsedTime = this.getElapsedTime(taskIdentifier);
    await expect(elapsedTime).toHaveText(expectedTime);
  }

  async getElapsedTimeText(taskIdentifier: string | number): Promise<string> {
    const elapsedTime = this.getElapsedTime(taskIdentifier);
    return await elapsedTime.textContent() || '00:00:00';
  }

  // Helper method to convert time string to seconds for comparison
  timeToSeconds(timeString: string): number {
    const parts = timeString.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  }

  async verifyTimerIncreased(taskIdentifier: string | number, initialTime: string) {
    const currentTime = await this.getElapsedTimeText(taskIdentifier);
    const initialSeconds = this.timeToSeconds(initialTime);
    const currentSeconds = this.timeToSeconds(currentTime);
    
    expect(currentSeconds).toBeGreaterThan(initialSeconds);
  }

  async verifyAllTimersStopped() {
    const pauseButtons = this.page.locator('[data-testid="task-timer"] button:has-text(/pause|stop/i)');
    await expect(pauseButtons).toHaveCount(0);
  }

  async verifyTimerNotification() {
    // This would require testing audio or visual notifications
    // For now, we'll check for any notification elements
    const notifications = this.page.locator('[role="alert"], .notification, .toast');
    await expect(notifications).toBeVisible();
  }
}
