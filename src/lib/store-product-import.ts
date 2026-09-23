import type { JsonStoreProduct } from "@/lib/json-store";

export type ImportedStoreProductDraft = {
  title: string;
  brand: string;
  category: string;
  summary: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  specs: Record<string, string>;
  externalSourceUrl: string;
  sourceHost: string;
  currency?: string;
};

export type StoreProductImportScanResult = {
  sourceUrl: string;
  sourceHost: string;
  scannedUrls: string[];
  products: ImportedStoreProductDraft[];
  warnings: string[];
};

const laptopKeywords = [
  "laptop",
  "notebook",
  "macbook",
  "thinkpad",
  "latitude",
  "elitebook",
  "tuf",
  "legion",
  "لپ",
  "لپتاپ",
  "لپ‌تاپ",
  "نوت",
  "مک",
];

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function toEnglishDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

function numberFromText(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const normalized = toEnglishDigits(String(value || ""));
  const cleaned = normalized.replace(/[^0-9.]/g, "");
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function normalizePriceToToman(rawPrice: unknown, currency?: string) {
  let price = numberFromText(rawPrice);
  const normalizedCurrency = String(currency || "").toUpperCase();
  if (!price) return 0;
  if (normalizedCurrency === "IRR" || normalizedCurrency === "RIAL") {
    price = price / 10;
  }
  // بعضی فروشگاه‌ها حتی بدون currency قیمت را در ریال داخل JSON-LD می‌گذارند.
  if (!normalizedCurrency && price >= 250_000_000) price = price / 10;
  return Math.round(price);
}

function absoluteUrl(value: string, baseUrl: string) {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(36);
}

export function storeProductSlugFromTitle(title: string, sourceHost = "") {
  const ascii = String(title)
    .toLowerCase()
    .replace(/apple/g, " apple ")
    .replace(/lenovo/g, " lenovo ")
    .replace(/asus/g, " asus ")
    .replace(/dell/g, " dell ")
    .replace(/hp/g, " hp ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  const prefix = ascii || String(sourceHost || "imported").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return `${prefix}-${stableHash(`${sourceHost}:${title}`).slice(0, 6)}`.replace(/-+/g, "-");
}

function brandFromTitle(title: string, fallback = "OptiBid") {
  const lower = title.toLowerCase();
  if (/lenovo|لنوو/.test(lower)) return "Lenovo";
  if (/dell|دل/.test(lower)) return "Dell";
  if (/asus|ایسوس/.test(lower)) return "Asus";
  if (/apple|macbook|مک|اپل/.test(lower)) return "Apple";
  if (/hp|اچ ?پی|اچ‌پی/.test(lower)) return "HP";
  if (/acer|ایسر/.test(lower)) return "Acer";
  if (/msi/.test(lower)) return "MSI";
  return fallback;
}

function categoryFromTitle(title: string) {
  const lower = title.toLowerCase();
  if (/gaming|گیم|rtx|legion|tuf/.test(lower)) return "لپ‌تاپ گیمینگ";
  if (/student|دانشجو|سبک|air|elitebook/.test(lower)) return "لپ‌تاپ دانشجویی و سبک";
  if (/workstation|مهندس|طراحی|render|رندر/.test(lower)) return "لپ‌تاپ مهندسی";
  if (/business|اداری|thinkpad|latitude/.test(lower)) return "لپ‌تاپ اداری و شرکتی";
  return "لپ‌تاپ";
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function flattenJsonLd(value: unknown): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  if (typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const graph = record["@graph"];
  return [record, ...flattenJsonLd(graph)];
}

function parseJsonLoose(raw: string) {
  const cleaned = decodeHtml(raw).trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    try {
      return JSON.parse(cleaned.replace(/,\s*([}\]])/g, "$1"));
    } catch {
      return null;
    }
  }
}

function extractJsonLdObjects(html: string) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  return scripts.flatMap((match) => flattenJsonLd(parseJsonLoose(match[1] || "")));
}

