/**
 * Comprehensive NTRL App Screenshot Capture Script
 *
 * Captures top and bottom screenshots of all major screens in the NTRL app.
 * Run with: node e2e/capture-all-screens.cjs
 *
 * Requires Expo web running on localhost:8081
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Output directory for screenshots
const OUTPUT_DIR = '/Users/ericrbrown/Documents/NTRL/Screen Shots';

// Viewport size (iPhone 14 Pro)
const VIEWPORT = { width: 390, height: 844 };

// Helper to wait for content
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to find the main scrollable container in RN Web
async function findScrollContainer(page) {
  return await page.evaluate(() => {
    // Find all elements with overflow auto/scroll that can actually scroll
    const allElements = document.querySelectorAll('*');
    let bestContainer = null;
    let maxScrollHeight = 0;

    for (const el of allElements) {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') &&
          el.scrollHeight > el.clientHeight) {
        // Prefer larger scroll containers
        if (el.scrollHeight > maxScrollHeight) {
          maxScrollHeight = el.scrollHeight;
          bestContainer = el;
        }
      }
    }
    return bestContainer ? true : false;
  });
}

// Helper to scroll to top (works with RN Web scroll containers)
async function scrollToTop(page) {
  await page.evaluate(() => {
    // Find and scroll all scrollable containers to top
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') &&
          el.scrollHeight > el.clientHeight) {
        el.scrollTop = 0;
      }
    }
    window.scrollTo(0, 0);
  });
  await wait(500);
}

// Helper to scroll to bottom (works with RN Web scroll containers)
async function scrollToBottom(page) {
  await page.evaluate(() => {
    // Find and scroll all scrollable containers to bottom
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') &&
          el.scrollHeight > el.clientHeight) {
        el.scrollTop = el.scrollHeight;
      }
    }
    window.scrollTo(0, document.body.scrollHeight);
  });
  await wait(500);
}

// Helper to detect if page is scrollable (works with RN Web scroll containers)
async function isScrollable(page) {
  return await page.evaluate(() => {
    // Check body first
    if (document.body.scrollHeight > window.innerHeight) {
      return true;
    }
    // Check for RN Web scroll containers (they have overflow: auto/scroll)
    const scrollContainers = document.querySelectorAll('*');
    for (const el of scrollContainers) {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') &&
          el.scrollHeight > el.clientHeight + 10) {
        return true;
      }
    }
    return false;
  });
}

// Helper to take screenshots - smart detection of scrollable vs non-scrollable
async function captureScreen(page, prefix, description) {
  console.log(`📸 Capturing ${description}...`);

  // Check if page is scrollable
  const scrollable = await isScrollable(page);

  if (scrollable) {
    // Scroll to top and capture
    await scrollToTop(page);
    await wait(300);
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${prefix}-top.png`) });
    console.log(`   ✓ ${prefix}-top.png`);

    // Scroll to bottom and capture
    await scrollToBottom(page);
    await wait(300);
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${prefix}-bottom.png`) });
    console.log(`   ✓ ${prefix}-bottom.png`);
  } else {
    // Single screenshot for non-scrollable screens
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${prefix}.png`) });
    console.log(`   ✓ ${prefix}.png (no scroll)`);
  }
}

// Helper to click tab bar item (bottom nav) using JavaScript
async function clickTab(page, tabName) {
  // Use JavaScript to find and click the tab, avoiding pointer interception issues
  await page.evaluate((name) => {
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
      if (el.textContent === name && el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
        // Found exact text match - click its parent pressable
        let parent = el.parentElement;
        while (parent) {
          if (parent.getAttribute('role') === 'button' || parent.tabIndex >= 0 || parent.onclick) {
            parent.click();
            return;
          }
          parent = parent.parentElement;
        }
        // Fallback - just click the element
        el.click();
        return;
      }
    }
  }, tabName);
  await wait(1500);
}

// Helper to go back (navigate back) using JavaScript
async function goBack(page) {
  try {
    await page.evaluate(() => {
      // Find back button by aria-label or common back indicators
      const backBtn = document.querySelector('[aria-label="Go back"]') ||
                      document.querySelector('[aria-label*="back" i]');
      if (backBtn) {
        backBtn.click();
        return true;
      }
      // Try finding the chevron
      const chevrons = document.querySelectorAll('*');
      for (const el of chevrons) {
        if (el.textContent === '‹' || el.textContent === '<') {
          let parent = el.parentElement;
          while (parent) {
            if (parent.getAttribute('role') === 'button' || parent.tabIndex >= 0) {
              parent.click();
              return true;
            }
            parent = parent.parentElement;
          }
        }
      }
      return false;
    });
    await wait(1000);
    return true;
  } catch {
    return false;
  }
}

// Helper to click element by text using JavaScript
async function clickByText(page, text, exact = true) {
  const clicked = await page.evaluate(({ text, exact }) => {
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
      const elText = el.textContent;
      const matches = exact ? (elText === text) : elText.includes(text);
      if (matches && el.childNodes.length <= 2) {
        // Find clickable parent
        let parent = el;
        while (parent) {
          if (parent.getAttribute('role') === 'button' || parent.tabIndex >= 0 || parent.onclick) {
            parent.click();
            return true;
          }
          parent = parent.parentElement;
        }
        el.click();
        return true;
      }
    }
    return false;
  }, { text, exact });
  await wait(1000);
  return clicked;
}

// Helper to click segmented control tab (Brief/Full/Ntrl) more reliably
async function clickSegmentTab(page, tabName) {
  const clicked = await page.evaluate((name) => {
    // Strategy 1: Find elements with role="tab" containing the tab name
    const tabs = document.querySelectorAll('[role="tab"]');
    for (const tab of tabs) {
      if (tab.textContent.trim() === name) {
        tab.click();
        return true;
      }
    }
    // Strategy 2: Find by exact text in a leaf node (segmented control buttons)
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      if (el.textContent === name &&
          el.childNodes.length === 1 &&
          el.childNodes[0].nodeType === Node.TEXT_NODE) {
        // Found exact match - click the element or its clickable parent
        let parent = el;
        while (parent) {
          if (parent.getAttribute('role') === 'button' ||
              parent.tabIndex >= 0 ||
              parent.onclick ||
              parent.getAttribute('aria-label') === name) {
            parent.click();
            return true;
          }
          parent = parent.parentElement;
        }
        el.click();
        return true;
      }
    }
    return false;
  }, tabName);
  await wait(1000);
  return clicked;
}

// Helper to verify Ntrl tab is active by checking for its specific content
async function verifyNtrlTabActive(page) {
  return await page.evaluate(() => {
    // Check for ntrl-view-screen testID
    if (document.querySelector('[data-testid="ntrl-view-screen"]')) {
      return true;
    }
    // Check for "Tap for details" text (gauge indicator)
    if (document.body.textContent.includes('Tap for details')) {
      return true;
    }
    // Check for highlight spans
    if (document.querySelector('[data-testid^="highlight-span-"]')) {
      return true;
    }
    return false;
  });
}

// Main capture function
async function captureAllScreens() {
  console.log('\n🚀 Starting NTRL Screenshot Capture\n');
  console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  try {
    // Load the app
    console.log('🌐 Loading app at http://localhost:8081...');
    await page.goto('http://localhost:8081');
    await page.waitForLoadState('networkidle');
    await wait(3000);

    // Check if intro screen is showing
    const introButton = page.getByText('Begin', { exact: true });
    const hasIntro = await introButton.isVisible().catch(() => false);

    // 1. Intro/Onboarding Screen (if visible)
    if (hasIntro) {
      console.log('\n📱 Found intro screen');
      await captureScreen(page, 'intro', 'Intro/Onboarding');

      // Dismiss intro
      await introButton.click();
      await wait(2000);
    } else {
      console.log('\n⏭️  No intro screen (already dismissed)');
    }

    // 2. Today Screen (main feed - should be visible after intro)
    console.log('\n📱 Today Screen');
    await captureScreen(page, 'today', 'Today feed');

    // 3. Sections Screen (via bottom tab)
    console.log('\n📱 Sections Screen');
    await clickTab(page, 'Sections');
    await captureScreen(page, 'sections', 'Sections');

    // 4. Profile Screen (via bottom tab)
    console.log('\n📱 Profile Screen');
    await clickTab(page, 'Profile');
    await wait(1000);
    await captureScreen(page, 'profile', 'Profile');

    // 5. Settings Screen (from Profile - hamburger menu icon)
    console.log('\n📱 Settings Screen');
    const settingsClicked = await page.evaluate(() => {
      const btn = document.querySelector('[aria-label="Settings"]');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (settingsClicked) {
      await wait(1500);
      await captureScreen(page, 'settings', 'Settings');
      await goBack(page);
    } else {
      console.log('   ⚠️  Settings icon not found');
    }

    // 6. Search Screen (from Sections header - magnifying glass icon)
    console.log('\n📱 Search Screen');
    await clickTab(page, 'Sections');
    await wait(500);
    const searchClicked = await page.evaluate(() => {
      const btn = document.querySelector('[aria-label="Search"]');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (searchClicked) {
      await wait(1500);
      await captureScreen(page, 'search', 'Search');
      await goBack(page);
    } else {
      console.log('   ⚠️  Search icon not found');
    }

    // 7. Saved Articles Screen (from Profile)
    console.log('\n📱 Saved Articles Screen');
    await clickTab(page, 'Profile');
    await wait(500);
    if (await clickByText(page, 'Saved Articles')) {
      await wait(1000);
      await captureScreen(page, 'saved', 'Saved Articles');
      await goBack(page);
    } else {
      console.log('   ⚠️  Saved Articles link not found');
    }

    // 8. History Screen (from Profile)
    console.log('\n📱 History Screen');
    await clickTab(page, 'Profile');
    await wait(500);
    if (await clickByText(page, 'Reading History')) {
      await wait(1000);
      await captureScreen(page, 'history', 'Reading History');
      await goBack(page);
    } else {
      console.log('   ⚠️  Reading History link not found');
    }

    // Navigate to Today for article detail
    console.log('\n📱 Navigating to article detail...');
    await clickTab(page, 'Today');
    await wait(2000);

    // Click first article using JavaScript to avoid interception issues
    const articleClicked = await page.evaluate(() => {
      // Find article cards - they have specific structure with title text
      const possibleArticles = document.querySelectorAll('[tabindex="0"]');
      for (const el of possibleArticles) {
        const text = el.textContent || '';
        // Skip if it's a tab bar item or header
        if (text.includes('Today') && text.includes('Sections') && text.includes('Profile')) continue;
        if (text.length < 30) continue;
        // Check if it looks like an article (has source and time)
        if (text.includes('ago') || text.includes('min') || text.includes('hour')) {
          el.click();
          return text.substring(0, 50);
        }
      }
      return null;
    });

    if (articleClicked) {
      console.log(`   Clicked article: "${articleClicked}..."`);
      await wait(3000);

      // 9. Article Detail - Brief tab (default)
      console.log('\n📱 Article Detail - Brief');
      await captureScreen(page, 'detail-brief', 'Article Brief');

      // 10. Article Detail - Full tab
      console.log('\n📱 Article Detail - Full');
      if (await clickSegmentTab(page, 'Full')) {
        await wait(1500);
        await captureScreen(page, 'detail-full', 'Article Full');
      } else {
        // Fallback to clickByText
        if (await clickByText(page, 'Full')) {
          await wait(1500);
          await captureScreen(page, 'detail-full', 'Article Full');
        }
      }

      // 11. Article Detail - Ntrl tab
      console.log('\n📱 Article Detail - Ntrl');
      await clickSegmentTab(page, 'Ntrl');
      await wait(1500);

      // Verify tab switched by checking for Ntrl-specific content
      let ntrlVisible = await verifyNtrlTabActive(page);

      if (!ntrlVisible) {
        console.log('   ⚠️ Ntrl tab did not switch - retrying with aria-label');
        // Retry with aria-label selector
        const retryClicked = await page.evaluate(() => {
          const btn = document.querySelector('[aria-label="Ntrl"]');
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        });
        if (retryClicked) {
          await wait(1500);
          ntrlVisible = await verifyNtrlTabActive(page);
        }
      }

      if (!ntrlVisible) {
        console.log('   ⚠️ Still not on Ntrl tab - trying clickByText fallback');
        await clickByText(page, 'Ntrl');
        await wait(1500);
        ntrlVisible = await verifyNtrlTabActive(page);
      }

      if (ntrlVisible) {
        console.log('   ✓ Ntrl tab content verified');
        await captureScreen(page, 'detail-ntrl', 'Article Ntrl view');

        // 12. NTRL Index Detail Sheet
        console.log('\n📱 NTRL Index Detail Sheet');
        if (await clickByText(page, 'Tap for details', false)) {
          await wait(1500);
          await captureScreen(page, 'ntrl-index-sheet', 'NTRL Index Sheet');

          // Close the sheet
          await clickByText(page, 'Close');
        } else {
          console.log('   ⚠️  Could not find "Tap for details" gauge');
        }
      } else {
        console.log('   ❌ Could not switch to Ntrl tab after multiple attempts');
        // Capture current state for debugging
        await page.screenshot({ path: path.join(OUTPUT_DIR, 'detail-ntrl-failed.png') });
        console.log('   📸 Saved detail-ntrl-failed.png for debugging');
      }
    } else {
      console.log('⚠️  No articles found to navigate to detail');
    }

    // Count screenshots
    const screenshots = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png') && !f.includes('error'));
    console.log(`\n✅ Capture complete! ${screenshots.length} screenshots saved.\n`);

    // List all captured screenshots
    console.log('📷 Captured screenshots:');
    screenshots.sort().forEach(f => console.log(`   ${f}`));

  } catch (error) {
    console.error('❌ Error during capture:', error.message);
    // Take error screenshot
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'error-state.png') });
    console.log('   Saved error-state.png');
  } finally {
    await browser.close();
  }
}

// Run the capture
captureAllScreens().catch(console.error);
