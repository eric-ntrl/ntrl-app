import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Claude UI Verification Tests
 *
 * This test file is specifically designed for Claude to capture UI screenshots
 * and verify the visual state of the NTRL app. Run with:
 *
 *   npx playwright test e2e/claude-ui-check.spec.ts
 *
 * Screenshots will be saved to e2e/snapshots/ for Claude to review.
 */

const SNAPSHOT_DIR = 'e2e/snapshots';

// Ensure snapshot directory exists
test.beforeAll(async () => {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
});

test.describe('Claude UI Capture', () => {
  test('capture feed screen - light mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for animations

    // Capture viewport screenshot
    await page.screenshot({
      path: path.join(SNAPSHOT_DIR, 'claude-feed-viewport.png'),
    });

    // Capture full page
    await page.screenshot({
      path: path.join(SNAPSHOT_DIR, 'claude-feed-fullpage.png'),
      fullPage: true,
    });

    console.log('Screenshots saved to e2e/snapshots/');
  });

  test('capture feed screen - dark mode', async ({ page }) => {
    // Emulate dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SNAPSHOT_DIR, 'claude-feed-dark.png'),
      fullPage: true,
    });
  });

  test('capture mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14 Pro

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SNAPSHOT_DIR, 'claude-feed-mobile.png'),
    });
  });

  test('interactive element inspection', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Get all interactive elements
    const clickables = await page.locator('button, a, [role="button"], [data-testid]').all();

    console.log(`Found ${clickables.length} interactive elements`);

    // Log element info for Claude
    for (let i = 0; i < Math.min(clickables.length, 10); i++) {
      const el = clickables[i];
      const text = await el.textContent();
      const testId = await el.getAttribute('data-testid');
      console.log(`Element ${i + 1}: testId="${testId}", text="${text?.trim().substring(0, 50)}"`);
    }
  });
});

test.describe('Screen-by-Screen Capture', () => {
  test('capture all navigation states', async ({ page }) => {
    const routes = [
      { path: '/', name: 'home' },
      // Add more routes as needed
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `claude-screen-${route.name}.png`),
        fullPage: true,
      });
    }
  });
});