function itemTypeIncludes(item: Record<string, unknown>, typeName: string) {
  const type = item["@type"];
  return asArray(type as string | string[]).some((value) =>
    String(value || "").toLowerCase().includes(typeName.toLowerCase()),
  );
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested: string = firstText(...value);
      if (nested) return nested;
      continue;
    }
    if (typeof value === "object" && value) {
      const record = value as Record<string, unknown>;
      const nested: string = firstText(record.name, record.title, record.value, record.url);
      if (nested) return nested;
      continue;
    }
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (text) return text;
  }
  return "";
}

function offerFromJsonLd(product: Record<string, unknown>) {
  const offers = flattenJsonLd(product.offers);
  const offer = offers.find((item) => item && typeof item === "object") || ({} as Record<string, unknown>);
  const aggregateOffer = offers.find((item) => itemTypeIncludes(item, "AggregateOffer"));
  const currency = firstText(offer.priceCurrency, aggregateOffer?.priceCurrency);
  const rawPrice = firstText(
    offer.price,
    (offer.priceSpecification as Record<string, unknown> | undefined)?.price,
    aggregateOffer?.lowPrice,
    aggregateOffer?.price,
    aggregateOffer?.highPrice,
  );
  const price = normalizePriceToToman(rawPrice, currency);
  const originalPrice = normalizePriceToToman(
    firstText(
      (offer.priceSpecification as Record<string, unknown> | undefined)?.priceType ? undefined : undefined,
      aggregateOffer?.highPrice,
    ),
    currency,
  );
  const availability = firstText(offer.availability, aggregateOffer?.availability).toLowerCase();
  return {
    price,
    originalPrice: originalPrice > price ? originalPrice : undefined,
    currency,
    stock: availability.includes("outofstock") || availability.includes("soldout") ? 0 : 5,
  };
}

function specsFromJsonLd(product: Record<string, unknown>) {
  const specs: Record<string, string> = {};
  const props = asArray(product.additionalProperty as unknown[] | undefined).flatMap((item) =>
    Array.isArray(item) ? item : [item],
  );
  for (const item of props) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const name = firstText(record.name);
    const value = firstText(record.value);
    if (name && value) specs[name.slice(0, 40)] = value.slice(0, 90);
  }
  return specs;
}

function draftFromJsonLdProduct(product: Record<string, unknown>, pageUrl: string, sourceHost: string): ImportedStoreProductDraft | null {
  const title = firstText(product.name, product.title).slice(0, 180);
  if (!title || !laptopKeywords.some((keyword) => title.toLowerCase().includes(keyword.toLowerCase()))) return null;
  const offer = offerFromJsonLd(product);
  if (!offer.price) return null;
  const brand = firstText((product.brand as Record<string, unknown> | undefined)?.name, product.brand) || brandFromTitle(title);
  const description = firstText(product.description, title).slice(0, 900);
  return {
    title,
    brand: brandFromTitle(title, brand),
    category: firstText(product.category) || categoryFromTitle(title),
    summary: description.slice(0, 180) || title,
    description: description || title,
    price: offer.price,
    originalPrice: offer.originalPrice,
    stock: offer.stock,
    specs: specsFromJsonLd(product),
    externalSourceUrl: pageUrl,
    sourceHost,
    currency: offer.currency,
  };
}

function extractProductDraftsFromJsonLd(html: string, pageUrl: string, sourceHost: string) {
  const objects = extractJsonLdObjects(html);
  const productObjects = objects.filter((item) => itemTypeIncludes(item, "Product"));
  const drafts: ImportedStoreProductDraft[] = [];
  for (const product of productObjects) {
    const variants = asArray((product as Record<string, unknown>).hasVariant as unknown[] | undefined);
    const variantProducts = variants.filter((item) => item && typeof item === "object") as Record<string, unknown>[];
    for (const candidate of variantProducts.length ? variantProducts : [product]) {
      const draft = draftFromJsonLdProduct(candidate, pageUrl, sourceHost);
      if (draft) drafts.push(draft);
    }
  }
  return drafts;
}

