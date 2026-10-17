import type { ImportedStoreProductDraft } from "@/lib/store-product-import";

export type DigikalaClientScanProgress = {
  completedPages: number;
  totalPages: number;
  products: number;
  message: string;
};

export type DigikalaClientScanResult = {
  products: ImportedStoreProductDraft[];
  scannedPages: number;
  totalPages: number;
  categoryCount: number;
  warnings: string[];
};

type DigikalaSource = {
  slug: string;
  category: string;
  part: string;
};

const componentSources: DigikalaSource[] = [
  { slug: "processor", category: "قطعات کامپیوتر", part: "cpu" },
  { slug: "graphics-card", category: "قطعات کامپیوتر", part: "gpu" },
  { slug: "ram", category: "قطعات کامپیوتر", part: "ram" },
  { slug: "motherboard", category: "قطعات کامپیوتر", part: "motherboard" },
  { slug: "internal-ssd", category: "حافظه و ذخیره‌سازی", part: "ssd" },
  { slug: "internal-hard-drive", category: "حافظه و ذخیره‌سازی", part: "ssd" },
  { slug: "psu", category: "قطعات کامپیوتر", part: "power" },
  { slug: "computer-chassis", category: "قطعات کامپیوتر", part: "case" },
];

const brandRules: Array<[RegExp, string]> = [
  [/asus|ایسوس/i, "Asus"],
  [/gigabyte|گیگابایت|aorus/i, "Gigabyte"],
  [/\bmsi\b|ام اس آی|ام‌اس‌آی/i, "MSI"],
  [/corsair|کورسیر/i, "Corsair"],
  [/kingston|کینگستون/i, "Kingston"],
  [/crucial|کروشیال/i, "Crucial"],
  [/samsung|سامسونگ/i, "Samsung"],
  [/western\s*digital|وسترن\s*دیجیتال|\bwd\b/i, "Western Digital"],
  [/seagate|سیگیت/i, "Seagate"],
  [/cooler\s*master|کولر\s*مستر/i, "Cooler Master"],
  [/green|گرین/i, "Green"],
  [/xfx|ایکس اف ایکس/i, "XFX"],
  [/zotac|زوتک/i, "Zotac"],
  [/palit|پالیت/i, "Palit"],
  [/intel|اینتل/i, "Intel"],
  [/\bamd\b|ای ام دی|ای‌ام‌دی/i, "AMD"],
  [/nvidia|انویدیا/i, "NVIDIA"],
];

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested = firstText(...value);
      if (nested) return nested;
      continue;
    }
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      const nested = firstText(record.title_fa, record.title_en, record.name, record.title, record.url, record.uri);
      if (nested) return nested;
      continue;
    }
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (text) return text;
  }
  return "";
}

function brandFromProduct(record: Record<string, any>, title: string) {
  const explicit = firstText(record.brand?.title_en, record.brand?.title_fa, record.data_layer?.brand);
  const haystack = `${title} ${explicit}`;
  for (const [pattern, brand] of brandRules) {
    if (pattern.test(haystack)) return brand;
  }
  return explicit || "Digikala";
}

function imageFromProduct(record: Record<string, any>, productUrl: string) {
  const raw = firstText(
    record.images?.main?.url,
    record.images?.main?.webp_url,
    record.images?.list?.[0]?.url,
    record.images?.list?.[0]?.webp_url,
  );
  try {
    const imageUrl = new URL(raw, productUrl);
    return imageUrl.protocol === "https:" || imageUrl.protocol === "http:" ? imageUrl.toString() : undefined;
  } catch {
    return undefined;
  }
}

function productUrlFromRecord(record: Record<string, any>) {
  const id = String(record.id || record.product_id || "").replace(/\D/g, "");
  const uri = firstText(record.url?.uri, record.url, record.web_url);
  try {
    const url = new URL(uri || (id ? `/product/dkp-${id}/` : "/"), "https://www.digikala.com/");
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return id ? `https://www.digikala.com/product/dkp-${id}/` : "";
  }
}

function draftFromRecord(record: Record<string, any>, source: DigikalaSource): ImportedStoreProductDraft | null {
  const title = firstText(record.title_fa, record.title_en, record.title, record.name).slice(0, 180);
  const sellingPriceRial = Number(
    record.default_variant?.price?.selling_price ||
      record.price?.selling_price ||
      record.selling_price ||
      0,
  );
  const price = Math.round(sellingPriceRial / 10);
  if (!title || !Number.isFinite(price) || price < 100_000 || price > 1_500_000_000) return null;

  const rrpRial = Number(
    record.default_variant?.price?.rrp_price ||
      record.price?.rrp_price ||
      0,
  );
  const rrp = Math.round(rrpRial / 10);
  const productUrl = productUrlFromRecord(record);
  if (!productUrl) return null;
  const status = firstText(record.default_variant?.status, record.status).toLowerCase();
  const categoryText = firstText(
    record.data_layer?.item_category5,
    record.data_layer?.item_category4,
    record.data_layer?.category,
    source.category,
  );
  return {
    title,
    brand: brandFromProduct(record, title),
    category: categoryText || source.category,
    summary: title,
    description: title,
    price,
    originalPrice: rrp > price && rrp <= price * 1.8 ? rrp : undefined,
    imageUrl: imageFromProduct(record, productUrl),
    stock: status.includes("out") || status.includes("inactive") ? 0 : 5,
    specs: {
      "گروه کالا": source.category,
    },
    externalSourceUrl: productUrl,
    sourceHost: "digikala.com",
    currency: "IRT",
  };
}

