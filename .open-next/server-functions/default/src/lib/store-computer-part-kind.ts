export type StoreComputerPartKind =
  | "cpu"
  | "gpu"
  | "ram"
  | "ssd"
  | "motherboard"
  | "power"
  | "case"
  | "cooler";

export type StoreComputerPartTextProduct = {
  title?: string;
  category?: string;
  summary?: string;
  description?: string;
  specs?: Record<string, unknown>;
};

export function storeComputerPartKindFromText(value: string): StoreComputerPartKind | "" {
  const text = String(value || "")
    .toLowerCase()
    .replace(/[‌\s]+/g, " ")
    .trim();
  if (!text) return "";

  // لوازم نصب ممکن است در عنوان «CPU» یا «پردازنده» داشته باشند؛
  // باید پیش از خود پردازنده تشخیص داده شوند.
  if (/خمیر (?:سیلیکون|حرارتی)|thermal paste|براکت|پایه فن|فن پردازنده|cpu fan|cpu cooler/.test(text)) return "cooler";
  if (/رم دسکتاپ|رم کامپیوتر|حافظه رم|ماژول رم|desktop ram|ram module|memory module|\bddr[345]\b/.test(text)) return "ram";
  if (/کارت گرافیک|graphics card|video card|\bgpu\b|geforce|\brtx\s*\d|\bgtx\s*\d|radeon\s+rx/.test(text)) return "gpu";
  if (/مادربرد|motherboard|mainboard/.test(text)) return "motherboard";
  if (/\bssd\b|\bnvme\b|solid state|اس اس دی|هارد(?:دیسک)?|hard disk|hard drive|\bhdd\b/.test(text)) return "ssd";
  if (/منبع تغذیه|پاور کامپیوتر|power supply|\bpsu\b/.test(text)) return "power";
  if (/کیس کامپیوتر|computer case|computer chassis|\bchassis\b/.test(text)) return "case";
  if (/خنک.?کننده|cooling system|\bcooler\b/.test(text)) return "cooler";
  if (
    /پردازنده مرکزی|پردازنده (?:اینتل|amd|ای ام دی)|central processor|computer processor|\bprocessor\b|^cpu\s+(?:intel|amd|core|ryzen)|core\s*(?:i[3579]|ultra)|ryzen\s*[3579]|pentium|celeron|athlon|threadripper|\bxeon\b|\be[357]-?\d{3,4}\b/.test(text)
  ) return "cpu";
  return "";
}

export function storeComputerPartKind(
  product: StoreComputerPartTextProduct,
): StoreComputerPartKind | "" {
  const titleAndCategory = `${product.title || ""} ${product.category || ""}`;
  const direct = storeComputerPartKindFromText(titleAndCategory);
  if (direct) return direct;
  return storeComputerPartKindFromText(
    `${product.summary || ""} ${product.description || ""} ${Object.values(product.specs || {}).join(" ")}`,
  );
}

/**
 * ویترین اصلی فقط پردازنده‌های مصرفیِ نسل‌های جاری را نشان می‌دهد. مدل‌های بسیار قدیمی
 * Pentium/Celeron/Core نسل‌های اولیه و پردازنده‌های سروری مستعمل قیمت‌های چندصد هزار
 * تومانی واقعی دارند، اما کنار CPUهای امروزی گمراه‌کننده‌اند و قابل عرضهٔ عادی نیستند.
 */
export function isStorefrontEligibleComputerPart(product: StoreComputerPartTextProduct) {
  const text = `${product.title || ""} ${product.category || ""} ${product.summary || ""} ${Object.values(product.specs || {}).join(" ")}`
    .toLowerCase()
    .replace(/[‌\s]+/g, " ");
  if (/لپ\s?تاپ|لپ‌تاپ|laptop|notebook|macbook|thinkpad|ideapad|latitude|elitebook/.test(text)) return true;
  if (storeComputerPartKind(product) !== "cpu") return true;

  if (/core\s*ultra|ryzen\s*[3579]|threadripper/.test(text)) return true;
  const intelCoreModel = text.match(/(?:core\s*)?i[3579]\s*-?\s*(\d{4,5})[a-z]{0,3}\b/)?.[1];
  if (intelCoreModel) return Number(intelCoreModel) >= 10_000;

  // مدل‌های بدون شناسهٔ نسل قابل اتکا، Pentium/Celeron/Xeon/Opteron و سری‌های E/FX
  // در بخش محصولات قدیمی نگه داشته می‌شوند و وارد ویترین خرید روز نمی‌شوند.
  return false;
}
