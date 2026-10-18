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

  // لوازم نصب و خنک‌کاری ممکن است در عنوان «CPU» یا «پردازنده» داشته باشند؛
  // باید پیش از خود پردازنده تشخیص داده شوند.
  if (/خمیر (?:سیلیکون|حرارتی)|thermal paste|براکت|پایه فن|فن پردازنده|cpu fan|cpu cooler|خنک.?کننده|cooling system|\bcooler\b/.test(text)) return "cooler";
  if (/رم دسکتاپ|رم کامپیوتر|حافظه رم|ماژول رم|desktop ram|ram module|memory module|\bddr[345]\b/.test(text)) return "ram";
  if (/کارت گرافیک|graphics card|video card|\bgpu\b|geforce|\brtx\s*\d|\bgtx\s*\d|radeon\s+rx/.test(text)) return "gpu";
  if (/مادربرد|motherboard|mainboard/.test(text)) return "motherboard";
  if (/\bssd\b|\bnvme\b|solid state|اس اس دی|هارد(?:دیسک)?|hard disk|hard drive|\bhdd\b/.test(text)) return "ssd";
  if (/منبع تغذیه|پاور کامپیوتر|power supply|\bpsu\b/.test(text)) return "power";
  if (/کیس کامپیوتر|computer case|computer chassis|\bchassis\b/.test(text)) return "case";
  if (
    /پردازنده مرکزی|پردازنده (?:اینتل|amd|ای ام دی)|central processor|computer processor|\bprocessor\b|\bcpu\b|core\s*(?:i[3579]|ultra)|ryzen\s*[3579]|pentium|celeron|athlon|threadripper|\bxeon\b|\be[357]-?\d{3,4}\b/.test(text)
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
