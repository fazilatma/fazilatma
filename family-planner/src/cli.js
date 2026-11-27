#!/usr/bin/env node
/**
 * planner/cli.js — رابط خط فرمان (پورت Node از main() در planner.py)
 *
 *   node scripts/planner.js                     # tasks.json → output/weekly-plan.html + pdf
 *   node scripts/planner.js --no-pdf            # فقط HTML
 *   node scripts/planner.js --week 2026-09-12   # هفتهٔ مشخص
 *   node scripts/planner.js -i my.json -o myout --quiet
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadConfig, scheduleWeek, saturdayOfWeek, parseDkey, enNum, fmtTime, faNum,
  jalaliStr, gregorianStr, DAY_NAMES, setFs,
} from './core.js';
import { buildHtml } from './html.js';
import { writePdf } from './pdf.js';

const HERE = dirname(fileURLToPath(import.meta.url));
export const BASE = resolve(HERE, '..');

/** آرگومان‌های خط فرمان را ساده بخوان (بدون وابستگی بیرونی) */
export function parseArgs(argv = process.argv.slice(2)) {
  const out = { input: join(BASE, 'tasks.json'), out: join(BASE, 'output'), week: null, pdf: true, quiet: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '-i' || a === '--input') out.input = next();
    else if (a === '-o' || a === '--out') out.out = next();
    else if (a === '--week') out.week = next();
    else if (a === '--no-pdf') out.pdf = false;
    else if (a === '--quiet' || a === '-q') out.quiet = true;
    else if (a === '-h' || a === '--help') out.help = true;
    else if (a.startsWith('--week=')) out.week = a.slice(7);
    else if (a.startsWith('--input=')) out.input = a.slice(8);
    else if (a.startsWith('--out=')) out.out = a.slice(6);
  }
  return out;
}

const HELP = `برنامه‌ریز هفتگی — زمان‌بندی خودکار کارها با خروجی HTML/PDF
کاربرد: node scripts/planner.js [گزینه‌ها]
  -i, --input <مسیر>   مسیر فایل کارها (پیش‌فرض: tasks.json)
  -o, --out <پوشه>     پوشهٔ خروجی (پیش‌فرض: output)
      --week <تاریخ>   شنبهٔ شروع هفته، قالب 2026-09-12
      --no-pdf         فقط HTML بساز
  -q, --quiet          گزارش ترمینال کوتاه
  -h, --help           همین راهنما`;

/** گزارش ترمینال (پورت terminal_report) */
export function terminalReport(days, weekStart, warnings, htmlPath, pdfOk, pdfPath) {
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
  const total = [...days.values()].reduce((a, d) => a + d.blocks.length, 0);
  const line = '─'.repeat(56);
  const logs = [];
  logs.push('');
  logs.push(line);
  logs.push('✅  برنامهٔ هفتگی آماده شد');
  logs.push(line);
  logs.push(`   هفته:  ${jalaliStr(weekStart)}  تا  ${jalaliStr(weekEnd)}`);
  logs.push(`          ${gregorianStr(weekStart)}  تا  ${gregorianStr(weekEnd)}`);
  logs.push(`   کارهای زمان‌بندی‌شده: ${faNum(total)}`);
  for (const k of [...days.keys()].sort((a, b) => a - b)) {
    logs.push(`     • ${DAY_NAMES[k]}: ${faNum(days.get(k).blocks.length)} مورد`);
  }
  if (warnings.length) {
    logs.push(`   ⚠️  ${faNum(warnings.length)} نکته (در خروجی هم آمده):`);
    for (const w of warnings) logs.push(`     - ${w}`);
  }
  logs.push(`   🌐 HTML: ${htmlPath}`);
  if (pdfOk) logs.push(`   📄 PDF : ${pdfPath}`);
  logs.push(line);
  logs.push('   برای پرینت: فایل HTML را در مرورگر باز کن و Ctrl+P بزن.');
  logs.push('');
  const text = logs.join('\n');
  // eslint-disable-next-line no-console
  console.log(text);
  return text;
}

/**
 * اجرای کامل ساخت برنامه
 * @returns {Promise<{htmlPath:string, pdfPath:string, pdfOk:boolean, days:Map, warnings:string[], weekStart:Date}>}
 */
export async function runCli(options = {}) {
  const args = { ...parseArgs([]), ...options };
  if (args.help) {
    console.log(HELP);
    return null;
  }
  setFs({ readFileSync, writeFileSync });

  if (!existsSync(args.input)) {
    console.error(`❌ فایل ${args.input} پیدا نشد. با گزینهٔ --input مسیرش را بده.`);
    process.exitCode = 1;
    return null;
  }

  const cfg = loadConfig(args.input, options.today || new Date());
  const { active, tasks, warnings } = cfg;
  let weekStart = cfg.weekStart;

  if (args.week) {
    const d = parseDkey(enNum(String(args.week)).trim());
    if (d) weekStart = saturdayOfWeek(d);
    else warnings.push(`--week نامعتبر: ${args.week} (قالب درست: 2026-09-12)`);
  }
  if (!tasks.length) warnings.push('هیچ کاری در فایل ورودی نیست.');

  const days = scheduleWeek(weekStart, active, cfg.dayStart, cfg.dayEnd, tasks, warnings);

  const outDir = args.out;
  mkdirSync(outDir, { recursive: true });
  const htmlPath = join(outDir, 'weekly-plan.html');
  writeFileSync(htmlPath, buildHtml(days, weekStart, cfg.dayStart, cfg.dayEnd, warnings, {
    today: options.today || new Date(),
  }), 'utf8');

  let pdfOk = false;
  const pdfPath = join(outDir, 'weekly-plan.pdf');
  if (args.pdf !== false) {
    pdfOk = await writePdf(days, weekStart, cfg.dayStart, cfg.dayEnd, warnings, pdfPath);
    if (!pdfOk) console.log('⚠️  ساخت PDF ممکن نشد؛ HTML ساخته شد.');
  }

  if (!args.quiet) terminalReport(days, weekStart, warnings, htmlPath, pdfOk, pdfPath);

  return { htmlPath, pdfPath, pdfOk, days, warnings, weekStart };
}

export { buildHtml, writePdf, fmtTime };
