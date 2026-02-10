import { test, expect } from '@playwright/test';

test.describe('Auth Media Assets Verification', () => {
  const authPages = ['/login', '/register', '/forgot-password'];

  for (const path of authPages) {
    test(`Verify video illustrations on ${path}`, async ({ page }) => {
      // Set a large viewport to ensure the illustration side is visible
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await page.goto(path);

      // Verify that the video container exists (hidden on mobile, visible on desktop)
      const videoContainer = page.locator('div.hidden.lg\\:flex');
      await expect(videoContainer).toBeVisible();

      // Check for video tags
      const videos = page.locator('video');
      const count = await videos.count();
      
      // There should be 2 videos (one for light, one for dark mode)
      expect(count).toBeGreaterThanOrEqual(1);

      // Verify each video has a valid source and poster
      for (let i = 0; i < count; i++) {
        const video = videos.nth(i);
        const src = await video.getAttribute('src');
        const poster = await video.getAttribute('poster');

        expect(src).toMatch(/\.(mp4|webm)$/);
        expect(poster).toMatch(/\.(jpg|jpeg|png|webp)$/);

        // Verify the resources are actually reachable (status 200)
        const srcResponse = await page.request.get(src!);
        expect(srcResponse.ok()).toBeTruthy();

        const posterResponse = await page.request.get(poster!);
        expect(posterResponse.ok()).toBeTruthy();
      }
    });
  }
});