function titleFromHtml(html: string) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return stripTags(h1 || title || "").slice(0, 180);
}

function extractHtmlPriceCandidates(html: string) {
  const text = stripTags(html);
  const candidates: number[] = [];
  const patterns = [
    /([\d۰-۹٠-٩][\d۰-۹٠-٩,.٬\s]{4,})\s*(?:تومان|تومن|IRT)/gi,
    /(?:تومان|تومن|IRT)\s*([\d۰-۹٠-٩][\d۰-۹٠-٩,.٬\s]{4,})/gi,
    /"price"\s*:\s*"?([\d۰-۹٠-٩][\d۰-۹٠-٩,.٬\s]{4,})"?/gi,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const value = normalizePriceToToman(match[1]);
      if (value >= 1_000_000 && value <= 500_000_000) candidates.push(value);
    }
  }
  return [...new Set(candidates)].sort((a, b) => a - b);
}

function fallbackDraftFromHtml(html: string, pageUrl: string, sourceHost: string) {
  const title = titleFromHtml(html);
  if (!title || !laptopKeywords.some((keyword) => title.toLowerCase().includes(keyword.toLowerCase()))) return null;
  const candidates = extractHtmlPriceCandidates(html);
  if (!candidates.length) return null;
  const price = candidates[0];
  const originalPrice = [...candidates].reverse().find((item) => item > price * 1.03);
  return {
    title,
    brand: brandFromTitle(title),
    category: categoryFromTitle(title),
    summary: title,
    description: title,
    price,
    originalPrice,
    stock: /ناموجود|out of stock|sold out/i.test(stripTags(html)) ? 0 : 5,
    specs: {},
    externalSourceUrl: pageUrl,
    sourceHost,
  } satisfies ImportedStoreProductDraft;
}

