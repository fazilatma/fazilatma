#!/usr/bin/env node
/**
 * scripts/apply-patch.js — اجرای پچ‌های نسخه‌ها (جانشین patch_v12.py … patch_v15.py)
 *
 *   node scripts/apply-patch.js list                 # پچ‌های موجود
 *   node scripts/apply-patch.js v14 --dir ./src-v14  # اجرا روی پوشهٔ همان نسخه
 *   node scripts/apply-patch.js v14 --dry-run        # فقط بررسی، بدون نوشتن
 *
 * هر پچ، «تاریخچهٔ تغییرات» است: همان جایگزینی‌هایی که در نسخهٔ پایتونی انجام شد.
 * اگر لنگر پیدا نشود پچ با خطا متوقف می‌شود و هیچ فایلی نیمه‌کاره ذخیره نمی‌شود.
 */
import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditPatch, runPatch } from '../src/patch-engine.js';

const HERE = dirname(fileURLToPath(import.meta.url));
export const BASE = resolve(HERE, '..');
const PATCH_DIR = join(BASE, 'src', 'patches');

const argv = process.argv.slice(2);
const cmd = argv[0] || 'list';
const flag = (n) => {
  const i = argv.indexOf(n);
  return i >= 0 ? argv[i + 1] : null;
};

const patchFiles = () => readdirSync(PATCH_DIR).filter((f) => /^(rev-)?v\d+\.js$/.test(f))
  .sort((a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')));

async function main() {
  const names = patchFiles();
  if (cmd === 'list' || cmd === '--help' || cmd === '-h') {
    console.log('پچ‌های موجود (تاریخچهٔ نسخه‌ها):');
    for (const n of names) {
      // eslint-disable-next-line no-await-in-loop
      const mod = await import(join(PATCH_DIR, n));
      if (String(mod.version).startsWith('rev')) continue;
      console.log(`  v${String(mod.version).padEnd(3)} ${mod.title || ''}`);
    }
    console.log('\nاجرا: node scripts/apply-patch.js <نسخه> [--dir <پوشه>] [--dry-run]');
    console.log('      node scripts/apply-patch.js status [--dir <پوشه>]   # وضعیت لنگرها');
    return;
  }
  const rev = cmd.startsWith('rev-');
  if (cmd === 'status' || cmd === 'audit') {
    const baseDir = resolve(flag('--dir') || BASE);
    const label = { applied: 'اعمال‌شده', pending: 'قابل اجرا', superseded: 'بازنویسی‌شده' };
    for (const n of names) {
      // eslint-disable-next-line no-await-in-loop
      const mod = await import(join(PATCH_DIR, n));
      const rows = auditPatch(mod.default || mod, { baseDir });
      const tally = rows.reduce((acc, r) => { acc[r.state] = (acc[r.state] || 0) + 1; return acc; }, {});
      console.log(`v${mod.version}: ` + ['applied', 'pending', 'superseded']
        .filter((k) => tally[k]).map((k) => `${label[k]} ${tally[k]}`).join(' • '));
    }
    console.log(`\nپوشه: ${baseDir}`);
    return;
  }
  const file = rev ? `rev-v${cmd.replace(/\D/g, '')}.js` : `v${cmd.replace(/^v/, '')}.js`;
  if (!names.includes(file)) {
    console.error(`❌ پچ «${cmd}» پیدا نشد. با «node scripts/apply-patch.js list» ببین.`);
    process.exitCode = 1;
    return;
  }
  const mod = await import(join(PATCH_DIR, file));
  const baseDir = resolve(flag('--dir') || BASE);
  const dryRun = argv.includes('--dry-run');
  console.log(`پچ v${mod.version} — ${mod.title || ''}${dryRun ? '  (dry-run)' : ''}`);
  try {
    runPatch(mod.default || mod, { baseDir, dryRun });
    console.log(`✔ پچ v${mod.version} با موفقیت اجرا شد.`);
  } catch (err) {
    console.error(`✖ ${err.message}`);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();

export { runPatch };
