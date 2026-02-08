/**
 * Visual Regression Testing — Compare Screenshots Against Baselines
 *
 * Compares current screenshots in "Screen Shots/" against approved baselines in e2e/baselines/.
 * Outputs diff images for screens exceeding the pixel difference threshold.
 *
 * Usage:
 *   node e2e/compare-screenshots.cjs
 *   node e2e/compare-screenshots.cjs --threshold 0.5   # custom threshold (default 0.1%)
 *
 * Prerequisites:
 *   - Baselines must exist in e2e/baselines/ (run e2e/update-baselines.cjs to create them)
 *   - Current screenshots in /Users/ericrbrown/Documents/NTRL/Screen Shots/
 */

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatchModule = require('pixelmatch');
const pixelmatch = pixelmatchModule.default || pixelmatchModule;

const BASELINES_DIR = path.join(__dirname, 'baselines');
const CURRENT_DIR = '/Users/ericrbrown/Documents/NTRL/Screen Shots';
const DIFF_DIR = path.join(__dirname, 'diffs');

// Parse threshold from CLI args (default 0.1%)
const thresholdArg = process.argv.find((a, i) => process.argv[i - 1] === '--threshold');
const THRESHOLD_PERCENT = thresholdArg ? parseFloat(thresholdArg) : 0.1;

function readPNG(filePath) {
  const data = fs.readFileSync(filePath);
  return PNG.sync.read(data);
}

function comparePair(baselinePath, currentPath, name) {
  const baseline = readPNG(baselinePath);
  const current = readPNG(currentPath);

  // Handle size mismatch
  if (baseline.width !== current.width || baseline.height !== current.height) {
    return {
      name,
      status: 'SIZE_MISMATCH',
      baseline: `${baseline.width}x${baseline.height}`,
      current: `${current.width}x${current.height}`,
      diffPercent: 100,
    };
  }

  const { width, height } = baseline;
  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    baseline.data,
    current.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 } // per-pixel color threshold (not the overall threshold)
  );

  const totalPixels = width * height;
  const diffPercent = (numDiffPixels / totalPixels) * 100;

  return {
    name,
    status: diffPercent > THRESHOLD_PERCENT ? 'CHANGED' : 'OK',
    diffPercent: Math.round(diffPercent * 1000) / 1000,
    diffPixels: numDiffPixels,
    totalPixels,
    diffImage: diff,
  };
}

function run() {
  console.log('\nVisual Regression Test');
  console.log(`Threshold: ${THRESHOLD_PERCENT}%\n`);

  // Check directories exist
  if (!fs.existsSync(BASELINES_DIR)) {
    console.log('No baselines directory found. Run e2e/update-baselines.cjs first to create baselines.');
    process.exit(1);
  }

  if (!fs.existsSync(CURRENT_DIR)) {
    console.log(`No screenshots found at ${CURRENT_DIR}. Run the capture script first.`);
    process.exit(1);
  }

  // Ensure diff output directory exists
  if (!fs.existsSync(DIFF_DIR)) {
    fs.mkdirSync(DIFF_DIR, { recursive: true });
  }

  // Get baseline files
  const baselineFiles = fs.readdirSync(BASELINES_DIR).filter(f => f.endsWith('.png'));

  if (baselineFiles.length === 0) {
    console.log('No baseline screenshots found. Run e2e/update-baselines.cjs first.');
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;
  let missing = 0;
  const results = [];

  for (const file of baselineFiles) {
    const baselinePath = path.join(BASELINES_DIR, file);
    const currentPath = path.join(CURRENT_DIR, file);

    if (!fs.existsSync(currentPath)) {
      results.push({ name: file, status: 'MISSING' });
      missing++;
      continue;
    }

    const result = comparePair(baselinePath, currentPath, file);
    results.push(result);

    if (result.status === 'OK') {
      passed++;
    } else {
      failed++;
      // Write diff image
      if (result.diffImage) {
        const diffPath = path.join(DIFF_DIR, `diff-${file}`);
        fs.writeFileSync(diffPath, PNG.sync.write(result.diffImage));
      }
    }
  }

  // Print results
  console.log('Results:');
  console.log('-'.repeat(60));

  for (const r of results) {
    if (r.status === 'OK') {
      console.log(`  OK      ${r.name} (${r.diffPercent}%)`);
    } else if (r.status === 'MISSING') {
      console.log(`  MISSING ${r.name} (no current screenshot)`);
    } else if (r.status === 'SIZE_MISMATCH') {
      console.log(`  CHANGED ${r.name} (size: ${r.baseline} -> ${r.current})`);
    } else {
      console.log(`  CHANGED ${r.name} (${r.diffPercent}% different, ${r.diffPixels} pixels)`);
    }
  }

  console.log('-'.repeat(60));
  console.log(`\nTotal: ${baselineFiles.length} | Passed: ${passed} | Changed: ${failed} | Missing: ${missing}`);

  if (failed > 0) {
    console.log(`\nDiff images saved to: ${DIFF_DIR}/`);
    console.log('Review the diffs, then run e2e/update-baselines.cjs to approve changes.');
    process.exit(1);
  } else if (missing > 0) {
    console.log('\nSome current screenshots are missing. Run the capture script first.');
    process.exit(1);
  } else {
    console.log('\nAll screenshots match baselines.');
  }
}

run();
