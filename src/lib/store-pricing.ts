const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

export type StorePricingFields = {
  price: number;
  originalPrice?: number;
  marketPrice?: number;
  priceMultiplier?: number;
  badges?: string[];
  marketReferenceNote?: string;
};

type StorePriceSanityProduct = StorePricingFields & {
  title?: string;
  category?: string;
  summary?: string;
  specs?: Record<string, string>;
};

function toEnglishDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

export function normalizeStorePriceMultiplier(value: unknown, fallback = 1) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    const safeFallback = Number(fallback);
    return Number.isFinite(safeFallback) && safeFallback > 0
      ? Math.max(0.1, Math.min(10, safeFallback))
      : 1;
  }
  return Math.max(0.1, Math.min(10, number));
}

export function roundStorePrice(value: number) {
  return Math.max(0, Math.round(Number(value || 0) / 10_000) * 10_000);
}

function multiplierFromText(value: unknown) {
  const text = toEnglishDigits(String(value || "")).replace(/[٫،]/g, ".");
  const match = text.match(/ضریب\s*(?:قیمت\s*)?([0-9]+(?:\.[0-9]+)?)/i);
  return match ? normalizeStorePriceMultiplier(match[1], 0) : 0;
}

/**
 * محصولات قدیمی ضریب را فقط داخل یادداشت یا نشان داخلی نگه می‌داشتند.
 * این تابع همان مقدار را بازیابی می‌کند تا قیمت زنده دوباره بدون ضریب نمایش داده نشود.
 */
export function storedProductPriceMultiplier(
  product: Partial<StorePricingFields>,
  fallback = 1,
) {
  const explicit = Number(product.priceMultiplier);
  if (Number.isFinite(explicit) && explicit > 0) {
    return normalizeStorePriceMultiplier(explicit, fallback);
  }
  const noteMultiplier = multiplierFromText(product.marketReferenceNote);
  if (noteMultiplier > 0) return noteMultiplier;
  for (const badge of Array.isArray(product.badges) ? product.badges : []) {
    const badgeMultiplier = multiplierFromText(badge);
    if (badgeMultiplier > 0) return badgeMultiplier;
  }
  return normalizeStorePriceMultiplier(fallback);
}

export function storedProductMarketPrice(product: Partial<StorePricingFields>) {
  const explicit = Number(product.marketPrice);
  if (Number.isFinite(explicit) && explicit >= 100_000 && explicit <= 10_000_000_000) {
    return Math.round(explicit);
  }
  const salePrice = Number(product.price || 0);
  if (!Number.isFinite(salePrice) || salePrice <= 0) return 0;
  const multiplier = storedProductPriceMultiplier(product, 1);
  return Math.max(0, Math.round(salePrice / multiplier));
}

export function isSuspiciousStoreProductPrice(product: StorePriceSanityProduct) {
  const price = Number(product.price || 0);
  if (!Number.isFinite(price) || price < 100_000 || price > 10_000_000_000) return true;
  const text = `${product.title || ""} ${product.category || ""} ${product.summary || ""} ${Object.values(product.specs || {}).join(" ")}`
    .toLowerCase()
    .replace(/[‌\s]+/g, " ");

  // این کف‌ها فقط برای تشخیص خطاهای واضحِ واحد/ستون قیمت هستند؛ نمونه‌های واقعیِ خراب
  // ۱۲۰، ۳۱۰ و ۵۱۰ هزار تومانی CPU نباید در کارت یا سبد خرید نمایش داده شوند.
  const modernCpu = /(?:core\s*)?i[3579]\s*-?\s*\d{4,5}[a-z]{0,3}|ryzen\s*[3579]\s*-?\s*\d{4}[a-z0-9]*/i.test(text);
  if (modernCpu && price < 3_000_000) return true;
  if (/core\s*i3|\bi3\s*-?\s*\d{4,5}/.test(text) && price > 80_000_000) return true;
  if (/core\s*i5|\bi5\s*-?\s*\d{4,5}/.test(text) && price > 120_000_000) return true;
  if (/core\s*i7|\bi7\s*-?\s*\d{4,5}/.test(text) && price > 150_000_000) return true;
  if (/core\s*i9|\bi9\s*-?\s*\d{4,5}/.test(text) && price > 250_000_000) return true;
  const gpuAccessory = /پایه\s*(?:نگهدارنده)?\s*کارت\s*گرافیک|نگهدارنده\s*کارت\s*گرافیک|gpu\s*(?:support|holder|brace)/i.test(text);
  if (!gpuAccessory && /کارت گرافیک|\bgpu\b|\brtx\s*\d|\bgtx\s*\d|radeon\s+rx/.test(text) && price < 3_000_000) return true;
  if (/مادربرد|motherboard/.test(text) && price < 1_500_000) return true;
  if (/\bssd\b|\bnvme\b|اس اس دی|هارد|hard disk|\bhdd\b/.test(text) && price < 1_000_000) return true;
  if (/منبع تغذیه|پاور|power supply|\bpsu\b/.test(text) && price < 1_000_000) return true;
  if (/رم کامپیوتر|حافظه رم|ram module|memory module/.test(text) && price < 400_000) return true;
  return false;
}

/** قیمت نهایی فروشگاه = کمترین قیمت معتبر بازار × ضریب سراسری. */
export function applyStorePriceFormula<T extends StorePricingFields>(
  product: T,
  marketPrice: number,
  multiplier: number,
): T {
  const normalizedMarketPrice = Math.max(0, Math.round(Number(marketPrice || 0)));
  const normalizedMultiplier = normalizeStorePriceMultiplier(multiplier);
  const previousMultiplier = storedProductPriceMultiplier(product, 1);
  const rawOriginalPrice = Number(product.originalPrice || 0) > Number(product.price || 0)
    ? Number(product.originalPrice) / previousMultiplier
    : 0;
  const price = roundStorePrice(normalizedMarketPrice * normalizedMultiplier);
  const adjustedOriginalPrice = rawOriginalPrice > normalizedMarketPrice
    ? roundStorePrice(rawOriginalPrice * normalizedMultiplier)
    : 0;
  return {
    ...product,
    marketPrice: normalizedMarketPrice,
    priceMultiplier: normalizedMultiplier,
    price,
    originalPrice:
      adjustedOriginalPrice > price && adjustedOriginalPrice <= price * 1.8
        ? adjustedOriginalPrice
        : undefined,
  };
}
