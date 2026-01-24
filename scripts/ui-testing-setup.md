# NTRL App UI Testing Setup

This document describes the UI testing infrastructure for Claude to autonomously verify the app UI.

## Option 1: Playwright + Expo Web (READY)

Playwright is fully installed and configured. Claude can run UI tests against the Expo web version.

### Commands

```bash
# Run all e2e tests
npm run e2e

# Run Claude-specific screenshot capture
npm run e2e:screenshot

# Run tests with visible browser
npm run e2e:headed

# Run tests with debug mode
npm run e2e:debug

# View test report
npm run e2e:report
```

### How Claude Uses This

1. Run `npm run e2e:screenshot` to capture UI screenshots
2. Screenshots are saved to `e2e/snapshots/`
3. Claude reads the screenshots using the Read tool
4. Analyze and provide feedback on UI state

### Screenshot Locations
- `e2e/snapshots/claude-feed-viewport.png` - Feed screen viewport
- `e2e/snapshots/claude-feed-fullpage.png` - Feed screen full page
- `e2e/snapshots/claude-feed-dark.png` - Dark mode
- `e2e/snapshots/claude-feed-mobile.png` - Mobile viewport

---

## Option 2: iOS Simulator + xcrun simctl (MANUAL SETUP REQUIRED)

### Prerequisites (User must complete)

1. **Download iOS Runtime** (one-time, ~6GB):
   - Open Xcode
   - Go to: Xcode > Settings > Platforms
   - Click "+" and select iOS
   - Download iOS 18.x runtime

2. **Create a Simulator** (after runtime is installed):
   ```bash
   # List available runtimes
   xcrun simctl list runtimes

   # Create a simulator (example)
   xcrun simctl create "NTRL Test iPhone" "iPhone 16 Pro" iOS18.2
   ```

### Commands (after setup)

```bash
# Boot simulator
xcrun simctl boot "NTRL Test iPhone"

# Take screenshot
xcrun simctl io booted screenshot /tmp/simulator-screenshot.png

# Open Expo app in simulator
# First run: npx expo start --ios
# Or open URL: xcrun simctl openurl booted exp://localhost:8081

# Shutdown simulator
xcrun simctl shutdown "NTRL Test iPhone"
```

### How Claude Uses This

1. Boot the simulator
2. Launch the Expo app
3. Capture screenshots with `xcrun simctl io booted screenshot`
4. Read screenshots with Read tool

---

## Option 3: Maestro (MANUAL SETUP REQUIRED)

### Prerequisites (User must complete)

1. **Install Java** (requires sudo):
   ```bash
   brew install --cask temurin@21
   ```

2. **Add Maestro to PATH**:
   ```bash
   echo 'export PATH="$PATH:$HOME/.maestro/bin"' >> ~/.zshrc
   source ~/.zshrc
   ```

3. **iOS Simulator** must be set up (Option 2)

### After Setup

Maestro flows are in `.maestro/` directory.

```bash
# Run a flow
maestro test .maestro/feed-screen.yaml

# Record interactions
maestro studio
```

---

## Quick Reference for Claude

### Fastest Way to Check UI (Playwright)
```bash
cd /Users/ericrbrown/Documents/NTRL/code/ntrl-app
npm run e2e:screenshot
# Then read: e2e/snapshots/claude-feed-*.png
```

### iOS Simulator Screenshot (after setup)
```bash
xcrun simctl io booted screenshot /tmp/ntrl-ui.png
# Then read: /tmp/ntrl-ui.png
```

---

## Status

| Option | Status | Action Required |
|--------|--------|-----------------|
| Playwright | **READY** | None - fully working |
| iOS Simulator | Pending | Download iOS runtime in Xcode |
| Maestro | Pending | Install Java with `brew install --cask temurin@21` |

---

## Manual Setup Steps (User Required)

### For iOS Simulator (Option 2):

1. Open Xcode
2. Go to: **Xcode > Settings > Platforms**
3. Click the **"+"** button at bottom left
4. Select **"iOS"** and download (this is ~6GB)
5. Wait for download to complete
6. Then run: `xcrun simctl list runtimes` to verify

### For Maestro (Option 3):

1. Install Java (requires password):
   ```bash
   brew install --cask temurin@21
   ```

2. Verify Maestro works:
   ```bash
   ~/.maestro/bin/maestro --version
   ```

After these steps, notify Claude and we can complete the setup.
