/**
 * تولید فایل src/generated/source-snapshot.json
 *
 * صفحه «کد منبع» و دانلود زیپ پروژه در محیط Node فایل‌ها را مستقیماً از
 * دیسک می‌خوانند؛ اما در Cloudflare Workers فایل‌سیستم پروژه وجود ندارد.
 * این اسکریپت هنگام build یک اسنپ‌شات از فایل‌های متنی پروژه می‌سازد تا
 * همان صفحات در Workers هم از روی این اسنپ‌شات کار کنند.
 *
 * خروجی این اسکریپت git نمی‌شود (در .gitignore است) و هر بار قبل از
 * build دوباره تولید می‌شود.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputFile = path.join(root, "src", "generated", "source-snapshot.json");

const foldersToInclude = ["src", "data", "scripts"];
const filesToInclude = [
  "package.json",
  "tsconfig.json",
  "drizzle.config.json",
  "next.config.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "README.md",
  "README_DEPLOY.md",
  "README_SELLER_RATING.md",
  "README_CLOUDFLARE.md",
  "liara.json",
  "wrangler.jsonc",
  "open-next.config.ts",
  ".env.example",
];

const skipFolders = new Set([
  "node_modules",
  ".next",
  ".open-next",
  ".wrangler",
  ".git",
  "generated",
]);

const textExtensions = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts",
  ".json", ".jsonc", ".css", ".md", ".mdx", ".txt",
  ".html", ".php", ".yml", ".yaml", ".toml",
]);

const maxFileBytes = 512 * 1024;

const files = {};

function addFile(relativePath) {
  const absolute = path.join(root, relativePath);
  if (!existsSync(absolute)) return;
  try {
    if (statSync(absolute).size > maxFileBytes) {
      files[relativePath] = `/* محتوای این فایل بزرگ است و در اسنپ‌شات قرار نگرفته */`;
      return;
    }
    files[relativePath] = readFileSync(absolute, "utf8");
  } catch {
    // فایل قابل خواندن نیست؛ نادیده گرفته می‌شود.
  }
}

function walkFolder(folderName) {
  const queue = [folderName];
  while (queue.length > 0) {
    const current = queue.shift();
    const absolute = path.join(root, current);
    if (!existsSync(absolute)) continue;
    let entries;
    try {
      entries = readdirSync(absolute, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const relative = `${current}/${entry.name}`;
      if (entry.isDirectory()) {
        if (skipFolders.has(entry.name)) continue;
        queue.push(relative);
      } else {
        if (entry.name === "source-snapshot.json") continue;
        if (entry.name.startsWith(".env") && entry.name !== ".env.example") continue;
        if (!textExtensions.has(path.extname(entry.name))) continue;
        addFile(relative);
      }
    }
  }
}

for (const folder of foldersToInclude) {
  walkFolder(folder);
}
for (const file of filesToInclude) {
  addFile(file);
}

mkdirSync(path.dirname(outputFile), { recursive: true });
const snapshot = {
  generatedAt: new Date().toISOString(),
  fileCount: Object.keys(files).length,
  files,
};
const payload = JSON.stringify(snapshot);
writeFileSync(outputFile, payload);
console.log(
  `source-snapshot.json generated: ${snapshot.fileCount} files, ${(payload.length / 1024).toFixed(0)} KB`
);
