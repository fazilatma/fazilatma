#!/usr/bin/env node
/**
 * scripts/planner.js — نقطهٔ ورود CLI «برنامه‌ریز هفتگی» (جانشین planner.py)
 *   node scripts/planner.js                # tasks.json → output/weekly-plan.html + pdf
 *   node scripts/planner.js --no-pdf       # فقط HTML
 *   node scripts/planner.js --week 2026-09-12
 *   node scripts/planner.js -i my.json -o myout
 */
import { runCli } from '../src/cli.js';

runCli().catch((err) => {
  console.error('❌', err && err.stack ? err.stack : err);
  process.exitCode = 1;
});