function apiUrl(slug: string, page: number) {
  return `https://api.digikala.com/v1/categories/${encodeURIComponent(slug)}/search/?page=${page}`;
}

async function fetchCategoryPage(source: DigikalaSource, page: number) {
  const url = apiUrl(source.slug, page);
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        headers: { accept: "application/json, text/plain, */*" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json() as Record<string, any>;
      const records = Array.isArray(payload?.data?.products)
        ? payload.data.products as Array<Record<string, any>>
        : [];
      const totalPages = Math.max(1, Math.floor(Number(payload?.data?.pager?.total_pages || 1)));
      return { source, page, records, totalPages };
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => window.setTimeout(resolve, 700));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("خواندن API دیجی‌کالا ناموفق بود.");
}

export async function scanDigikalaComponentsInBrowser(
  options: {
    maxProducts?: number;
    maxPagesPerCategory?: number;
    concurrency?: number;
    sourceUrl?: string;
    partFilters?: string[];
    onProgress?: (progress: DigikalaClientScanProgress) => void;
  } = {},
): Promise<DigikalaClientScanResult> {
  const maxProducts = Math.max(100, Math.min(6_000, Number(options.maxProducts || 5_000)));
  const maxPagesPerCategory = Math.max(1, Math.min(60, Number(options.maxPagesPerCategory || 45)));
  const concurrency = Math.max(1, Math.min(4, Number(options.concurrency || 3)));
  const requestedParts = new Set((options.partFilters || []).map((item) => String(item).trim().toLowerCase()).filter(Boolean));
  let selectedSources = requestedParts.size
    ? componentSources.filter((source) => requestedParts.has(source.part))
    : componentSources;
  try {
    const sourceSlug = new URL(String(options.sourceUrl || "")).pathname
      .match(/\/search\/category-([a-z0-9-]+)\/?/i)?.[1];
    if (sourceSlug && sourceSlug !== "computer-devices") {
      const exactSource = componentSources.find((source) => source.slug === sourceSlug);
      if (exactSource) {
        selectedSources = requestedParts.size === 0 || requestedParts.has(exactSource.part)
          ? [exactSource]
          : [];
      }
    }
  } catch {
    // A broad/default Digikala link uses the selected part filters above.
  }
  if (!selectedSources.length) {
    throw new Error("برای این لینک حداقل یک گروه قابل دریافت از دیجی‌کالا انتخاب کنید.");
  }

  const warnings: string[] = [];
  const byUrl = new Map<string, ImportedStoreProductDraft>();
  let completedPages = 0;

  const firstPageResults = await Promise.allSettled(
    selectedSources.map((source) => fetchCategoryPage(source, 1)),
  );
  const pageTasks: Array<{ source: DigikalaSource; page: number }> = [];
  let totalPages = 0;
  for (let index = 0; index < firstPageResults.length; index += 1) {
    const result = firstPageResults[index];
    const source = selectedSources[index];
    completedPages += 1;
    if (result.status === "rejected") {
      warnings.push(`${source.slug}: ${result.reason instanceof Error ? result.reason.message : "خطا"}`);
      continue;
    }
    const categoryPages = Math.min(maxPagesPerCategory, result.value.totalPages);
    totalPages += categoryPages;
    for (const record of result.value.records) {
      const draft = draftFromRecord(record, source);
      if (draft) byUrl.set(draft.externalSourceUrl, draft);
    }
    for (let page = 2; page <= categoryPages; page += 1) pageTasks.push({ source, page });
  }
  totalPages = Math.max(completedPages, totalPages);
  options.onProgress?.({
    completedPages,
    totalPages,
    products: byUrl.size,
    message: "صفحه‌های نخست زیرگروه‌های دیجی‌کالا خوانده شد.",
  });

  for (let cursor = 0; cursor < pageTasks.length && byUrl.size < maxProducts; cursor += concurrency) {
    const batch = pageTasks.slice(cursor, cursor + concurrency);
    const results = await Promise.allSettled(
      batch.map((task) => fetchCategoryPage(task.source, task.page)),
    );
    for (let index = 0; index < results.length; index += 1) {
      const result = results[index];
      const task = batch[index];
      completedPages += 1;
      if (result.status === "rejected") {
        warnings.push(`${task.source.slug}، صفحه ${task.page}: ${result.reason instanceof Error ? result.reason.message : "خطا"}`);
        continue;
      }
      for (const record of result.value.records) {
        const draft = draftFromRecord(record, task.source);
        if (draft) byUrl.set(draft.externalSourceUrl, draft);
        if (byUrl.size >= maxProducts) break;
      }
    }
    options.onProgress?.({
      completedPages,
      totalPages,
      products: byUrl.size,
      message: `${completedPages.toLocaleString("fa-IR")} صفحه از دیجی‌کالا خوانده شد؛ ${byUrl.size.toLocaleString("fa-IR")} محصول قیمت‌دار پیدا شده است.`,
    });
  }

  return {
    products: [...byUrl.values()].slice(0, maxProducts),
    scannedPages: completedPages,
    totalPages,
    categoryCount: selectedSources.length,
    warnings: warnings.slice(0, 30),
  };
}
