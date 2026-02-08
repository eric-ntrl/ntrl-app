/**
 * Update Visual Regression Baselines
 *
 * Copies current screenshots from "Screen Shots/" to e2e/baselines/.
 * Run this after reviewing screenshots and confirming they look correct.
 *
 * Usage:
 *   node e2e/update-baselines.cjs           # copy all screenshots
 *   node e2e/update-baselines.cjs today     # copy only files matching "today"
 */

const fs = require('fs');
const path = require('path');

const BASELINES_DIR = path.join(__dirname, 'baselines');
const CURRENT_DIR = '/Users/ericrbrown/Documents/NTRL/Screen Shots';

function run() {
  const filter = process.argv[2]; // optional filter

  if (!fs.existsSync(CURRENT_DIR)) {
    console.log(`No screenshots found at ${CURRENT_DIR}. Run the capture script first.`);
    process.exit(1);
  }

  // Ensure baselines directory exists
  if (!fs.existsSync(BASELINES_DIR)) {
    fs.mkdirSync(BASELINES_DIR, { recursive: true });
  }

  // Get current screenshots
  let files = fs.readdirSync(CURRENT_DIR).filter(f => f.endsWith('.png'));

  if (filter) {
    files = files.filter(f => f.toLowerCase().includes(filter.toLowerCase()));
    if (files.length === 0) {
      console.log(`No screenshots matching "${filter}" found.`);
      process.exit(1);
    }
  }

  console.log(`\nUpdating baselines from: ${CURRENT_DIR}`);
  console.log(`Baselines directory: ${BASELINES_DIR}\n`);

  let copied = 0;
  for (const file of files) {
    const src = path.join(CURRENT_DIR, file);
    const dest = path.join(BASELINES_DIR, file);
    fs.copyFileSync(src, dest);
    console.log(`  Copied: ${file}`);
    copied++;
  }

  console.log(`\nDone. ${copied} baseline(s) updated.`);
  console.log('These baselines will be used for future comparisons.');
  console.log('Remember to commit the baselines directory to git.');
}

run();
