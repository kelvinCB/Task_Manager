import { Page, Locator, expect } from '@playwright/test';

export class TimerPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Get timer for a specific task by task title or index
  getTaskTimer(taskIdentifier: string | number) {
    if (typeof taskIdentifier === 'string') {
      // Find the task by text content in the group container, then find the timer within
      // This approach works better with the responsive dual layout
      return this.page.locator('.group').filter({ hasText: taskIdentifier }).locator('[data-testid="task-timer"]').first();
    } else {
      // Find timer by index - use first() to handle dual mobile/desktop elements
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
    
    // Wait longer to ensure timer updates (responsive layout may affect timing)
    await this.page.waitForTimeout(2500);
    const updatedTime = await elapsedTime.textContent();
    
    // If times are equal, wait a bit more and try again (sometimes the timer needs more time)
    if (initialTime === updatedTime) {
      await this.page.waitForTimeout(2000);
      const finalTime = await elapsedTime.textContent();
      expect(finalTime).not.toBe(initialTime);
    } else {
      expect(updatedTime).not.toBe(initialTime);
    }
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
    const fullText = await elapsedTime.textContent() || '00:00:00';
    
    // Handle dual mobile/desktop format - the element contains both hidden mobile and visible desktop spans
    // We need to get the visible time text only
    
    // Try to get desktop format first (hidden on mobile)
    const desktopSpan = elapsedTime.locator('span.hidden.sm\\:inline');
    const mobileSpan = elapsedTime.locator('span.sm\\:hidden');
    
    // Check which one is visible and get its text
    const desktopVisible = await desktopSpan.isVisible().catch(() => false);
    const mobileVisible = await mobileSpan.isVisible().catch(() => false);
    
    if (desktopVisible) {
      return await desktopSpan.textContent() || '00:00:00';
    } else if (mobileVisible) {
      return await mobileSpan.textContent() || '0:00';
    }
    
    // Fallback: try to parse the concatenated text
    // Pattern: desktop format followed by mobile format
    // e.g., "00:00:070:07" = "00:00:07" + "0:07"
    if (fullText.includes(':')) {
      const parts = fullText.split(':');
      if (parts.length >= 3) {
        // Take first 3 parts as hh:mm:ss format
        return `${parts[0]}:${parts[1]}:${parts[2]}`;
      }
    }
    
    return fullText;
  }

  // Helper method to convert time string to seconds for comparison
  // Handles both mobile compact format (mm:ss) and desktop full format (hh:mm:ss)
  timeToSeconds(timeString: string): number {
    const parts = timeString.split(':').map(Number);
    if (parts.length === 3) {
      // Full format: hh:mm:ss
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // Compact format: mm:ss (mobile)
      return parts[0] * 60 + parts[1];
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
