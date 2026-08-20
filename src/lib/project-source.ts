/**
 * خواندن فایل‌های خود پروژه برای صفحه «کد منبع» و دانلود زیپ.
 *
 * - در محیط Node: خواندن مستقیم از دیسک (رفتار قبلی حفظ شده است).
 * - در Cloudflare Workers: خواندن از اسنپ‌شاتی که هنگام build توسط
 *   scripts/generate-source-snapshot.mjs تولید می‌شود.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { isCloudflareRuntime } from "@/lib/kv-storage";

type SourceSnapshot = {
  generatedAt?: string;
  fileCount?: number;
  files: Record<string, string>;
};

let snapshotCache: SourceSnapshot | null = null;

async function loadSnapshot(): Promise<SourceSnapshot> {
  if (snapshotCache) return snapshotCache;
  const mod = (await import("@/generated/source-snapshot.json")) as {
    default: SourceSnapshot;
  };
  snapshotCache = mod.default;
  return snapshotCache;
}

/** مسیرهای نسبی موجود در اسنپ‌شات با پیشوند داده‌شده (مثلاً "src/") */
export async function listSnapshotPaths(prefixes: string[]): Promise<string[]> {
  const snapshot = await loadSnapshot();
  return Object.keys(snapshot.files)
    .filter((filePath) => prefixes.some((prefix) => filePath.startsWith(prefix)))
    .sort();
}

export async function readProjectFile(relativePath: string): Promise<string | null> {
  try {
    if (await isCloudflareRuntime()) {
      const snapshot = await loadSnapshot();
      return snapshot.files[relativePath] ?? null;
    }
    const absolute = path.join(process.cwd(), relativePath);
    return await fs.readFile(absolute, "utf8");
  } catch {
    return null;
  }
}

export async function projectFileExists(relativePath: string): Promise<boolean> {
  try {
    if (await isCloudflareRuntime()) {
      const snapshot = await loadSnapshot();
      return Boolean(snapshot.files[relativePath]);
    }
    return Boolean((await fs.stat(path.join(process.cwd(), relativePath))).isFile?.());
  } catch {
    return false;
  }
}
