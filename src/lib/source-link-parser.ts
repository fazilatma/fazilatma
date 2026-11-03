import { normalizeStorePriceMultiplier } from "@/lib/store-pricing";

function decodeAmpEntities(value: string) {
  let output = value;
  for (let pass = 0; pass < 5; pass += 1) {
    const decoded = output.replace(/&amp;/gi, "&");
    if (decoded === output) break;
    output = decoded;
  }
  return output;
}

export function parseSourceLinks(value: unknown, maximum = 8) {
  const joined = Array.isArray(value) ? value.map(String).join("\n") : String(value || "");
  const normalized = decodeAmpEntities(joined)
    .replace(/\s*&\s*(?=https?:\/\/)/gi, "\n")
    .replace(/[|،]+(?=\s*https?:\/\/)/gi, "\n");
  const matches = normalized.match(/https?:\/\/[^\s<>"'()[\]]+/gi) || [];
  const links: string[] = [];
  for (const match of matches) {
    const cleaned = match.replace(/[.,;،]+$/g, "");
    try {
      const url = new URL(cleaned);
      if ((url.protocol === "http:" || url.protocol === "https:") && !links.includes(url.toString())) {
        links.push(url.toString());
      }
    } catch {
      // Ignore malformed fragments around links copied from rich text or Markdown.
    }
    if (links.length >= maximum) break;
  }
  return links;
}

export const MAX_PRODUCTS_PER_SOURCE_LINK = 10000;

export function normalizeSourceProductLimit(value: unknown, fallback = MAX_PRODUCTS_PER_SOURCE_LINK) {
  const number = Math.round(Number(value || fallback));
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return Math.max(1, Math.min(MAX_PRODUCTS_PER_SOURCE_LINK, number));
}

export type ComputerPartSourceLinkEntry = {
  url: string;
  parts: string[];
  /** ضریب اختصاصی همین لینک؛ قیمت‌های دانلودشده یا به‌روزرسانی‌شده از این لینک در آن ضرب می‌شوند. */
  priceMultiplier: number;
  /** سقف تعداد محصول برای دانلود یا به‌روزرسانی همین لینک. */
  maxProducts: number;
};

/**
 * خواندن باکس‌های لینک مرجع از مقدار ذخیره‌شده در تنظیمات
 * (`storeComputerPartsSourceUrl`) که به‌صورت JSON شامل url/parts/priceMultiplier/maxProducts
 * ذخیره می‌شود. مقادیر قدیمیِ متنی یا بدون سقف، با ضریب ۱ و سقف ۱۰٬۰۰۰ خوانده می‌شوند.
 */
export function parseComputerPartSourceEntries(
  value: unknown,
  maximum = 8,
): ComputerPartSourceLinkEntry[] {
  const raw = String(value || "").trim();
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item && typeof item === "object" && !Array.isArray(item))
          .map((item) => {
            const record = item as Record<string, unknown>;
            return {
              url: String(record.url || "").trim(),
              parts: Array.isArray(record.parts)
                ? [...new Set(record.parts.map((part) => String(part).trim().toLowerCase()).filter(Boolean))]
                : [],
              priceMultiplier: normalizeStorePriceMultiplier(record.priceMultiplier, 1),
              maxProducts: normalizeSourceProductLimit(record.maxProducts),
            };
          })
          .filter((entry) => entry.url)
          .slice(0, maximum);
      }
    } catch {
      // مقادیر قدیمیِ غیر JSON در ادامه به‌صورت لینک ساده خوانده می‌شوند.
    }
  }
  return parseSourceLinks(raw, maximum).map((url) => ({
    url,
    parts: [],
    priceMultiplier: 1,
    maxProducts: MAX_PRODUCTS_PER_SOURCE_LINK,
  }));
}

/** یکسان‌سازی لینک منبع برای تطبیق دقیق باکس‌ها با محصولات درون‌ریزی‌شده. */
export function normalizeImportSourceUrl(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    url.hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
    url.hash = "";
    url.pathname = url.pathname.replace(/\/+$/g, "") || "/";
    url.searchParams.sort();
    return url.toString().replace(/\/+$/g, "");
  } catch {
    return "";
  }
}

export const STORE_SOURCE_PRODUCT_PARTS = [
  "cpu", "gpu", "ram", "ssd", "motherboard", "power", "case", "cooler", "laptop", "desktop",
] as const;

export type StoreProductImportSource = {
  /** لینک فهرست/دسته‌ای که مدیر در باکس لینک ثبت کرده است. */
  sourceUrl: string;
  /** صفحهٔ اختصاصی همین محصول در همان منبع، برای خواندن دوبارهٔ قیمت. */
  productUrl: string;
};

type ProductSourceFields = {
  importSourceUrl?: string;
  importSourceUrls?: string[];
  importSources?: StoreProductImportSource[];
  externalSourceUrl?: string;
};