function extractProductLinks(html: string, baseUrl: string, limit: number) {
  const base = new URL(baseUrl);
  const links = new Set<string>();
  for (const match of html.matchAll(/<a\s+[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = absoluteUrl(match[1] || "", baseUrl);
    if (!href) continue;
    const url = new URL(href);
    if (url.hostname !== base.hostname) continue;
    const label = stripTags(match[2] || "");
    const haystack = `${decodeURIComponent(url.pathname)} ${label}`.toLowerCase();
    if (/cart|checkout|login|account|category|tag|blog|comment|compare/i.test(haystack)) continue;
    if (!laptopKeywords.some((keyword) => haystack.includes(keyword.toLowerCase())) && !/product|\/p\/|\/shop\//i.test(url.pathname)) continue;
    links.add(url.toString());
    if (links.size >= limit) break;
  }
  return [...links];
}

function uniqueDrafts(drafts: ImportedStoreProductDraft[]) {
  const seen = new Set<string>();
  const output: ImportedStoreProductDraft[] = [];
  for (const draft of drafts) {
    const key = `${draft.externalSourceUrl}|${draft.title}|${draft.price}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(draft);
  }
  return output;
}

async function fetchHtml(url: string) {
  const timeoutSignal =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? (AbortSignal as unknown as { timeout: (milliseconds: number) => AbortSignal }).timeout(15000)
      : undefined;
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; OptiBidProductImporter/1.0; +https://optibid.ir)",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: timeoutSignal,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

export async function scanStoreProductsFromUrl(inputUrl: string, options: { limit?: number } = {}): Promise<StoreProductImportScanResult> {
  const sourceUrl = new URL(inputUrl).toString();
  if (!/^https?:$/i.test(new URL(sourceUrl).protocol)) throw new Error("فقط لینک‌های http/https قابل درون‌ریزی هستند.");
  const sourceHost = new URL(sourceUrl).hostname.replace(/^www\./, "");
  const limit = Math.max(1, Math.min(50, Number(options.limit || 20)));
  const warnings: string[] = [];
  const scannedUrls: string[] = [];
  const allDrafts: ImportedStoreProductDraft[] = [];

  const firstHtml = await fetchHtml(sourceUrl);
  scannedUrls.push(sourceUrl);
  allDrafts.push(...extractProductDraftsFromJsonLd(firstHtml, sourceUrl, sourceHost));
  const fallback = fallbackDraftFromHtml(firstHtml, sourceUrl, sourceHost);
  if (fallback) allDrafts.push(fallback);

  const links = extractProductLinks(firstHtml, sourceUrl, limit);
  for (const link of links.slice(0, limit)) {
    if (scannedUrls.includes(link)) continue;
    try {
      const html = await fetchHtml(link);
      scannedUrls.push(link);
      const drafts = extractProductDraftsFromJsonLd(html, link, sourceHost);
      if (drafts.length) allDrafts.push(...drafts);
      else {
        const fallbackDraft = fallbackDraftFromHtml(html, link, sourceHost);
        if (fallbackDraft) allDrafts.push(fallbackDraft);
      }
    } catch (error) {
      warnings.push(`خواندن ${link} ناموفق بود: ${error instanceof Error ? error.message : "خطای نامشخص"}`);
    }
  }

  const products = uniqueDrafts(allDrafts).slice(0, limit);
  if (!products.length) {
    warnings.push("محصول قابل تشخیص پیدا نشد. اگر سایت با JavaScript قیمت‌ها را بعداً بارگذاری کند، ممکن است نیاز به لینک مستقیم صفحه محصول داشته باشد.");
  }

  return { sourceUrl, sourceHost, scannedUrls, products, warnings };
}

export function importedDraftToStoreProduct(draft: ImportedStoreProductDraft): JsonStoreProduct {
  const now = new Date().toISOString();
  const specs = { ...draft.specs };
  if (!specs.منبع) specs.منبع = draft.sourceHost;
  return {
    id: `imp-${stableHash(`${draft.sourceHost}:${draft.title}:${draft.externalSourceUrl}`)}`,
    slug: storeProductSlugFromTitle(draft.title, draft.sourceHost),
    title: draft.title,
    brand: draft.brand || brandFromTitle(draft.title),
    category: draft.category || categoryFromTitle(draft.title),
    summary: draft.summary || draft.title,
    description: draft.description || draft.summary || draft.title,
    price: draft.price,
    originalPrice: draft.originalPrice && draft.originalPrice > draft.price ? draft.originalPrice : undefined,
    stock: Math.max(0, Math.floor(Number(draft.stock || 0))),
    rating: 4.5,
    reviewsCount: 0,
    badges: ["وارداتی", "قیمت به‌روز"],
    specs,
    warranty: "۷ روز مهلت تست",
    shippingNote: "قیمت و مشخصات واردشده از لینک فروشگاه",
    priceUpdatedAt: now.slice(0, 10),
    marketReferenceNote: `درون‌ریزی از ${draft.sourceHost} در ${now.slice(0, 10)}`,
    externalSourceUrl: draft.externalSourceUrl,
    isActive: true,
    isFeatured: false,
    createdAt: now,
  };
}

function normalizedMatchTokens(value: string) {
  return toEnglishDigits(value)
    .toLowerCase()
    .replace(/[\u200c\s]+/g, " ")
    .replace(/[^a-z0-9آ-ی ]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !["laptop", "notebook", "core", "gb", "ssd", "ram", "inch", "لپ", "تاپ"].includes(token));
}

export function findMatchingStoreProductIndex(products: JsonStoreProduct[], imported: JsonStoreProduct) {
  const importedTokens = new Set(normalizedMatchTokens(imported.title));
  let bestIndex = -1;
  let bestScore = 0;
  products.forEach((product, index) => {
    if (product.externalSourceUrl && product.externalSourceUrl === imported.externalSourceUrl) {
      bestIndex = index;
      bestScore = 999;
      return;
    }
    const productTokens = normalizedMatchTokens(product.title);
    const shared = productTokens.filter((token) => importedTokens.has(token));
    const brandScore = product.brand.toLowerCase() === imported.brand.toLowerCase() ? 2 : 0;
    const score = shared.length + brandScore;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestScore >= 5 ? bestIndex : -1;
}
