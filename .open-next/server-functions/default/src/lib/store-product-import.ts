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

export type StoreProductImportScanOptions = {
  limit?: number;
  fullSite?: boolean;
  maxPages?: number;
};

export type ProductImportCategoryKey =
  | "laptop"
  | "mobile"
  | "tablet"
  | "desktop"
  | "components"
  | "accessories"
  | "monitor"
  | "storage"
  | "gaming"
  | "console"
  | "network"
  | "office-machines"
  | "printer"
  | "camera"
  | "audio"
  | "smart-watch"
  | "server";

const knownProductImportCategories = new Set<ProductImportCategoryKey>([
  "laptop",
  "mobile",
  "tablet",
  "desktop",
  "components",
  "accessories",
  "monitor",
  "storage",
  "gaming",
  "console",
  "network",
  "office-machines",
  "printer",
  "camera",
  "audio",
  "smart-watch",
  "server",
]);

const productKeywords = [
  "laptop",
  "notebook",
  "macbook",
  "thinkpad",
  "latitude",
  "elitebook",
  "tuf",
  "legion",
  "vivobook",
  "rog",
  "ideapad",
  "zbook",
  "surface",
  "pc",
  "computer",
  "monitor",
  "printer",
  "console",
  "mobile",
  "phone",
  "iphone",
  "samsung",
  "xiaomi",
  "tablet",
  "ipad",
  "watch",
  "camera",
  "router",
  "server",
  "storage",
  "لپ",
  "لپتاپ",
  "لپ‌تاپ",
  "نوت",
  "مک",
  "کامپیوتر",
  "مانیتور",
  "پرینتر",
  "کنسول",
  "موبایل",
  "گوشی",
  "آیفون",
  "سامسونگ",
  "شیائومی",
  "تبلت",
  "آیپد",
  "ساعت",
  "دوربین",
  "مودم",
  "روتر",
  "سرور",
  "هارد",
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
  return decodeHtml(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
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
  if (normalizedCurrency === "IRR" || normalizedCurrency === "RIAL") price = price / 10;
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
    .replace(/acer/g, " acer ")
    .replace(/msi/g, " msi ")
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

function productCategoryKeyFromText(value: string): ProductImportCategoryKey {
  const lower = value.toLowerCase();
  if (/iphone|mobile|phone|smartphone|گوشی|موبایل|آیفون|سامسونگ|شیائومی|هواوی|نوکیا/.test(lower)) return "mobile";
  if (/tablet|ipad|tab |تبلت|آیپد/.test(lower)) return "tablet";
  if (/watch|ساعت هوشمند|اسمارت واچ/.test(lower)) return "smart-watch";
  const isLaptop = /laptop|notebook|macbook|thinkpad|latitude|elitebook|vivobook|ideapad|لپ\s?تاپ|لپ‌تاپ|لپتاپ|نوت\s?بوک|مک\s?بوک/.test(lower);
  if (isLaptop && /gaming|گیم|rtx|legion|tuf|rog|گیمینگ/.test(lower)) return "gaming";
  if (isLaptop) return "laptop";
  if (/server|سرور/.test(lower)) return "server";
  if (/monitor|مانیتور|display/.test(lower)) return "monitor";
  if (/printer|پرینتر|چاپگر|scanner|اسکنر|کارتریج|تونر/.test(lower)) return "printer";
  if (/camera|دوربین|cctv|وب.?کم/.test(lower)) return "camera";
  if (/router|modem|network|switch|مودم|روتر|شبکه|سوییچ|کابل شبکه/.test(lower)) return "network";
  if (/console|playstation|xbox|nintendo|ps5|ps4|کنسول|پلی.?استیشن|ایکس.?باکس/.test(lower)) return "console";
  if (/ssd|hdd|hard|storage|flash|memory card|هارد|حافظه|فلش|مموری/.test(lower)) return "storage";
  if (/cpu|processor|gpu|graphics|motherboard|ram|power|case|cooler|پردازنده|کارت گرافیک|مادربرد|رم کامپیوتر|پاور|کیس|خنک/.test(lower)) return "components";
  if (/mouse|keyboard|headset|headphone|speaker|microphone|ماوس|کیبورد|هدست|هدفون|اسپیکر|میکروفون|پد ماوس/.test(lower)) return "accessories";
  if (/gaming|گیم|rtx|legion|tuf|rog|گیمینگ/.test(lower)) return "gaming";
  if (/desktop|all.?in.?one|mini.?pc|pc |computer|کیس آماده|کامپیوتر|مینی.?پی.?سی|آل.?این.?وان/.test(lower)) return "desktop";
  return "laptop";
}

function categoryFromTitle(title: string) {
  const key = productCategoryKeyFromText(title);
  if (key === "mobile") return "موبایل و گوشی";
  if (key === "tablet") return "تبلت و آیپد";
  if (key === "smart-watch") return "ساعت هوشمند";
  if (key === "server") return "سرور و تجهیزات ذخیره‌سازی";
  if (key === "monitor") return "مانیتور";
  if (key === "printer") return "ماشین‌های اداری";
  if (key === "camera") return "دوربین و وب‌کم";
  if (key === "network") return "تجهیزات شبکه";
  if (key === "console") return "کنسول بازی";
  if (key === "storage") return "حافظه و ذخیره‌سازی";
  if (key === "components") return "قطعات کامپیوتر";
  if (key === "accessories") return "لوازم جانبی کامپیوتر";
  if (key === "gaming") return "وسایل گیمینگ";
  if (key === "desktop") return "کامپیوتر آماده";

  const lower = title.toLowerCase();
  if (/student|دانشجو|سبک|air|elitebook/.test(lower)) return "لپ‌تاپ دانشجویی و سبک";
  if (/workstation|مهندس|طراحی|render|رندر|zbook/.test(lower)) return "لپ‌تاپ مهندسی";
  if (/business|اداری|thinkpad|latitude/.test(lower)) return "لپ‌تاپ اداری و شرکتی";
  return "لپ‌تاپ و کامپیوتر";
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
  const originalPrice = normalizePriceToToman(firstText(aggregateOffer?.highPrice), currency);
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

function isProbablyProductTitle(title: string) {
  const lower = title.toLowerCase();
  return productKeywords.some((keyword) => lower.includes(keyword.toLowerCase())) || /\d/.test(toEnglishDigits(title));
}

function draftFromJsonLdProduct(product: Record<string, unknown>, pageUrl: string, sourceHost: string): ImportedStoreProductDraft | null {
  const title = firstText(product.name, product.title).slice(0, 180);
  if (!title) return null;
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
  if (!title || !isProbablyProductTitle(title)) return null;
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

function isBlockedPath(value: string) {
  return /cart|checkout|login|account|comment|compare|wishlist|wp-content|tag|author|feed|privacy|terms/i.test(value);
}

function likelyProductUrl(url: string, sitemapUrl = "") {
  try {
    const parsed = new URL(url);
    const decoded = decodeURIComponent(`${parsed.pathname} ${parsed.search}`.toLowerCase());
    if (isBlockedPath(decoded)) return false;
    if (/product|products|\/p\/|\/shop\/|kala|goods|item|prd|product-|prod-|\/pd\//i.test(decoded)) return true;
    if (/product|products|kala|shop/i.test(sitemapUrl) && !/category|blog|page/i.test(decoded)) return true;
    return productKeywords.some((keyword) => decoded.includes(keyword.toLowerCase()));
  } catch {
    return false;
  }
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
    if (isBlockedPath(haystack)) continue;
    if (!likelyProductUrl(url.toString()) && !productKeywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) continue;
    links.add(url.toString());
    if (links.size >= limit) break;
  }
  return [...links];
}

export function importedDraftIdentityKey(draft: Pick<ImportedStoreProductDraft, "title" | "brand" | "specs">) {
  const tokens = normalizedMatchTokens(`${draft.brand} ${draft.title} ${Object.values(draft.specs || {}).join(" ")}`)
    .filter((token) => /\d/.test(token) || token.length >= 3)
    .slice(0, 14);
  return tokens.join("-") || stableHash(`${draft.brand}:${draft.title}`);
}

function chooseBetterDraft(current: ImportedStoreProductDraft, candidate: ImportedStoreProductDraft) {
  const currentScore = Object.keys(current.specs || {}).length * 3 + current.description.length / 120;
  const candidateScore = Object.keys(candidate.specs || {}).length * 3 + candidate.description.length / 120;
  if (candidateScore > currentScore + 1) return candidate;
  if (candidate.price > 0 && current.price > 0 && candidate.price < current.price) return candidate;
  return current;
}

function uniqueDrafts(drafts: ImportedStoreProductDraft[]) {
  const byIdentity = new Map<string, ImportedStoreProductDraft>();
  for (const draft of drafts) {
    const key = importedDraftIdentityKey(draft);
    const existing = byIdentity.get(key);
    byIdentity.set(key, existing ? chooseBetterDraft(existing, draft) : draft);
  }
  return [...byIdentity.values()];
}

async function fetchText(url: string) {
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

const fetchHtml = fetchText;

function parseSitemapLocs(xml: string) {
  return [...xml.matchAll(/<loc[^>]*>([\s\S]*?)<\/loc>/gi)]
    .map((match) => decodeHtml(stripTags(match[1] || "")))
    .filter(Boolean);
}

async function discoverSitemapUrls(sourceUrl: string, limit: number, warnings: string[]) {
  const base = new URL(sourceUrl);
  const sitemapQueue: string[] = [];
  const sitemapSeen = new Set<string>();
  const productUrls: string[] = [];
  const addSitemap = (url: string) => {
    const absolute = absoluteUrl(url, base.origin);
    if (absolute && !sitemapSeen.has(absolute)) {
      sitemapSeen.add(absolute);
      sitemapQueue.push(absolute);
    }
  };

  addSitemap("/sitemap.xml");
  addSitemap("/sitemap_index.xml");
  addSitemap("/product-sitemap.xml");
  addSitemap("/product-sitemap1.xml");
  addSitemap("/sitemap-products.xml");

  try {
    const robots = await fetchText(`${base.origin}/robots.txt`);
    for (const match of robots.matchAll(/^\s*Sitemap:\s*(\S+)\s*$/gim)) addSitemap(match[1]);
  } catch {
    // robots.txt اختیاری است.
  }

  while (sitemapQueue.length > 0 && productUrls.length < limit && sitemapSeen.size < 60) {
    const sitemapUrl = sitemapQueue.shift()!;
    try {
      const xml = await fetchText(sitemapUrl);
      const locs = parseSitemapLocs(xml);
      for (const loc of locs) {
        if (/\.xml(\.gz)?($|\?)/i.test(loc) || /sitemap/i.test(loc)) {
          addSitemap(loc);
        } else if (likelyProductUrl(loc, sitemapUrl)) {
          productUrls.push(loc);
          if (productUrls.length >= limit) break;
        }
      }
    } catch (error) {
      warnings.push(`خواندن sitemap ناموفق بود: ${sitemapUrl} (${error instanceof Error ? error.message : "خطا"})`);
    }
  }

  return [...new Set(productUrls)].slice(0, limit);
}

async function scanOnePage(url: string, sourceHost: string) {
  const html = await fetchHtml(url);
  const drafts = extractProductDraftsFromJsonLd(html, url, sourceHost);
  const fallback = drafts.length ? null : fallbackDraftFromHtml(html, url, sourceHost);
  return {
    html,
    drafts: fallback ? [...drafts, fallback] : drafts,
  };
}

export function normalizeProductImportCategories(value: unknown): ProductImportCategoryKey[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter((item): item is ProductImportCategoryKey =>
      knownProductImportCategories.has(item as ProductImportCategoryKey),
    );
}

export function productImportCategoryKey(draft: Pick<ImportedStoreProductDraft, "title" | "brand" | "category" | "specs">) {
  return productCategoryKeyFromText(
    `${draft.title} ${draft.brand} ${draft.category} ${Object.values(draft.specs || {}).join(" ")}`,
  );
}

export function productMatchesImportCategories(
  draft: ImportedStoreProductDraft,
  selectedCategories: ProductImportCategoryKey[],
) {
  if (selectedCategories.length === 0) return true;
  const key = productImportCategoryKey(draft);
  if (selectedCategories.includes(key)) return true;
  if (key === "gaming" && selectedCategories.includes("laptop")) return true;
  if (key === "printer" && selectedCategories.includes("office-machines")) return true;
  if (key === "storage" && selectedCategories.includes("components")) return true;
  return false;
}

export async function scanStoreProductsFromUrl(
  inputUrl: string,
  options: StoreProductImportScanOptions = {},
): Promise<StoreProductImportScanResult> {
  const sourceUrl = new URL(inputUrl).toString();
  if (!/^https?:$/i.test(new URL(sourceUrl).protocol)) throw new Error("فقط لینک‌های http/https قابل درون‌ریزی هستند.");
  const sourceHost = new URL(sourceUrl).hostname.replace(/^www\./, "");
  const limit = Math.max(1, Math.min(1000, Number(options.limit || (options.fullSite ? 1000 : 50))));
  const maxPages = Math.max(limit, Math.min(1200, Number(options.maxPages || limit + 30)));
  const warnings: string[] = [];
  const scannedUrls: string[] = [];
  const allDrafts: ImportedStoreProductDraft[] = [];
  const queue: string[] = [sourceUrl];
  const queued = new Set(queue);

  if (options.fullSite) {
    const sitemapUrls = await discoverSitemapUrls(sourceUrl, Math.min(maxPages, limit * 2), warnings);
    for (const url of sitemapUrls) {
      if (!queued.has(url)) {
        queued.add(url);
        queue.push(url);
      }
    }
  }

  let cursor = 0;
  while (cursor < queue.length && scannedUrls.length < maxPages && uniqueDrafts(allDrafts).length < limit) {
    const batch = queue.slice(cursor, cursor + (options.fullSite ? 6 : 3));
    cursor += batch.length;
    const results = await Promise.allSettled(batch.map((url) => scanOnePage(url, sourceHost)));

    for (let index = 0; index < results.length; index += 1) {
      const url = batch[index];
      const result = results[index];
      if (result.status === "rejected") {
        warnings.push(`خواندن ${url} ناموفق بود: ${result.reason instanceof Error ? result.reason.message : "خطای نامشخص"}`);
        continue;
      }
      scannedUrls.push(url);
      allDrafts.push(...result.value.drafts);

      if (!options.fullSite || scannedUrls.length >= maxPages || queue.length >= maxPages) continue;
      const links = extractProductLinks(result.value.html, url, Math.min(80, maxPages - queue.length));
      for (const link of links) {
        if (!queued.has(link)) {
          queued.add(link);
          queue.push(link);
        }
        if (queue.length >= maxPages) break;
      }
    }
  }

  const products = uniqueDrafts(allDrafts).slice(0, limit);
  if (!products.length) {
    warnings.push("محصول قابل تشخیص پیدا نشد. اگر سایت با JavaScript قیمت‌ها را بعداً بارگذاری کند، ممکن است نیاز به لینک مستقیم صفحه محصول یا sitemap محصولات داشته باشد.");
  }
  if (options.fullSite && products.length >= limit) {
    warnings.push(`به سقف ${limit.toLocaleString("fa-IR")} محصول در این مرحله رسیدیم. برای ادامه، دوباره لینک سایت یا sitemap را با سقف بالاتر اسکن کنید.`);
  }

  return { sourceUrl, sourceHost, scannedUrls, products, warnings };
}

export function importedDraftToStoreProduct(draft: ImportedStoreProductDraft): JsonStoreProduct {
  const now = new Date().toISOString();
  const specs = { ...draft.specs };
  if (!specs.منبع) specs.منبع = draft.sourceHost;
  return {
    id: `imp-${stableHash(`${draft.sourceHost}:${importedDraftIdentityKey(draft)}`)}`,
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
    .filter(
      (token) =>
        token.length >= 2 &&
        ![
          "laptop",
          "notebook",
          "core",
          "gb",
          "ssd",
          "ram",
          "inch",
          "اینچ",
          "لپ",
          "تاپ",
          "مدل",
          "خرید",
          "قیمت",
        ].includes(token),
    );
}

export function storeProductIdentityKey(product: Pick<JsonStoreProduct, "title" | "brand" | "specs">) {
  return importedDraftIdentityKey({
    title: product.title,
    brand: product.brand,
    specs: product.specs || {},
  });
}

export function findMatchingStoreProductIndex(products: JsonStoreProduct[], imported: JsonStoreProduct) {
  const importedIdentity = storeProductIdentityKey(imported);
  const importedTokens = new Set(normalizedMatchTokens(imported.title));
  let bestIndex = -1;
  let bestScore = 0;
  products.forEach((product, index) => {
    if (product.externalSourceUrl && product.externalSourceUrl === imported.externalSourceUrl) {
      bestIndex = index;
      bestScore = 999;
      return;
    }
    if (storeProductIdentityKey(product) === importedIdentity) {
      bestIndex = index;
      bestScore = 998;
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