export function normalizeProductImportSources(product: ProductSourceFields): StoreProductImportSource[] {
  const bySource = new Map<string, string>();
  for (const item of Array.isArray(product.importSources) ? product.importSources : []) {
    if (!item || typeof item !== "object") continue;
    const sourceUrl = normalizeImportSourceUrl(item.sourceUrl);
    const productUrl = String(item.productUrl || "").trim();
    if (sourceUrl && productUrl && !bySource.has(sourceUrl)) bySource.set(sourceUrl, productUrl);
  }
  const legacyUrls = [
    ...(Array.isArray(product.importSourceUrls) ? product.importSourceUrls : []),
    product.importSourceUrl || "",
  ];
  for (const value of legacyUrls) {
    const sourceUrl = normalizeImportSourceUrl(value);
    if (sourceUrl && !bySource.has(sourceUrl)) {
      bySource.set(sourceUrl, String(product.externalSourceUrl || "").trim());
    }
  }
  return [...bySource.entries()].slice(0, 8).map(([sourceUrl, productUrl]) => ({ sourceUrl, productUrl }));
}

export function productImportSourceUrls(product: ProductSourceFields) {
  return normalizeProductImportSources(product).map((item) => item.sourceUrl);
}

export function productUrlForImportSource(product: ProductSourceFields, sourceUrl: unknown) {
  const target = normalizeImportSourceUrl(sourceUrl);
  return normalizeProductImportSources(product).find((item) => item.sourceUrl === target)?.productUrl || "";
}

/** برچسب منبع را هنگام ادغام کالاهای تکراری از دست ندهیم. */
export function mergeProductImportSources(
  existing: ProductSourceFields,
  imported: ProductSourceFields,
): Pick<JsonStoreProductSourceFields, "importSourceUrl" | "importSourceUrls" | "importSources"> {
  const importSources = normalizeProductImportSources({
    importSources: [
      ...normalizeProductImportSources(imported),
      ...normalizeProductImportSources(existing),
    ],
  });
  const importSourceUrl = importSources[0]?.sourceUrl || "";
  return {
    importSourceUrl,
    importSourceUrls: importSources.map((item) => item.sourceUrl),
    importSources,
  };
}

type JsonStoreProductSourceFields = ProductSourceFields;

export function tagProductImportSource<T extends ProductSourceFields>(
  product: T,
  sourceUrl: unknown,
): T {
  const normalizedSource = normalizeImportSourceUrl(sourceUrl);
  if (!normalizedSource) return product;
  return {
    ...product,
    ...mergeProductImportSources(product, {
      importSourceUrl: normalizedSource,
      externalSourceUrl: product.externalSourceUrl,
    }),
  };
}

/**
 * فقط محصولاتی به یک باکس لینک تعلق دارند که هنگام درون‌ریزی از همان لینک
 * ثبت شده باشند. برای محصولات خیلی قدیمی که هنوز برچسب لینک ندارند، فقط
 * تطبیق دقیق صفحهٔ محصول با خود لینک پذیرفته می‌شود (نه کل هاست).
 */
export function productBelongsToImportSource(product: ProductSourceFields, sourceUrl: unknown) {
  const target = normalizeImportSourceUrl(sourceUrl);
  if (!target) return false;
  if (productImportSourceUrls(product).includes(target)) return true;
  return normalizeImportSourceUrl(product.externalSourceUrl) === target;
}

function normalizedHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

/** ضریب اختصاصی لینکِ درون‌ریزی محصول؛ اولویت با تطبیق دقیق لینک باکس است. */
export function computerPartSourceMultiplierForProduct(
  product: ProductSourceFields,
  entries: ComputerPartSourceLinkEntry[],
) {
  const sourceUrls = productImportSourceUrls(product);
  for (const entry of entries) {
    const entryUrl = normalizeImportSourceUrl(entry.url);
    if (entryUrl && sourceUrls.includes(entryUrl)) {
      return normalizeStorePriceMultiplier(entry.priceMultiplier, 1);
    }
  }
  // محصولِ متعلق به یک لینک دیگر نباید ضریب این لینک را بگیرد.
  if (sourceUrls.length) return 1;
  const externalUrl = normalizeImportSourceUrl(product.externalSourceUrl);
  return externalUrl && entries.some((entry) => normalizeImportSourceUrl(entry.url) === externalUrl)
    ? normalizeStorePriceMultiplier(entries.find((entry) => normalizeImportSourceUrl(entry.url) === externalUrl)?.priceMultiplier, 1)
    : 1;
}

/**
 * ضریب اختصاصی لینکی که محصول از آن آمده است؛ تطبیق بر اساس هاستِ لینک صفحهٔ
 * محصول (`externalSourceUrl`) با هاست باکس لینک انجام می‌شود. اگر چند باکس روی
 * یک هاست باشند، اولین ضریبِ متفاوت از ۱ اعمال می‌شود.
 */
export function computerPartSourceMultiplierForProductUrl(
  entries: ComputerPartSourceLinkEntry[],
  productUrl: string,
) {
  const host = normalizedHost(productUrl || "");
  if (!host) return 1;
  let fallback = 1;
  for (const entry of entries) {
    const entryHost = normalizedHost(entry.url);
    if (!entryHost) continue;
    if (entryHost === host || entryHost.endsWith(`.${host}`) || host.endsWith(`.${entryHost}`)) {
      const multiplier = normalizeStorePriceMultiplier(entry.priceMultiplier, 1);
      if (multiplier !== 1) return multiplier;
      fallback = multiplier;
    }
  }
  return fallback;
}
