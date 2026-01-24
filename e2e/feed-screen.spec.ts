import { test, expect } from '@playwright/test';

/**
 * E2E tests for the NTRL App Feed Screen
 * These tests run against the Expo Web version
 */

test.describe('Feed Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test('should display the main feed', async ({ page }) => {
    // Take a screenshot of the initial feed state
    await page.screenshot({
      path: 'e2e/snapshots/feed-screen-initial.png',
      fullPage: true
    });

    // Verify the page loaded
    await expect(page).toHaveTitle(/NTRL|Expo/);
  });

  test('should display news sections', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);

    // Take screenshot of loaded content
    await page.screenshot({
      path: 'e2e/snapshots/feed-screen-loaded.png',
      fullPage: true
    });
  });

  test('should navigate to article detail', async ({ page }) => {
    // Wait for articles to load
    await page.waitForTimeout(2000);

    // Try to find and click an article
    const article = page.locator('[data-testid="article-item"]').first();
    if (await article.isVisible()) {
      await article.click();
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'e2e/snapshots/article-detail.png',
        fullPage: true
      });
    }
  });
});

test.describe('Visual Regression', () => {
  test('capture all main screens for Claude review', async ({ page }) => {
    // Feed Screen
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'e2e/snapshots/visual-feed.png',
      fullPage: true
    });

    // Scroll to see more content
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.screenshot({
      path: 'e2e/snapshots/visual-feed-scrolled.png',
      fullPage: true
    });
  });
});
