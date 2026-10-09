import type { JsonStoreProduct } from "@/lib/json-store";
import { appendStorePriceHistory } from "@/lib/store-price-history";

export type ImportedStoreProductDraft = {
  title: string;
  brand: string;
  category: string;
  summary: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
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
  categoryFilters?: ProductImportCategoryKey[];
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

function safeImageUrl(value: string, baseUrl: string) {
  const url = absoluteUrl(value, baseUrl);
  return /^https?:\/\//i.test(url) ? url : "";
}

function imageUrlFromHtml(html: string, pageUrl: string) {
  const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0] || "");
  for (const tag of metaTags) {
    if (!/(?:property|name)=["'](?:og:image|twitter:image(?::src)?)["']/i.test(tag)) continue;
    const content = tag.match(/content=["']([^"']+)["']/i)?.[1] || "";
    const imageUrl = safeImageUrl(decodeHtml(content).trim(), pageUrl);
    if (imageUrl) return imageUrl;
  }
  return "";
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
  if (/dell|(^|[\s،,\-])دل($|[\s،,\-])/.test(lower)) return "Dell";
  if (/asus|ایسوس/.test(lower)) return "Asus";
  if (/apple|macbook|مک|اپل/.test(lower)) return "Apple";
  if (/hp|اچ ?پی|اچ‌پی/.test(lower)) return "HP";
  if (/acer|ایسر/.test(lower)) return "Acer";
  if (/msi/.test(lower)) return "MSI";
  return fallback;
}

function textMatchesLaptop(lower: string) {
  const explicitLaptopWords = /laptop|notebook|ultrabook|chromebook|macbook|لپ\s?تاپ|لپ‌تاپ|لپتاپ|نوت\s?بوک|نوت‌بوک|اولترابوک|الترابوک|کروم\s?بوک|مک\s?بوک/.test(lower);
  const laptopSeries = /thinkpad|thinkbook|ideapad|legion|lenovo\s*loq|yoga|vivobook|zenbook|expertbook|proart|asus\s*tuf|rog\s*(strix|zephyrus|flow)?|latitude|inspiron|vostro|xps\s*\d|precision|alienware|elitebook|probook|pavilion|envy|victus|omen|zbook|spectre|aspire|nitro|predator|swift|travelmate|msi\s*(modern|cyborg|katana|thin|pulse|vector|raider|stealth|prestige|summit|bravo|creator|venturepro)|modern\s*\d|cyborg\s*\d|katana\s*\d|venturepro\s*\d|matebook|surface\s*laptop|galaxy\s*book|lg\s*gram|aorus|gigabyte\s*(g5|g6|aero)|razer\s*blade/.test(lower);
  const laptopScreenSize = /(?:11\.6|12\.5|13(?:\.3|\.4|\.5)?|14(?:\.0)?|15(?:\.6)?|16(?:\.0)?|17(?:\.3)?|18(?:\.0)?)\s*(?:inch|اینچ|اینچی)/.test(lower);
  const laptopSpecs = /core\s*(?:i[3579]|ultra|3|5|7|9)|ryzen\s*[3579]|celeron|pentium|intel|amd|rtx\s*\d{3,4}|gtx\s*\d{3,4}|mx\s*\d{3}|iris\s*xe|radeon|رم\s*\d|\d+\s*gb\s*(?:ram|ddr)|ssd|nvme|پردازنده|گرافیک/.test(lower);
  return explicitLaptopWords || laptopSeries || (laptopScreenSize && laptopSpecs);
}

function productCategoryKeyFromText(value: string): ProductImportCategoryKey | "unknown" {
  const lower = value.toLowerCase();

  // اول گروه‌های دقیق‌تر را تشخیص می‌دهیم تا برندهایی مثل Xiaomi/Samsung
  // باعث نشوند تبلت، پاوربانک یا لوازم جانبی اشتباهاً «موبایل» حساب شوند.
  if (/tablet|ipad|galaxy\s*tab|redmi\s*pad|poco\s*pad|(^|\s)pad(\s|$)|تبلت|آیپد|گلکسی\s*تب/.test(lower)) return "tablet";
  if (/watch|wearable|ساعت هوشمند|اسمارت واچ|مچ.?بند/.test(lower)) return "smart-watch";
  if (/headset|headphone|earbud|earphone|airpods|speaker|microphone|هندزفری|هدفون|هدست|ایرباد|ایرپاد|اسپیکر|میکروفون/.test(lower)) return "audio";
  if (/power\s*bank|powerbank|پاوربانک|پاور\s*بانک|شارژر همراه|charger|شارژر|adapter|آداپتور|کابل|cable|قاب(?!ل)|کاور|گلس|محافظ صفحه|هولدر|پایه نگهدارنده|کیف|کوله|bag|sleeve|stand|استند|پایه خنک|cooling\s*pad|کول\s*پد|فن خنک|لوازم جانبی/.test(lower)) return "accessories";

  const explicitPhoneWords = /iphone|آیفون|smartphone|mobile\s*phone|cell\s*phone|گوشی|موبایل/.test(lower);
  const samsungGalaxyPhone = /galaxy\s*(s|a|m|z)\s*\d|گلکسی\s*(s|a|m|z)?\s*\d|سامسونگ.*(s|a|m|z)\s*\d{2}/.test(lower);
  const xiaomiPhone = /redmi\s*(note\s*)?\d|ردمی\s*(نوت\s*)?\d|redmi\s*a\s*\d|poco\s*(x|f|m|c)\s*\d|پوکو\s*(x|f|m|c)?\s*\d|xiaomi\s*(mi\s*)?\d{2}|شیائومی.*(redmi|ردمی|poco|پوکو|\d{2})/.test(lower);
  const honorHuaweiPhone = /honor\s*(x|magic|play)?\s*\d|آنر\s*(x|ایکس|magic|مجیک|play|پلی)?\s*\d|huawei\s*(nova|y|p|mate)\s*\d|هواوی\s*(نوا|y|p|mate|میت)\s*\d/.test(lower);
  const otherPhoneSeries = /nokia\s*\d|نوکیا\s*\d|moto\s*g\s*\d|motorola\s*(edge|g)\s*\d|موتورولا|realme\s*(c|gt|note|narzo)?\s*\d|ریلمی|oneplus|وان\s*پلاس|nothing\s*phone|infinix|اینفینیکس|tecno|تکنو/.test(lower);
  if (explicitPhoneWords || samsungGalaxyPhone || xiaomiPhone || honorHuaweiPhone || otherPhoneSeries) return "mobile";

  const isLaptop = textMatchesLaptop(lower);
  if (isLaptop && /gaming|گیم|rtx|legion|tuf|rog|گیمینگ/.test(lower)) return "gaming";
  if (isLaptop) return "laptop";
  if (/server|سرور/.test(lower)) return "server";
  if (/monitor|مانیتور|display/.test(lower)) return "monitor";
  if (/printer|پرینتر|چاپگر|scanner|اسکنر|کارتریج|تونر/.test(lower)) return "printer";
  if (/camera|دوربین|cctv|وب.?کم/.test(lower)) return "camera";
  if (/router|modem|network|switch|مودم|روتر|شبکه|سوییچ|کابل شبکه/.test(lower)) return "network";
  if (/console|playstation|xbox|nintendo|ps5|ps4|کنسول|پلی.?استیشن|ایکس.?باکس/.test(lower)) return "console";
  if (/ssd|hdd|hard|storage|flash|memory card|هارد|حافظه|فلش|مموری/.test(lower)) return "storage";
  if (/cpu|processor|gpu|graphics|motherboard|ram|power\s*supply|case|cooler|پردازنده|کارت گرافیک|مادربرد|رم کامپیوتر|پاور کامپیوتر|منبع تغذیه|کیس|خنک/.test(lower)) return "components";
  if (/mouse|keyboard|ماوس|کیبورد|پد ماوس/.test(lower)) return "accessories";
  if (/gaming|گیم|rtx|legion|tuf|rog|گیمینگ/.test(lower)) return "gaming";
  if (/desktop|all.?in.?one|mini.?pc|pc |computer|کیس آماده|کامپیوتر|مینی.?پی.?سی|آل.?این.?وان/.test(lower)) return "desktop";
  return "unknown";
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
  return "نامشخص";
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
      const nested: string = firstText(record.name, record.title, record.value, record.url, record.contentUrl, record.thumbnailUrl);
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
    imageUrl: safeImageUrl(firstText(product.image), pageUrl) || undefined,
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
    imageUrl: imageUrlFromHtml(html, pageUrl) || undefined,
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
  if (key === "unknown") return false;
  if (selectedCategories.includes(key)) return true;
  if (key === "gaming" && selectedCategories.includes("laptop")) return true;
  if (key === "printer" && selectedCategories.includes("office-machines")) return true;
  if (key === "storage" && selectedCategories.includes("components")) return true;
  return false;
}

const digikalaCategorySources: Record<ProductImportCategoryKey, { query: string; slugs: string[] }> = {
  laptop: { query: "لپ تاپ", slugs: ["notebook-netbook-ultrabook"] },
  mobile: { query: "گوشی موبایل", slugs: ["mobile-phone"] },
  tablet: { query: "تبلت", slugs: ["tablet"] },
  desktop: { query: "کامپیوتر آماده", slugs: ["desktop-computer", "all-in-one"] },
  components: { query: "قطعات کامپیوتر", slugs: ["computer-parts"] },
  accessories: { query: "لوازم جانبی کامپیوتر", slugs: ["computer-accessories"] },
  monitor: { query: "مانیتور", slugs: ["monitor"] },
  storage: { query: "SSD هارد", slugs: ["ssd", "internal-hard-drive", "external-hard-drive"] },
  gaming: { query: "لپ تاپ گیمینگ RTX", slugs: ["gaming-laptop", "gaming-accessories"] },
  console: { query: "کنسول بازی", slugs: ["game-console"] },
  network: { query: "مودم روتر شبکه", slugs: ["network-products"] },
  "office-machines": { query: "ماشین اداری", slugs: ["office-machines"] },
  printer: { query: "پرینتر", slugs: ["printer"] },
  camera: { query: "دوربین وب کم", slugs: ["camera", "webcam"] },
  audio: { query: "هدفون اسپیکر میکروفون", slugs: ["headphone-headset-microphone", "speaker"] },
  "smart-watch": { query: "ساعت هوشمند", slugs: ["wearable-gadget"] },
  server: { query: "سرور ورک استیشن", slugs: ["server", "workstation"] },
};

function digikalaUrlFromProduct(record: Record<string, unknown>) {
  const data = record as any;
  const id = firstText(data.id, data.product_id, data.data_layer?.dimension9);
  const uri = firstText(data.url, data.url?.uri, data.web_url);
  if (uri) return absoluteUrl(uri, "https://www.digikala.com/");
  if (id) return `https://www.digikala.com/product/dkp-${id}/`;
  return "https://www.digikala.com/";
}

function draftFromDigikalaRecord(
  record: Record<string, unknown>,
  sourceHost: string,
  fallbackCategory?: ProductImportCategoryKey,
): ImportedStoreProductDraft | null {
  const data = record as any;
  const title = firstText(
    data.title_fa,
    data.title_en,
    data.title,
    data.name,
    data.data_layer?.dimension2,
  ).slice(0, 180);
  if (!title) return null;

  const priceRaw = firstText(
    data.default_variant?.price?.selling_price,
    data.default_variant?.price?.rrp_price,
    data.price?.selling_price,
    data.price?.rrp_price,
    data.price,
  );
  const price = normalizePriceToToman(priceRaw, "IRR");
  if (!price) return null;

  const originalPrice = normalizePriceToToman(
    firstText(data.default_variant?.price?.rrp_price),
    "IRR",
  );
  const brand = firstText(data.brand?.title_fa, data.brand?.title_en, data.brand);
  const categoryText = firstText(data.category?.title_fa, data.category);
  const url = digikalaUrlFromProduct(record);
  const specs: Record<string, string> = {};
  const properties = asArray(record.properties as unknown[] | undefined);
  for (const item of properties) {
    if (!item || typeof item !== "object") continue;
    const prop = item as Record<string, unknown>;
    const name = firstText(prop.title, prop.name);
    const value = firstText(prop.values, prop.value);
    if (name && value) specs[name.slice(0, 40)] = value.slice(0, 90);
  }
  if (fallbackCategory) specs["گروه واردات"] = fallbackCategory;
  specs["منبع"] = "Digikala";

  return {
    title,
    brand: brandFromTitle(title, brand || "Digikala"),
    category: categoryText || categoryFromTitle(`${title} ${fallbackCategory || ""}`),
    summary: title,
    description: firstText(data.description, data.review?.description, title).slice(0, 900) || title,
    price,
    originalPrice: originalPrice > price ? originalPrice : undefined,
    imageUrl: safeImageUrl(firstText(data.images, data.image, data.image_url, data.imageUrl), url) || undefined,
    stock: firstText(data.default_variant?.status, data.status).toLowerCase().includes("out") ? 0 : 5,
    specs,
    externalSourceUrl: url,
    sourceHost,
    currency: "IRR",
  };
}

function digikalaRecordsFromJson(json: unknown): Record<string, unknown>[] {
  const records: Record<string, unknown>[] = [];
  const visited = new Set<object>();
  const visit = (value: unknown, depth = 0) => {
    if (!value || typeof value !== "object" || depth > 24 || visited.has(value)) return;
    visited.add(value);
    if (Array.isArray(value)) {
      for (const item of value) visit(item, depth + 1);
      return;
    }

    const record = value as Record<string, any>;
    const title = firstText(record.title_fa, record.title_en, record.title, record.name, record.product_title);
    const price = firstText(
      record.default_variant?.price?.selling_price,
      record.default_variant?.price?.rrp_price,
      record.price?.selling_price,
      record.price?.rrp_price,
      record.price,
    );
    if (title && price) records.push(record);
    for (const nested of Object.values(record)) visit(nested, depth + 1);
  };
  visit(json);

  const seen = new Set<string>();
  const output: Record<string, unknown>[] = [];
  for (const record of records) {
    const key = firstText(record.id, record.product_id, record.title_fa, record.title, record.product_title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(record);
  }
  return output;
}

async function fetchDigikalaApi(url: string) {
  const timeoutSignal =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? (AbortSignal as unknown as { timeout: (milliseconds: number) => AbortSignal }).timeout(15000)
      : undefined;
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      accept: "application/json, text/plain, */*",
      "accept-language": "fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7",
      referer: "https://www.digikala.com/",
      origin: "https://www.digikala.com",
    },
    signal: timeoutSignal,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  const result = parseJsonLoose(text);
  if (!result) throw new Error("پاسخ API دیجی‌کالا JSON معتبر نبود.");
  return result;
}

async function scanDigikalaRobot(
  sourceUrl: string,
  selectedCategories: ProductImportCategoryKey[],
  limit: number,
  warnings: string[],
) {
  const sourceHost = new URL(sourceUrl).hostname.replace(/^www\./, "");
  const categories = selectedCategories.length
    ? selectedCategories
    : (["laptop", "mobile", "tablet", "components", "accessories", "monitor", "gaming", "console"] as ProductImportCategoryKey[]);
  const maxApiCalls = 3;
  const activeCategories = categories.slice(0, maxApiCalls);
  if (categories.length > activeCategories.length) {
    warnings.push(`برای جلوگیری از سقف زیر‌درخواست‌های Cloudflare، در این نوبت حداکثر ${activeCategories.length} دسته از دیجی‌کالا جستجو می‌شود؛ برای بقیه دسته‌ها نوبت جداگانه اجرا کنید.`);
  }
  const urls: Array<{ url: string; category: ProductImportCategoryKey }> = [];
  const activeSources = activeCategories
    .map((category) => ({ category, source: digikalaCategorySources[category] }))
    .filter((item): item is { category: ProductImportCategoryKey; source: NonNullable<typeof item.source> } => Boolean(item.source));

  // Start with one category endpoint per selected category, then spend the small
  // request budget on alternate slugs and later pages to stay below Worker subrequest limits.
  for (const { category, source } of activeSources) {
    const slug = source.slugs[0];
    if (slug) urls.push({ url: `https://api.digikala.com/v1/categories/${slug}/search/?page=1`, category });
    else urls.push({ url: `https://api.digikala.com/v1/search/?q=${encodeURIComponent(source.query)}&page=1`, category });
  }

  for (const { category, source } of activeSources) {
    for (const slug of source.slugs.slice(1)) {
      if (urls.length >= maxApiCalls) break;
      urls.push({ url: `https://api.digikala.com/v1/categories/${slug}/search/?page=1`, category });
    }
  }

  for (const { category, source } of activeSources) {
    const primarySlug = source.slugs[0];
    for (let page = 2; page <= 3 && urls.length < maxApiCalls; page += 1) {
      if (primarySlug) {
        urls.push({ url: `https://api.digikala.com/v1/categories/${primarySlug}/search/?page=${page}`, category });
      } else {
        urls.push({ url: `https://api.digikala.com/v1/search/?q=${encodeURIComponent(source.query)}&page=${page}`, category });
      }
    }
  }

  const drafts: ImportedStoreProductDraft[] = [];
  const scannedUrls: string[] = [];
  for (let cursor = 0; cursor < urls.length && drafts.length < limit; cursor += 2) {
    const batch = urls.slice(cursor, cursor + 2);
    const results = await Promise.allSettled(batch.map((item) => fetchDigikalaApi(item.url)));
    for (let index = 0; index < results.length; index += 1) {
      const item = batch[index];
      const result = results[index];
      scannedUrls.push(item.url);
      if (result.status === "rejected") {
        warnings.push(`ربات دیجی‌کالا نتوانست ${item.url} را بخواند: ${result.reason instanceof Error ? result.reason.message : "خطا"}`);
        continue;
      }
      const records = digikalaRecordsFromJson(result.value);
      for (const record of records) {
        const draft = draftFromDigikalaRecord(record, sourceHost, item.category);
        if (draft) drafts.push(draft);
        if (drafts.length >= limit) break;
      }
    }
  }

  return { drafts: uniqueDrafts(drafts).slice(0, limit), scannedUrls };
}

export async function scanStoreProductsFromUrl(
  inputUrl: string,
  options: StoreProductImportScanOptions = {},
): Promise<StoreProductImportScanResult> {
  const sourceUrl = new URL(inputUrl).toString();
  if (!/^https?:$/i.test(new URL(sourceUrl).protocol)) throw new Error("فقط لینک‌های http/https قابل درون‌ریزی هستند.");
  const sourceHost = new URL(sourceUrl).hostname.replace(/^www\./, "");
  const limit = Math.max(1, Math.min(50, Number(options.limit || (options.fullSite ? 50 : 20))));
  const maxPages = Math.max(limit, Math.min(100, Number(options.maxPages || limit + 30)));
  const warnings: string[] = [];
  const scannedUrls: string[] = [];
  const allDrafts: ImportedStoreProductDraft[] = [];
  const selectedCategories = options.categoryFilters || [];
  const isDigikalaSource = /(^|\.)digikala\.com$/i.test(sourceHost) || /(^|\.)digikala\./i.test(sourceHost);

  const isDigikalaProductPage = /\/product\/dkp-/i.test(new URL(sourceUrl).pathname);
  const shouldSearchDigikalaCategories =
    isDigikalaSource && !isDigikalaProductPage && (options.fullSite || selectedCategories.length > 0);

  if (shouldSearchDigikalaCategories) {
    try {
      const robot = await scanDigikalaRobot(sourceUrl, selectedCategories, limit, warnings);
      scannedUrls.push(...robot.scannedUrls);
      allDrafts.push(...robot.drafts);
      if (robot.drafts.length > 0) {
        return {
          sourceUrl,
          sourceHost,
          scannedUrls,
          products: uniqueDrafts(allDrafts).slice(0, limit),
          warnings,
        };
      }
      warnings.push("ربات دیجی‌کالا محصولی پیدا نکرد؛ روش عمومی اسکن صفحه ادامه پیدا کرد.");
    } catch (error) {
      warnings.push(`ربات دیجی‌کالا اجرا نشد: ${error instanceof Error ? error.message : "خطا"}`);
    }
  }

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
    priceHistory: appendStorePriceHistory([], {
      recordedAt: now,
      price: draft.price,
      source: draft.sourceHost || "CSV",
      sourceUrl: draft.externalSourceUrl,
    }),
    imageUrl: draft.imageUrl,
    stock: Math.max(0, Math.floor(Number(draft.stock || 0))),
    rating: 4.5,
    reviewsCount: 0,
    badges: ["وارداتی", "قیمت ثبت‌شده"],
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
