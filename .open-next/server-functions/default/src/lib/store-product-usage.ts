/**
 * استنتاج «کاربری» لپ‌تاپ از عنوان/مشخصات، تا کارت‌های «اداری/دانشجویی/مهندسی/گیمینگ»
 * صفحهٔ اصلی واقعاً محصول مرتبط پیدا کنند. مقدار دستی ادمین هرگز بازنویسی نمی‌شود.
 */

export type StoreProductUsage = "اداری" | "دانشجویی" | "گیمینگ" | "مهندسی" | "عمومی";

const USAGE_RULES: Array<[RegExp, StoreProductUsage]> = [
  // گیمینگ
  [/legion|nitro|rog\b|tuf\b|predator|omen|katana|pulse\b|gaming|گیمینگ|بازی|لژیون|\brtx\b|\bgtx\b/i, "گیمینگ"],
  // مهندسی و طراحی
  [/zbook|precision|precision|macbook\s*pro|workstation|مهندسی|طراحی|رندر|cad\b|quadro|\brtx\s*a\d|زد\s*بوک|مک\s*بوک\s*پرو|تینک\s*پد\s*پی/i, "مهندسی"],
  // اداری و شرکتی
  [/thinkpad|latitude|probook|elitebook|vostro|thinkbook|اداری|شرکتی|آفیس|حسابداری|تینک\s*پد|تینک\s*بوک|لتیتود|پرو\s*بوک|الیت\s*بوک|وسترو/i, "اداری"],
  // دانشجویی و اقتصادی
  [/ideapad|aspire|inspiron|vivobook|pavilion|chromebook|دانشجویی|دانشجو|اقتصادی|سبک|ایده\s*پد|آسپایر|اینسپایرون|ویوو\s*بوک|پاولیون/i, "دانشجویی"],
];

/** کاربری استنتاجی از عنوان و مشخصات محصول. */
export function deriveProductUsage(
  title: string,
  specs?: Record<string, string> | null,
): StoreProductUsage {
  // نیم‌فاصله و ی/ک عربی حذف می‌شود تا «تینک‌پد» با الگوی «تینک پد» بخواند.
  const haystack = `${title || ""} ${Object.values(specs || {}).join(" ")}`
    .replace(/[\u200c\u200e\u200f]/g, " ")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک");
  for (const [pattern, usage] of USAGE_RULES) {
    if (pattern.test(haystack)) return usage;
  }
  return "عمومی";
}

function currentUsage(product: { title?: string; specs?: Record<string, string> | null }) {
  const value = String((product.specs || {})["کاربری"] || "").trim();
  return value;
}

/**
 * اگر «کاربری» خالی یا نامشخص باشد، مقدار استنتاجی را می‌نویسد.
 * خروجی true یعنی محصول تغییر کرد.
 */
export function ensureProductUsage<
  T extends { title?: string; specs?: Record<string, string> | null },
>(product: T): boolean {
  const existing = currentUsage(product);
  if (existing && existing !== "نامشخص" && existing !== "عمومی") return false;
  const derived = deriveProductUsage(product.title || "", product.specs);
  if (!product.specs) product.specs = {} as Record<string, string>;
  const specs = product.specs as Record<string, string>;
  if (specs["کاربری"] === derived) return false;
  specs["کاربری"] = derived;
  return true;
}
