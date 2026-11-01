import type { JsonStoreProduct } from "@/lib/json-store";
import { appendStorePriceHistory } from "@/lib/store-price-history";
import { storeComputerPartKind } from "@/lib/store-computer-part-kind";
import { technicalSpecsFromText } from "@/lib/store-product-specs";

export type ImportedStoreProductDraft = {
  title: string;
  brand: string;
  category: string;
  summary: string;
  description: string;
  price: number;
  originalPrice?: number;
  /** تصاویر محصول به ترتیب اولویت؛ imageUrl همیشه تصویر اصلی همین مجموعه است. */
  imageUrls?: string[];
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
  partFilters?: string[];
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

function isPrivateNetworkHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host === "::1" || host === "0:0:0:0:0:0:0:1" || /^(?:fc|fd|fe8|fe9|fea|feb)[0-9a-f:]*$/i.test(host)) return true;
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const octets = ipv4.slice(1).map(Number);
  if (octets.some((value) => value < 0 || value > 255)) return true;
  const [a, b] = octets;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168);
}

function publicHttpUrl(value: string) {
  const parsed = new URL(value);
  if (!/^https?:$/i.test(parsed.protocol)) throw new Error("فقط لینک‌های عمومی http/https قابل استخراج هستند.");
  if (parsed.username || parsed.password) throw new Error("لینک دارای نام کاربری یا رمز عبور قابل استخراج نیست.");
  if (isPrivateNetworkHostname(parsed.hostname)) throw new Error("آدرس‌های محلی یا شبکهٔ خصوصی قابل استخراج نیستند.");
  return parsed.toString();
}

function uniqueImageUrls(values: unknown[], baseUrl: string, limit = 8) {
  const output: string[] = [];
  const seen = new Set<string>();
  const add = (raw: unknown) => {
    if (output.length >= limit) return;
    const value = decodeHtml(String(raw || "")).trim();
    if (!value || /^(?:data|blob|javascript):/i.test(value)) return;
    const url = safeImageUrl(value, baseUrl);
    if (!url || /(?:logo|icon|sprite|avatar|badge|placeholder|favicon)(?:[._\-/]|$)/i.test(url)) return;
    // پارامترهای اندازه و CDN را نگه می‌داریم، اما fragment هیچ کاربردی برای عکس ندارد.
    const parsed = new URL(url);
    parsed.hash = "";
    const normalized = parsed.toString();
    if (seen.has(normalized)) return;
    seen.add(normalized);
    output.push(normalized);
  };
  const visit = (value: unknown, depth = 0) => {
    if (output.length >= limit || value == null || depth > 4) return;
    if (typeof value === "string" || typeof value === "number") {
      add(value);
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) visit(item, depth + 1);
      return;
    }
    if (typeof value !== "object") return;
    const record = value as Record<string, unknown>;
    for (const key of ["url", "contentUrl", "fullUrl", "webp_url", "src", "image", "thumbnailUrl"]) {
      if (key in record) visit(record[key], depth + 1);
    }
  };
  for (const value of values) visit(value);
  return output;
}

function imageUrlsFromHtml(html: string, pageUrl: string, limit = 8) {
  const candidates: string[] = [];
  const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0] || "");
  for (const tag of metaTags) {
    if (!/(?:property|name|itemprop)=["'](?:og:image(?::url)?|twitter:image(?::src)?|image)["']/i.test(tag)) continue;
    const content = tag.match(/content=["']([^"']+)["']/i)?.[1] || "";
    if (content) candidates.push(content);
  }
  for (const tag of html.matchAll(/<(?:img|source)\b[^>]*>/gi)) {
    const rawTag = tag[0] || "";
    const alt = decodeHtml(rawTag.match(/\balt=["']([^"']*)["']/i)?.[1] || "");
    if (/logo|icon|avatar|badge|بنر|لوگو/i.test(alt)) continue;
    const srcset = rawTag.match(/\b(?:srcset|data-srcset)=["']([^"']+)["']/i)?.[1] || "";
    if (srcset) {
      const largest = srcset.split(",").map((entry) => entry.trim().split(/\s+/)[0]).filter(Boolean).at(-1);
      if (largest) candidates.push(largest);
    }
    const src = rawTag.match(/\b(?:data-zoom-image|data-large-image|data-src|src)=["']([^"']+)["']/i)?.[1] || "";
    if (src) candidates.push(src);
    if (candidates.length >= limit * 5) break;
  }
  return uniqueImageUrls(candidates, pageUrl, limit);
}

function imageUrlFromHtml(html: string, pageUrl: string) {
  return imageUrlsFromHtml(html, pageUrl, 1)[0] || "";
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
  if (/gigabyte|گیگابایت|aorus/.test(lower)) return "Gigabyte";
  if (/corsair|کورسیر/.test(lower)) return "Corsair";
  if (/kingston|کینگستون/.test(lower)) return "Kingston";
  if (/crucial|کروشیال/.test(lower)) return "Crucial";
  if (/samsung|سامسونگ/.test(lower)) return "Samsung";
  if (/western\s*digital|وسترن\s*دیجیتال|\bwd\b/.test(lower)) return "Western Digital";
  if (/seagate|سیگیت/.test(lower)) return "Seagate";
  if (/cooler\s*master|کولر\s*مستر/.test(lower)) return "Cooler Master";
  if (/green|گرین/.test(lower)) return "Green";
  if (/\bintel\b|اینتل/.test(lower)) return "Intel";
  if (/\bamd\b|ای\s*ام\s*دی/.test(lower)) return "AMD";
  if (/nvidia|انویدیا/.test(lower)) return "NVIDIA";
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
  if (/cpu|processor|core\s*i[3579]|core\s*ultra|ryzen\s*[3579]|pentium|celeron|athlon|gpu|graphics|motherboard|ram|power\s*supply|computer\s*case|computer\s*chassis|cooler|thermal\s*paste|sound\s*card|پردازنده|کارت گرافیک|مادربرد|رم کامپیوتر|پاور کامپیوتر|منبع تغذیه|کیس کامپیوتر|خنک|فن(?:\s|$)|خمیر (?:حرارتی|سیلیکون)|کارت صدا|قطعات کامپیوتر/.test(lower)) return "components";
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

function addCleanSpec(specs: Record<string, string>, rawName: unknown, rawValue: unknown) {
  if (Object.keys(specs).length >= 48) return;
  const name = stripTags(String(rawName || "")).replace(/[:：]+$/g, "").trim();
  const value = stripTags(String(rawValue || "")).trim();
  if (!name || !value || name.length < 2 || name.length > 90 || value.length > 800) return;
  if (/^(?:قیمت|price|خرید|فروشنده|موجودی|ارسال|کد کالا|شناسه محصول|اشتراک)/i.test(name)) return;
  if (/^(?:-|—|نامشخص|ندارد|null|undefined)$/i.test(value)) return;
  if (name === value || /https?:\/\//i.test(value)) return;
  specs[name.slice(0, 80)] = value.replace(/\s+/g, " ").slice(0, 500);
}

function specsFromJsonLd(product: Record<string, unknown>) {
  const specs: Record<string, string> = {};
  const props = asArray(product.additionalProperty as unknown[] | undefined).flatMap((item) =>
    Array.isArray(item) ? item : [item],
  );
  for (const item of props) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    addCleanSpec(specs, firstText(record.name), firstText(record.value));
  }
  for (const [label, key] of [
    ["مدل", "model"],
    ["کد محصول", "mpn"],
    ["شناسه جهانی", "gtin13"],
    ["رنگ", "color"],
    ["جنس", "material"],
    ["اندازه", "size"],
    ["وزن", "weight"],
  ] as const) {
    addCleanSpec(specs, label, firstText(product[key]));
  }
  return specs;
}

function specsFromHtml(html: string) {
  const specs: Record<string, string> = {};
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...String(row[1] || "").matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi)]
      .map((cell) => stripTags(cell[1] || ""))
      .filter(Boolean);
    if (cells.length >= 2) addCleanSpec(specs, cells[0], cells.slice(1).join("، "));
  }
  for (const group of html.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi)) {
    addCleanSpec(specs, group[1], group[2]);
  }
  // بسیاری از قالب‌های فروشگاهی مشخصات را بدون table و با دو span کنار هم می‌سازند.
  for (const item of html.matchAll(/<(?:li|div)\b[^>]*(?:class|data-testid)=["'][^"']*(?:spec|attribute|feature)[^"']*["'][^>]*>([\s\S]*?)<\/(?:li|div)>/gi)) {
    const fragment = item[1] || "";
    const cells = [...fragment.matchAll(/<(?:span|div|p|strong|b)\b[^>]*>([\s\S]*?)<\/(?:span|div|p|strong|b)>/gi)]
      .map((cell) => stripTags(cell[1] || ""))
      .filter((value) => value.length >= 1 && value.length <= 500);
    if (cells.length >= 2) addCleanSpec(specs, cells[0], cells.slice(1).join("، "));
    if (Object.keys(specs).length >= 48) break;
  }
  return specs;
}

function mergeExtractedSpecs(...groups: Array<Record<string, string> | undefined>) {
  const merged: Record<string, string> = {};
  for (const group of groups) {
    for (const [name, value] of Object.entries(group || {})) addCleanSpec(merged, name, value);
  }
  return merged;
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
  const description = firstText(product.description, title).slice(0, 5000);
  const imageUrls = uniqueImageUrls([product.image], pageUrl, 8);
  return {
    title,
    brand: brandFromTitle(title, brand),
    category: firstText(product.category) || categoryFromTitle(title),
    summary: description.slice(0, 180) || title,
    description: description || title,
    price: offer.price,
    originalPrice: offer.originalPrice,
    imageUrls,
    imageUrl: imageUrls[0],
    stock: offer.stock,
    specs: mergeExtractedSpecs(
      specsFromJsonLd(product),
      technicalSpecsFromText(`${title} ${description}`),
    ),
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
      const mergedCandidate = candidate === product
        ? product
        : {
            ...product,
            ...candidate,
            offers: candidate.offers || product.offers,
            image: candidate.image || product.image,
            brand: candidate.brand || product.brand,
            additionalProperty: [
              ...asArray(product.additionalProperty as unknown[] | undefined),
              ...asArray(candidate.additionalProperty as unknown[] | undefined),
            ],
          };
      const draft = draftFromJsonLdProduct(mergedCandidate, pageUrl, sourceHost);
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
  const patterns: Array<{ pattern: RegExp; currency?: string }> = [
    { pattern: /([\d۰-۹٠-٩][\d۰-۹٠-٩,.٬\s]{4,})\s*(?:تومان|تومن|IRT)/gi, currency: "IRT" },
    { pattern: /(?:تومان|تومن|IRT)\s*([\d۰-۹٠-٩][\d۰-۹٠-٩,.٬\s]{4,})/gi, currency: "IRT" },
    { pattern: /"price"\s*:\s*"?([\d۰-۹٠-٩][\d۰-۹٠-٩,.٬\s]{4,})"?/gi },
  ];
  for (const { pattern, currency } of patterns) {
    for (const match of text.matchAll(pattern)) {
      const value = normalizePriceToToman(match[1], currency);
      if (value >= 100_000 && value <= 10_000_000_000) candidates.push(value);
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
  const rawDescription = html.match(/<meta\b[^>]*(?:name|property)=["'](?:description|og:description)["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1]
    || html.match(/<meta\b[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["'](?:description|og:description)["'][^>]*>/i)?.[1]
    || "";
  const description = stripTags(rawDescription).slice(0, 5000) || title;
  const imageUrls = imageUrlsFromHtml(html, pageUrl, 8);
  return {
    title,
    brand: brandFromTitle(title),
    category: categoryFromTitle(title),
    summary: description.slice(0, 180) || title,
    description,
    price,
    originalPrice,
    imageUrls,
    imageUrl: imageUrls[0] || imageUrlFromHtml(html, pageUrl) || undefined,
    stock: /ناموجود|out of stock|sold out/i.test(stripTags(html)) ? 0 : 5,
    specs: mergeExtractedSpecs(
      specsFromHtml(html),
      technicalSpecsFromText(`${title} ${description}`),
    ),
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
    if (/product|products|\/p\/|\/shop\/|kala|goods|item|prd|product-|prod-|\/pd\/|مشخصات[_-]|~id~\d+/i.test(decoded)) return true;
    if (/product|products|kala|shop/i.test(sitemapUrl) && !/category|blog|page/i.test(decoded)) return true;
    return productKeywords.some((keyword) => decoded.includes(keyword.toLowerCase()));
  } catch {
    return false;
  }
}

function extractProductLinks(html: string, baseUrl: string, limit: number) {
  const base = new URL(baseUrl);
  const links = new Set<string>();
  const addLink = (rawHref: string, rawLabel = "") => {
    if (links.size >= limit) return;
    const href = absoluteUrl(rawHref, baseUrl);
    if (!href) return;
    const url = new URL(href);
    if (url.hostname !== base.hostname) return;
    url.hash = "";
    const label = stripTags(rawLabel);
    const haystack = `${decodeURIComponent(url.pathname)} ${label}`.toLowerCase();
    if (isBlockedPath(haystack)) return;
    if (!likelyProductUrl(url.toString()) && !productKeywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) return;
    links.add(url.toString());
  };
  for (const match of html.matchAll(/<a\s+[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    addLink(match[1] || "", match[2] || "");
    if (links.size >= limit) break;
  }
  if (links.size < limit) {
    for (const match of html.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)(?:\s+"[^"]*")?\)/gi)) {
      addLink(match[2] || "", match[1] || "");
      if (links.size >= limit) break;
    }
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
  const safeUrl = publicHttpUrl(url);
  const timeoutSignal =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? (AbortSignal as unknown as { timeout: (milliseconds: number) => AbortSignal }).timeout(15000)
      : undefined;
  const response = await fetch(safeUrl, {
    redirect: "follow",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7",
      "cache-control": "no-cache",
    },
    signal: timeoutSignal,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

const fetchHtml = fetchText;

async function fetchDigikalaSeoHtml(url: string) {
  const timeoutSignal =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? (AbortSignal as unknown as { timeout: (milliseconds: number) => AbortSignal }).timeout(15000)
      : undefined;
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "fa-IR,fa;q=0.9,en;q=0.6",
      "cache-control": "no-cache",
    },
    signal: timeoutSignal,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

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

  while (sitemapQueue.length > 0 && productUrls.length < limit && sitemapSeen.size < 45) {
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

export function extractStoreProductDraftsFromHtml(
  html: string,
  pageUrl: string,
  sourceHost = new URL(pageUrl).hostname.replace(/^www\./i, ""),
) {
  const drafts = extractProductDraftsFromJsonLd(html, pageUrl, sourceHost);
  const htmlSpecs = specsFromHtml(html);
  const htmlImages = imageUrlsFromHtml(html, pageUrl, 8);
  const enrichedDrafts = drafts.map((draft) => {
    const imageUrls = uniqueImageUrls(
      [...(draft.imageUrls || []), draft.imageUrl, ...htmlImages],
      pageUrl,
      8,
    );
    return {
      ...draft,
      imageUrls,
      imageUrl: imageUrls[0] || draft.imageUrl,
      specs: mergeExtractedSpecs(
        draft.specs,
        htmlSpecs,
        technicalSpecsFromText(`${draft.title} ${draft.description}`),
      ),
    };
  });
  const fallback = enrichedDrafts.length ? null : fallbackDraftFromHtml(html, pageUrl, sourceHost);
  return fallback ? [...enrichedDrafts, fallback] : enrichedDrafts;
}

async function scanOnePage(url: string, sourceHost: string) {
  const html = await fetchHtml(url);
  return {
    html,
    drafts: extractStoreProductDraftsFromHtml(html, url, sourceHost),
  };
}

function extractPaginationLinks(text: string, pageUrl: string, limit = 30) {
  const base = new URL(pageUrl);
  const links = new Set<string>();
  const add = (raw: string, attributes = "") => {
    if (links.size >= limit) return;
    const href = absoluteUrl(raw, pageUrl);
    if (!href) return;
    const url = new URL(href);
    if (url.hostname !== base.hostname || likelyProductUrl(url.toString())) return;
    const decoded = decodeURIComponent(`${url.pathname}${url.search}`);
    const explicitNext = /\brel\s*=\s*["'][^"']*next/i.test(attributes);
    if (!explicitNext && !/(?:~page~\d+|\/page\/\d+\/?|[?&](?:page|paged|pagenum)=\d+)/i.test(decoded)) return;
    url.hash = "";
    links.add(url.toString());
  };
  for (const match of text.matchAll(/<a\b([^>]*href=["']([^"'#]+)["'][^>]*)>/gi)) {
    add(match[2] || "", match[1] || "");
  }
  for (const match of text.matchAll(/\[[^\]]*\]\((https?:\/\/[^\s)]+)(?:\s+"[^"]*")?\)/gi)) {
    add(match[1] || "");
  }
  return [...links];
}

function markdownDraftFromProductPage(text: string, pageUrl: string, sourceHost: string) {
  if (!likelyProductUrl(pageUrl)) return null;
  const title = cleanMarkdownLabel(text.match(/^#\s+(.+)$/m)?.[1] || "").slice(0, 180);
  if (!title || !isProbablyProductTitle(title)) return null;
  const prices = formattedPricesFromText(text);
  const price = prices[0] || 0;
  if (price < 100_000) return null;
  const imageCandidates = [...text.matchAll(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/gi)]
    .map((match) => match[1] || "");
  const imageUrls = uniqueImageUrls(imageCandidates, pageUrl, 8);
  return {
    title,
    brand: brandFromTitle(title, sourceHost),
    category: categoryFromTitle(title),
    summary: title,
    description: title,
    price,
    originalPrice: prices.find((value) => value > price * 1.03 && value <= price * 1.8),
    imageUrls,
    imageUrl: imageUrls[0],
    stock: /ناموجود|out of stock|sold out/i.test(text) ? 0 : 5,
    specs: technicalSpecsFromText(title),
    externalSourceUrl: pageUrl,
    sourceHost,
    currency: "IRT",
  } satisfies ImportedStoreProductDraft;
}

async function fetchGenericPageWithReader(url: string) {
  try {
    return await fetchText(url);
  } catch (directError) {
    const target = new URL(url);
    const readerUrl = `https://r.jina.ai/http://${target.hostname}${target.pathname}${target.search}`;
    try {
      return await fetchText(readerUrl);
    } catch (readerError) {
      throw new Error(
        `direct: ${directError instanceof Error ? directError.message : "fetch failed"}; reader: ${readerError instanceof Error ? readerError.message : "fetch failed"}`,
      );
    }
  }
}

export type StoreProductCrawlPageResult = {
  pageUrl: string;
  products: ImportedStoreProductDraft[];
  productUrls: string[];
  pageUrls: string[];
  warnings: string[];
};

/** One bounded crawl step used by the admin browser for large (up to 10k) imports. */
export async function crawlStoreProductPage(
  inputUrl: string,
  options: { discoverSitemap?: boolean; linkLimit?: number } = {},
): Promise<StoreProductCrawlPageResult> {
  const pageUrl = publicHttpUrl(inputUrl);
  const parsed = new URL(pageUrl);
  const sourceHost = parsed.hostname.replace(/^www\./i, "");
  const isEmalls = /(^|\.)emalls\.ir$/i.test(sourceHost);
  const warnings: string[] = [];
  const linkLimit = Math.max(10, Math.min(10_000, Number(options.linkLimit || 500)));
  let text = "";
  try {
    text = isEmalls ? await fetchEmallsPageText(pageUrl) : await fetchGenericPageWithReader(pageUrl);
  } catch (error) {
    return {
      pageUrl,
      products: [],
      productUrls: [],
      pageUrls: [],
      warnings: [`خواندن ${pageUrl} ناموفق بود: ${error instanceof Error ? error.message : "خطا"}`],
    };
  }

  let products: ImportedStoreProductDraft[] = [];
  if (isEmalls) {
    const detail = emallsProductId(parsed.pathname)
      ? extractEmallsProductDraft(text, pageUrl)
      : null;
    products = detail ? [detail] : extractEmallsListingDrafts(text, pageUrl, linkLimit);
  } else if (/<[a-z][\s\S]*>/i.test(text)) {
    products = extractStoreProductDraftsFromHtml(text, pageUrl, sourceHost);
  } else {
    const markdown = markdownDraftFromProductPage(text, pageUrl, sourceHost);
    products = markdown ? [markdown] : [];
  }

  const productUrls = isEmalls
    ? emallsProductLinksFromText(text, pageUrl).map((item) => item.url).slice(0, linkLimit)
    : extractProductLinks(text, pageUrl, linkLimit);
  const pageUrls = extractPaginationLinks(text, pageUrl, 40);
  if (options.discoverSitemap) {
    try {
      const sitemapProducts = await discoverSitemapUrls(pageUrl, linkLimit, warnings);
      for (const url of sitemapProducts) {
        if (!productUrls.includes(url) && productUrls.length < linkLimit) productUrls.push(url);
      }
    } catch (error) {
      warnings.push(`کشف sitemap ناموفق بود: ${error instanceof Error ? error.message : "خطا"}`);
    }
  }
  return {
    pageUrl,
    products: uniqueDrafts(products).slice(0, linkLimit),
    productUrls,
    pageUrls,
    warnings,
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
  // وقتی مدیر «انتخاب همه» را زده است، ردیف معتبر را فقط به‌خاطر ناشناخته‌بودن
  // برچسب دسته حذف نمی‌کنیم؛ مخصوصاً CSVهای ترب که عنوان کوتاه مدل دارند.
  if (key === "unknown") return selectedCategories.length >= knownProductImportCategories.size;
  if (selectedCategories.includes(key)) return true;
  if (key === "gaming" && selectedCategories.includes("laptop")) return true;
  if (key === "printer" && selectedCategories.includes("office-machines")) return true;
  if (key === "storage" && selectedCategories.includes("components")) return true;
  return false;
}

export function productMatchesComputerPartFilters(
  draft: Pick<ImportedStoreProductDraft, "title" | "brand" | "category" | "summary" | "description" | "specs">,
  partFilters: string[] = [],
) {
  const filters = [...new Set(partFilters.map((item) => String(item).trim().toLowerCase()).filter(Boolean))];
  if (!filters.length) return true;
  const kind = storeComputerPartKind(draft);
  return Boolean(kind && filters.includes(kind));
}

const digikalaCategorySources: Record<ProductImportCategoryKey, { query: string; slugs: string[] }> = {
  laptop: { query: "لپ تاپ", slugs: ["notebook-netbook-ultrabook"] },
  mobile: { query: "گوشی موبایل", slugs: ["mobile-phone"] },
  tablet: { query: "تبلت", slugs: ["tablet"] },
  desktop: { query: "کامپیوتر آماده", slugs: ["desktop-computer", "all-in-one"] },
  components: { query: "قطعات کامپیوتر", slugs: [] },
  accessories: { query: "لوازم جانبی کامپیوتر", slugs: ["computer-accessories"] },
  monitor: { query: "مانیتور", slugs: ["monitor"] },
  storage: { query: "SSD هارد NVMe", slugs: [] },
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
  const brand = firstText(
    data.brand?.title_fa,
    data.brand?.title_en,
    data.brand,
    data.data_layer?.brand,
  );
  const categoryText = firstText(
    data.category?.title_fa,
    data.category,
    data.data_layer?.item_category5,
    data.data_layer?.item_category4,
    data.data_layer?.category,
  );
  const url = digikalaUrlFromProduct(record);
  const specs: Record<string, string> = {};
  const properties = asArray(record.properties as unknown[] | undefined);
  for (const item of properties) {
    if (!item || typeof item !== "object") continue;
    const prop = item as Record<string, unknown>;
    addCleanSpec(specs, firstText(prop.title, prop.name), firstText(prop.values, prop.value));
  }
  for (const group of asArray(data.specifications as unknown[] | undefined)) {
    if (!group || typeof group !== "object") continue;
    const attributes = asArray((group as Record<string, unknown>).attributes as unknown[] | undefined);
    for (const item of attributes) {
      if (!item || typeof item !== "object") continue;
      const attribute = item as Record<string, unknown>;
      const rawValues = asArray(attribute.values as unknown[] | undefined)
        .map((value) => firstText(value))
        .filter(Boolean)
        .join("، ");
      addCleanSpec(specs, firstText(attribute.title, attribute.name), rawValues || firstText(attribute.value));
    }
  }
  if (fallbackCategory) specs["گروه واردات"] = fallbackCategory;
  specs["منبع"] = "Digikala";
  const description = firstText(
    data.description,
    data.review?.description,
    data.expert_reviews?.description,
    title,
  ).slice(0, 5000) || title;
  const imageUrls = uniqueImageUrls(
    [
      data.images?.main,
      data.images?.list,
      data.images,
      data.image,
      data.image_url,
      data.imageUrl,
    ],
    url,
    8,
  );

  return {
    title,
    brand: brandFromTitle(title, brand || "Digikala"),
    category: categoryText || categoryFromTitle(`${title} ${fallbackCategory || ""}`),
    summary: description.slice(0, 180) || title,
    description,
    price,
    originalPrice: originalPrice > price ? originalPrice : undefined,
    imageUrls,
    imageUrl: imageUrls[0],
    stock: firstText(data.default_variant?.status, data.status).toLowerCase().includes("out") ? 0 : 5,
    specs: mergeExtractedSpecs(specs, technicalSpecsFromText(`${title} ${description}`)),
    externalSourceUrl: url,
    sourceHost,
    currency: "IRR",
  };
}

function digikalaRecordsFromJson(json: unknown): Record<string, unknown>[] {
  const directProducts = (json as any)?.data?.products;
  if (Array.isArray(directProducts)) {
    return directProducts.filter(
      (item): item is Record<string, unknown> => Boolean(item && typeof item === "object"),
    );
  }

  // پاسخ بعضی endpointهای قدیمی ساختار متفاوتی دارد؛ فقط در آن حالت
  // به جستجوی بازگشتی و پرهزینه در کل JSON برمی‌گردیم.
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

function formattedPricesFromText(value: string) {
  const normalized = toEnglishDigits(decodeHtml(value));
  const prices = [...normalized.matchAll(/\d{1,3}(?:[٬،٫,.]\d{3}){1,4}/g)]
    .map((match) => Number((match[0] || "").replace(/[٬،٫,.]/g, "")))
    .filter((price) => Number.isFinite(price) && price >= 100_000 && price <= 10_000_000_000);
  return [...new Set(prices)].sort((a, b) => a - b);
}

function htmlAttribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
  return decodeHtml(match?.[2] || "").trim();
}

function productTitleFromSlug(productUrl: string) {
  try {
    const path = decodeURIComponent(new URL(productUrl).pathname);
    const slug = path.split("/").filter(Boolean).at(-1) || "";
    return slug.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
  } catch {
    return "";
  }
}

function imageFromProductCard(cardHtml: string, nearbyHtml: string, pageUrl: string) {
  for (const match of cardHtml.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0] || "";
    const alt = htmlAttribute(tag, "alt");
    const src = htmlAttribute(tag, "src") || htmlAttribute(tag, "data-src");
    if (!src || /badge|logo|icon|svg/i.test(src)) continue;
    if (alt || /digikala-products|image\.torob\.com/i.test(src)) {
      const safe = safeImageUrl(src, pageUrl);
      if (safe) return safe.replace(/_\/(?:0x\d+|\d+x\d+)\.(?:jpg|webp)(?:\?.*)?$/i, "");
    }
  }
  const nearbyImages = [...nearbyHtml.matchAll(/https:\/\/(?:image\.torob\.com|dkstatics-public\.digikala\.com)\/[^\s"'<>\\]+/gi)];
  const raw = decodeHtml(nearbyImages.at(-1)?.[0] || "");
  return safeImageUrl(raw.replace(/_\/(?:0x\d+|\d+x\d+)\.(?:jpg|webp)(?:\?.*)?$/i, ""), pageUrl);
}

function titleFromProductCard(cardHtml: string, productUrl: string, source: "digikala" | "torob") {
  for (const heading of cardHtml.matchAll(/<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/gi)) {
    const title = stripTags(heading[1] || "");
    if (title.length >= 5) return title.slice(0, 180);
  }
  const altTitles = [...cardHtml.matchAll(/<img\b[^>]*>/gi)]
    .map((match) => htmlAttribute(match[0] || "", "alt"))
    .filter((title) => title.length >= 5 && !/فروش ویژه|badge|logo|icon/i.test(title))
    .map((title) => title.replace(/^تصویر\s+/, "").trim());
  if (altTitles.length) return altTitles.sort((a, b) => b.length - a.length)[0].slice(0, 180);

  const text = stripTags(cardHtml)
    .replace(/(?:کارکرده\s*)?(?:از\s*)?[\d۰-۹٠-٩][\d۰-۹٠-٩٬،٫,.\s]*\s*تومان[\s\S]*$/i, "")
    .replace(/تنها\s+\d+\s+عدد[\s\S]*$/i, "")
    .trim();
  if (text.length >= 5 && text.length <= 220) return text.slice(0, 180);
  const slugTitle = productTitleFromSlug(productUrl);
  return source === "torob" ? slugTitle.replace(/^p\s+/, "") : slugTitle;
}

function productCardDraftsFromHtml(
  html: string,
  pageUrl: string,
  source: "digikala" | "torob",
): ImportedStoreProductDraft[] {
  const sourceHost = source === "digikala" ? "digikala.com" : "torob.com";
  const linkPattern = source === "digikala" ? "\\/product\\/dkp-\\d+" : "\\/p\\/[a-f0-9-]+";
  const anchorPattern = new RegExp(
    `<a\\b([^>]*\\bhref=["']([^"']*${linkPattern}[^"']*)["'][^>]*)>([\\s\\S]*?)<\\/a>`,
    "gi",
  );
  const byUrl = new Map<string, ImportedStoreProductDraft>();
  for (const match of html.matchAll(anchorPattern)) {
    const rawHref = decodeHtml(match[2] || "");
    const cardHtml = match[3] || "";
    let productUrl = absoluteUrl(rawHref, pageUrl);
    if (!productUrl) continue;
    if (source === "digikala") {
      const canonical = new URL(productUrl);
      canonical.search = "";
      canonical.hash = "";
      productUrl = canonical.toString();
    }
    const cardText = stripTags(cardHtml);
    const prices = formattedPricesFromText(cardText);
    if (!prices.length) continue;
    const price = prices[0];
    const originalPrice = [...prices].reverse().find((value) => value > price * 1.03);
    const title = titleFromProductCard(cardHtml, productUrl, source);
    if (!title || title.length < 5) continue;
    const matchIndex = match.index || 0;
    const nearbyHtml = html.slice(Math.max(0, matchIndex - 3000), matchIndex + Math.min(3000, match[0].length));
    const imageUrl = imageFromProductCard(cardHtml, nearbyHtml, pageUrl);
    const draft: ImportedStoreProductDraft = {
      title,
      brand: brandFromTitle(title, source === "digikala" ? "Digikala" : "Torob"),
      category: categoryFromTitle(title),
      summary: title,
      description: title,
      price,
      originalPrice,
      imageUrls: imageUrl ? [imageUrl] : [],
      imageUrl: imageUrl || undefined,
      stock: /ناموجود|out of stock/i.test(cardText) ? 0 : 5,
      specs: { منبع: sourceHost },
      externalSourceUrl: productUrl,
      sourceHost,
      currency: "IRT",
    };
    const existing = byUrl.get(productUrl);
    byUrl.set(productUrl, existing ? chooseBetterDraft(existing, draft) : draft);
  }
  return [...byUrl.values()];
}

type EmallsProductLinkMatch = {
  url: string;
  firstIndex: number;
  lastIndex: number;
};

function emallsProductId(value: string) {
  return String(value || "").match(/~id~(\d+)/i)?.[1] || "";
}

function canonicalEmallsProductUrl(value: string, baseUrl = "https://emalls.ir/") {
  try {
    const url = new URL(decodeHtml(value), baseUrl);
    if (!/(^|\.)emalls\.ir$/i.test(url.hostname) || !emallsProductId(url.pathname)) return "";
    url.protocol = "https:";
    url.hostname = "emalls.ir";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function emallsProductLinksFromText(text: string, pageUrl: string) {
  const matches: Array<{ url: string; index: number }> = [];
  for (const match of text.matchAll(/\bhref\s*=\s*(["'])([^"']*~id~\d+[^"']*)\1/gi)) {
    const url = canonicalEmallsProductUrl(match[2] || "", pageUrl);
    if (url) matches.push({ url, index: match.index || 0 });
  }
  for (const match of text.matchAll(/\]\((https?:\/\/(?:www\.)?emalls\.ir\/[\s\S]*?~id~\d+)(?:\s+"[^"]*")?\)/gi)) {
    const url = canonicalEmallsProductUrl(match[1] || "", pageUrl);
    if (url) matches.push({ url, index: match.index || 0 });
  }
  matches.sort((a, b) => a.index - b.index);
  const grouped = new Map<string, EmallsProductLinkMatch>();
  for (const match of matches) {
    const existing = grouped.get(match.url);
    if (existing) existing.lastIndex = Math.max(existing.lastIndex, match.index);
    else grouped.set(match.url, { url: match.url, firstIndex: match.index, lastIndex: match.index });
  }
  return [...grouped.values()].sort((a, b) => a.firstIndex - b.firstIndex);
}

function cleanMarkdownLabel(value: string) {
  return decodeHtml(String(value || ""))
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#\\]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function emallsTitleFromUrl(productUrl: string) {
  try {
    const decodedPath = decodeURIComponent(new URL(productUrl).pathname);
    const raw = decodedPath
      .replace(/^\/+/, "")
      .replace(/^مشخصات_/i, "")
      .replace(/~id~\d+[\s\S]*$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return raw.slice(0, 180);
  } catch {
    return "";
  }
}

function emallsImagesFromText(text: string, productId: string, baseUrl: string) {
  if (!productId) return [];
  const values = [...text.matchAll(new RegExp(
    `https?:\\/\\/(?:files|service)\\.emalls\\.ir\\/[^\\s"'<>)]*\\/${productId}\\/[^\\s"'<>)]*`,
    "gi",
  ))].map((match) => (match[0] || "").replace(/\\+$/g, ""));
  return uniqueImageUrls(values, baseUrl, 8);
}

function emallsTitleFromSegment(segment: string, productUrl: string, productId: string) {
  const anchorTitles: string[] = [];
  for (const match of segment.matchAll(/<a\b[^>]*href\s*=\s*(["'])([^"']*~id~\d+[^"']*)\1[^>]*>([\s\S]*?)<\/a>/gi)) {
    if (canonicalEmallsProductUrl(match[2] || "", productUrl) !== productUrl) continue;
    const title = stripTags(match[3] || "").trim();
    if (title.length >= 5 && !/^\d+$/.test(toEnglishDigits(title))) anchorTitles.push(title);
  }
  for (const match of segment.matchAll(/\[([^\]]+)\]\((https?:\/\/(?:www\.)?emalls\.ir\/[\s\S]*?~id~\d+)(?:\s+"[^"]*")?\)/gi)) {
    if (canonicalEmallsProductUrl(match[2] || "", productUrl) !== productUrl) continue;
    const title = cleanMarkdownLabel(match[1] || "");
    if (title.length >= 5) anchorTitles.push(title);
  }
  const altTitles = [...segment.matchAll(/<img\b[^>]*>/gi)]
    .filter((match) => !productId || (match[0] || "").includes(`/${productId}/`))
    .map((match) => htmlAttribute(match[0] || "", "alt"))
    .filter((title) => title.length >= 5 && !/logo|loading|در حال بار/i.test(title));
  return [...anchorTitles, ...altTitles]
    .sort((a, b) => b.length - a.length)[0]
    ?.slice(0, 180) || emallsTitleFromUrl(productUrl);
}

/** Extract product cards from an Emalls list/search/category page (HTML or reader Markdown). */
export function extractEmallsListingDrafts(
  text: string,
  pageUrl: string,
  limit = 50,
): ImportedStoreProductDraft[] {
  const links = emallsProductLinksFromText(text, pageUrl);
  const drafts: ImportedStoreProductDraft[] = [];
  for (let index = 0; index < links.length && drafts.length < limit; index += 1) {
    const link = links[index];
    const nextStart = links[index + 1]?.firstIndex ?? Math.min(text.length, link.lastIndex + 5000);
    const segmentStart = Math.max(0, link.firstIndex - 1200);
    const segment = text.slice(segmentStart, nextStart);
    const afterProductLink = text.slice(link.lastIndex, nextStart);
    const productId = emallsProductId(link.url);
    const title = emallsTitleFromSegment(segment, link.url, productId);
    const prices = formattedPricesFromText(
      /<[^>]+>/.test(afterProductLink) ? stripTags(afterProductLink) : cleanMarkdownLabel(afterProductLink),
    );
    const price = prices[0] || 0;
    if (!title || title.length < 5 || price < 100_000) continue;
    const originalPrice = prices.find((value) => value > price * 1.03 && value <= price * 1.8);
    const imageUrls = emallsImagesFromText(segment, productId, pageUrl);
    const specs = technicalSpecsFromText(title);
    drafts.push({
      title,
      brand: brandFromTitle(title, "Emalls"),
      category: categoryFromTitle(title),
      summary: title,
      description: title,
      price,
      originalPrice,
      imageUrls,
      imageUrl: imageUrls[0],
      stock: 5,
      specs,
      externalSourceUrl: link.url,
      sourceHost: "emalls.ir",
      currency: "IRT",
    });
  }
  return uniqueDrafts(drafts).slice(0, limit);
}

function emallsReadableText(text: string) {
  return /<[^>]+>/.test(text)
    ? stripTags(text)
    : cleanMarkdownLabel(text).replace(/\s+/g, " ").trim();
}

function emallsPriceFromProductText(text: string) {
  const readable = emallsReadableText(text);
  const patterns = [
    /شروع\s*قیمت\s*از\s*([\d۰-۹٠-٩][\d۰-۹٠-٩,.٬،\s]{3,})/i,
    /ارزان.?ترین\s*فروشنده\s*([\d۰-۹٠-٩][\d۰-۹٠-٩,.٬،\s]{3,})/i,
    /ارزان.?ترین\s*([\d۰-۹٠-٩][\d۰-۹٠-٩,.٬،\s]{3,})/i,
    /قیمت\s*([\d۰-۹٠-٩][\d۰-۹٠-٩,.٬،\s]{3,})\s*تومان/i,
  ];
  for (const pattern of patterns) {
    const raw = readable.match(pattern)?.[1] || "";
    const price = normalizePriceToToman(raw, "IRT");
    if (price >= 100_000 && price <= 10_000_000_000) return price;
  }
  return 0;
}

function markdownSpecsFromEmalls(text: string) {
  const specs: Record<string, string> = {};
  const section = text.split(/##\s*مشخصات فنی/i)[1]?.split(/###\s*محصولات مشابه/i)[0] || "";
  const knownLabels = [
    "DirectX", "OpenGL", "ابعاد", "باس حافظه", "برند", "تعداد مانیتور قابل اتصال",
    "حداقل توان مورد نیاز PSU", "حداکثر رزولوشن", "درگاه", "درگاه ارتباطی",
    "فرکانس هسته گرافیکی", "کانکتور برق", "میزان حافظه", "نوع حافظه",
    "هسته های پردازشی CUDA", "پردازنده", "سوکت", "فرکانس", "ظرفیت", "رابط",
  ];
  for (const rawLine of section.split(/\n+/)) {
    const line = cleanMarkdownLabel(rawLine);
    if (!line || /^(?:مشخصات|مشاهده بیشتر|پیشنهاد ویژه)/.test(line)) continue;
    for (const label of knownLabels) {
      if (!line.toLowerCase().startsWith(label.toLowerCase())) continue;
      const value = line.slice(label.length).replace(/^\s*[:：-]?\s*/, "").trim();
      if (value) addCleanSpec(specs, label, value);
      break;
    }
  }
  return specs;
}

/** Extract one complete Emalls product page (HTML or reader Markdown). */
export function extractEmallsProductDraft(
  text: string,
  productUrl: string,
): ImportedStoreProductDraft | null {
  const productId = emallsProductId(productUrl);
  if (!productId) return null;
  const htmlTitle = /<[^>]+>/.test(text) ? titleFromHtml(text) : "";
  const markdownTitle = cleanMarkdownLabel(text.match(/^#\s+(.+)$/m)?.[1] || "");
  const title = (htmlTitle || markdownTitle || emallsTitleFromUrl(productUrl))
    .replace(/^قیمت و خرید\s+/i, "")
    .slice(0, 180)
    .trim();
  const price = emallsPriceFromProductText(text);
  if (!title || !price) return null;
  const imageUrls = emallsImagesFromText(text, productId, productUrl);
  const htmlSpecs = /<[^>]+>/.test(text) ? specsFromHtml(text) : markdownSpecsFromEmalls(text);
  const specs = mergeExtractedSpecs(htmlSpecs, technicalSpecsFromText(title));
  return {
    title,
    brand: brandFromTitle(title, "Emalls"),
    category: categoryFromTitle(title),
    summary: title,
    description: title,
    price,
    imageUrls,
    imageUrl: imageUrls[0],
    stock: 5,
    specs,
    externalSourceUrl: canonicalEmallsProductUrl(productUrl) || productUrl,
    sourceHost: "emalls.ir",
    currency: "IRT",
  };
}

async function fetchEmallsPageText(url: string) {
  let directError = "";
  try {
    const direct = await fetchText(url);
    if (direct.length >= 1000 && /(?:~id~\d+|files\.emalls\.ir|محصولات|قیمت)/i.test(direct)) return direct;
    directError = "پاسخ مستقیم ایمالز محتوای محصول نداشت";
  } catch (error) {
    directError = error instanceof Error ? error.message : "خطای دریافت مستقیم";
  }
  const target = new URL(url);
  const readerUrl = `https://r.jina.ai/http://emalls.ir${target.pathname}${target.search}`;
  try {
    const reader = await fetchText(readerUrl);
    if (reader.length >= 500) return reader;
  } catch (error) {
    const readerError = error instanceof Error ? error.message : "خطای واسط خواندن";
    throw new Error(`Emalls direct: ${directError}; reader: ${readerError}`);
  }
  throw new Error(`Emalls direct: ${directError}; reader: empty response`);
}

function emallsPageUrl(value: string, page: number) {
  const url = new URL(value);
  url.pathname = url.pathname.replace(/~page~\d+/i, "").replace(/~+$/, "");
  if (page > 1) url.pathname = `${url.pathname}~page~${page}`;
  return url.toString();
}

const emallsQueriesByCategory: Partial<Record<ProductImportCategoryKey, string[]>> = {
  laptop: ["لپ تاپ"],
  mobile: ["گوشی موبایل"],
  tablet: ["تبلت"],
  desktop: ["کامپیوتر آماده"],
  components: ["پردازنده کامپیوتر", "کارت گرافیک", "مادربرد", "رم کامپیوتر", "پاور کامپیوتر", "کیس کامپیوتر", "خنک کننده پردازنده"],
  storage: ["اس اس دی", "هارد دیسک"],
  accessories: ["لوازم جانبی کامپیوتر"],
  monitor: ["مانیتور"],
  gaming: ["تجهیزات گیمینگ"],
  console: ["کنسول بازی"],
  network: ["مودم روتر"],
  "office-machines": ["ماشین اداری"],
  printer: ["پرینتر"],
  camera: ["دوربین"],
  audio: ["هدفون اسپیکر"],
  "smart-watch": ["ساعت هوشمند"],
  server: ["سرور ورک استیشن"],
};

function emallsListingSources(sourceUrl: string, selectedCategories: ProductImportCategoryKey[]) {
  const source = new URL(sourceUrl);
  const directList = source.pathname !== "/" && !emallsProductId(source.pathname);
  if (directList) return [emallsPageUrl(source.toString(), 1)];
  const categories = selectedCategories.length
    ? selectedCategories
    : (["components", "storage", "laptop", "desktop", "monitor"] as ProductImportCategoryKey[]);
  const queries = categories.flatMap((category) => emallsQueriesByCategory[category] || []);
  const uniqueQueries = [...new Set(queries)].slice(0, 30);
  return uniqueQueries.map((query) =>
    new URL(`/لیست-قیمت~skey~${encodeURIComponent(query)}`, source.origin).toString(),
  );
}

async function scanEmallsRobot(
  sourceUrl: string,
  selectedCategories: ProductImportCategoryKey[],
  partFilters: string[],
  limit: number,
  warnings: string[],
) {
  if (emallsProductId(new URL(sourceUrl).pathname)) {
    try {
      const text = await fetchEmallsPageText(sourceUrl);
      const draft = extractEmallsProductDraft(text, sourceUrl);
      const accepted = draft &&
        (selectedCategories.length === 0 || productMatchesImportCategories(draft, selectedCategories)) &&
        productMatchesComputerPartFilters(draft, partFilters);
      return {
        drafts: accepted && draft ? [draft] : [],
        scannedUrls: [sourceUrl],
      };
    } catch (error) {
      warnings.push(`صفحه محصول ایمالز خوانده نشد: ${error instanceof Error ? error.message : "خطا"}`);
      return { drafts: [] as ImportedStoreProductDraft[], scannedUrls: [sourceUrl] };
    }
  }

  const sources = emallsListingSources(sourceUrl, selectedCategories);
  if (new URL(sourceUrl).pathname === "/") {
    warnings.push(`لینک اصلی ایمالز به ${sources.length.toLocaleString("fa-IR")} جستجوی کالایی مرتبط تبدیل شد.`);
  }
  const drafts: ImportedStoreProductDraft[] = [];
  const scannedUrls: string[] = [];
  const active = new Set(sources);
  const maxRequests = Math.min(50, Math.max(sources.length, Math.ceil(limit / 35) + 4));
  let requests = 0;

  for (let page = 1; active.size > 0 && requests < maxRequests && uniqueDrafts(drafts).length < limit; page += 1) {
    const currentSources = [...active];
    for (let offset = 0; offset < currentSources.length && requests < maxRequests; offset += 4) {
      const batchSources = currentSources.slice(offset, offset + Math.min(4, maxRequests - requests));
      const pageUrls = batchSources.map((source) => emallsPageUrl(source, page));
      requests += pageUrls.length;
      const results = await Promise.allSettled(pageUrls.map(fetchEmallsPageText));
      for (let index = 0; index < results.length; index += 1) {
        const source = batchSources[index];
        const pageUrl = pageUrls[index];
        scannedUrls.push(pageUrl);
        const result = results[index];
        if (result.status === "rejected") {
          active.delete(source);
          if (warnings.length < 12) warnings.push(`خواندن ${pageUrl} ناموفق بود: ${result.reason instanceof Error ? result.reason.message : "خطا"}`);
          continue;
        }
        const pageDrafts = extractEmallsListingDrafts(result.value, pageUrl, Math.max(1, limit - uniqueDrafts(drafts).length))
          .filter((draft) =>
            (selectedCategories.length === 0 || productMatchesImportCategories(draft, selectedCategories)) &&
            productMatchesComputerPartFilters(draft, partFilters),
          );
        if (!pageDrafts.length) {
          active.delete(source);
          continue;
        }
        drafts.push(...pageDrafts);
        if (uniqueDrafts(drafts).length >= limit) break;
      }
      if (uniqueDrafts(drafts).length >= limit) break;
    }
  }
  const products = uniqueDrafts(drafts).slice(0, limit);
  if (!products.length) warnings.push("از صفحه‌های ایمالز کارت محصول قیمت‌دار قابل استفاده‌ای استخراج نشد.");
  if (products.length < limit && requests >= maxRequests) {
    warnings.push(`در این نوبت ${products.length.toLocaleString("fa-IR")} محصول از ایمالز استخراج شد؛ برای حفظ پایداری Worker تعداد صفحه‌های خوانده‌شده به ${maxRequests.toLocaleString("fa-IR")} محدود بود.`);
  }
  return { drafts: products, scannedUrls };
}

async function fetchDigikalaApi(url: string) {
  const timeoutSignal =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? (AbortSignal as unknown as { timeout: (milliseconds: number) => AbortSignal }).timeout(15000)
      : undefined;
  const response = await fetch(url, {
    redirect: "manual",
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      accept: "application/json, text/plain, */*",
      "accept-language": "fa-IR,fa;q=0.9,en;q=0.6",
      "cache-control": "no-cache",
    },
    signal: timeoutSignal,
  });
  if (response.ok) {
    const text = await response.text();
    const result = parseJsonLoose(text);
    if (result) return result;
  }

  const target = new URL(url);
  const translateUrl = new URL(`https://api-digikala-com.translate.goog${target.pathname}${target.search}`);
  translateUrl.searchParams.set("_x_tr_sl", "auto");
  translateUrl.searchParams.set("_x_tr_tl", "en");
  translateUrl.searchParams.set("_x_tr_hl", "en");
  try {
    const translateResponse = await fetch(translateUrl.toString(), {
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; OptiBidCatalogReader/1.0)",
        accept: "application/json, text/plain, */*",
        "cache-control": "no-cache",
      },
      signal: timeoutSignal,
    });
    if (translateResponse.ok) {
      const translated = parseJsonLoose(await translateResponse.text());
      if (translated) return translated;
    }
  } catch {
    // Reader عمومی در ادامه به‌عنوان آخرین مسیر امتحان می‌شود.
  }

  // API دیجی‌کالا گاهی IPهای Cloudflare را به همان URL برمی‌گرداند. Reader عمومی
  // Jina درخواست را از شبکه‌ای جدا اجرا می‌کند و JSON خام را داخل Markdown Content می‌دهد.
  const readerUrl = `https://r.jina.ai/http://api.digikala.com${target.pathname}${target.search}`;
  const readerResponse = await fetch(readerUrl, {
    redirect: "follow",
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; OptiBidCatalogReader/1.0)",
      accept: "text/plain, text/markdown, */*",
      "cache-control": "no-cache",
    },
    signal: timeoutSignal,
  });
  if (!readerResponse.ok) {
    throw new Error(`Digikala HTTP ${response.status} / Reader HTTP ${readerResponse.status}`);
  }
  const readerText = await readerResponse.text();
  const jsonStart = readerText.indexOf("{");
  const jsonText = jsonStart >= 0 ? readerText.slice(jsonStart).trim() : readerText.trim();
  const readerResult = parseJsonLoose(jsonText);
  if (!readerResult) throw new Error("پاسخ واسط دیجی‌کالا JSON معتبر نبود.");
  return readerResult;
}

async function fetchDigikalaProductPageDraft(sourceUrl: string, sourceHost: string) {
  const productId = new URL(sourceUrl).pathname.match(/\/product\/dkp-(\d+)/i)?.[1] || "";
  if (!productId) return null;
  const apiUrl = `https://api.digikala.com/v2/product/${productId}/`;
  const payload = await fetchDigikalaApi(apiUrl) as Record<string, any>;
  const record = payload?.data?.product || payload?.product;
  if (!record || typeof record !== "object") return null;
  const draft = draftFromDigikalaRecord(record, sourceHost);
  if (!draft) return null;
  const canonicalUrl = new URL(sourceUrl);
  canonicalUrl.search = "";
  canonicalUrl.hash = "";
  return {
    draft: {
      ...draft,
      externalSourceUrl: canonicalUrl.toString(),
    },
    apiUrl,
  };
}

export async function fetchDigikalaCategoryPageDrafts(slug: string, page: number) {
  const safeSlug = String(slug || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  const safePage = Math.max(1, Math.min(500, Math.floor(Number(page || 1))));
  const apiUrl = `https://api.digikala.com/v1/categories/${safeSlug}/search/?page=${safePage}&sort=7`;
  const payload = await fetchDigikalaApi(apiUrl) as Record<string, any>;
  const records = digikalaRecordsFromJson(payload);
  const storageCategory = /(?:ssd|hard-drive)/.test(safeSlug);
  const fallbackCategory: ProductImportCategoryKey = storageCategory ? "storage" : "components";
  const partBySlug: Record<string, string> = {
    processor: "cpu",
    "graphics-card": "gpu",
    ram: "ram",
    motherboard: "motherboard",
    "internal-ssd": "ssd",
    "internal-hard-drive": "ssd",
    psu: "power",
    "computer-chassis": "case",
    "cooling-system": "cooler",
  };
  const products = records
    .map((record) => draftFromDigikalaRecord(record, "digikala.com", fallbackCategory))
    .filter((draft): draft is ImportedStoreProductDraft => Boolean(draft))
    .map((draft) => ({
      ...draft,
      specs: { ...draft.specs, "نوع قطعه": partBySlug[safeSlug] || "" },
    }));
  const pager = payload?.data?.pager || payload?.pager || {};
  const totalItems = Math.max(0, Math.floor(Number(pager.total_items || pager.total_count || 0)));
  const totalPages = Math.max(
    1,
    Math.floor(Number(pager.total_pages || pager.last_page || 0)),
    totalItems && records.length ? Math.ceil(totalItems / records.length) : 1,
  );
  return { products, totalPages, totalItems, apiUrl };
}

async function scanDigikalaRobot(
  sourceUrl: string,
  selectedCategories: ProductImportCategoryKey[],
  limit: number,
  warnings: string[],
  partFilters: string[] = [],
) {
  const parsedSource = new URL(sourceUrl);
  const sourceCategorySlug = parsedSource.pathname.match(/\/search\/category-([a-z0-9-]+)\/?/i)?.[1] || "";
  const slugParts: Record<string, string> = {
    processor: "cpu",
    "graphics-card": "gpu",
    ram: "ram",
    motherboard: "motherboard",
    "internal-ssd": "ssd",
    "internal-hard-drive": "ssd",
    psu: "power",
    "computer-chassis": "case",
  };
  const selectedPartSet = new Set(partFilters.map((item) => String(item).toLowerCase()));
  const broadSlugs = ["processor", "graphics-card", "ram", "motherboard", "internal-ssd", "internal-hard-drive", "psu", "computer-chassis"]
    .filter((slug) => selectedPartSet.size === 0 || selectedPartSet.has(slugParts[slug]));
  const categorySlugs = sourceCategorySlug && sourceCategorySlug !== "computer-devices"
    ? [sourceCategorySlug]
    : broadSlugs;
  const pageUrls = categorySlugs.map(
    (slug) => `https://www.digikala.com/search/category-${slug}/`,
  );
  const drafts: ImportedStoreProductDraft[] = [];
  const scannedUrls: string[] = [];

  // ابتدا API صفحه‌بندی‌شده را با sort صریح و redirect دستی امتحان می‌کنیم؛
  // این شکل درخواست از حلقهٔ redirect بعضی IPهای Cloudflare جلوگیری می‌کند.
  const endedApiSlugs = new Set<string>();
  const maxApiCalls = Math.min(40, Math.max(categorySlugs.length, Math.ceil(limit / 20) + categorySlugs.length));
  let apiCalls = 0;
  for (let page = 1; apiCalls < maxApiCalls && uniqueDrafts(drafts).length < limit; page += 1) {
    let attemptedOnPage = 0;
    for (const slug of categorySlugs) {
      if (apiCalls >= maxApiCalls || uniqueDrafts(drafts).length >= limit) break;
      if (endedApiSlugs.has(slug)) continue;
      attemptedOnPage += 1;
      apiCalls += 1;
      const apiUrl = `https://api.digikala.com/v1/categories/${slug}/search/?page=${page}&sort=7`;
      scannedUrls.push(apiUrl);
      try {
        const payload = await fetchDigikalaApi(apiUrl);
        const records = digikalaRecordsFromJson(payload);
        if (!records.length) {
          endedApiSlugs.add(slug);
          continue;
        }
        const fallbackCategory: ProductImportCategoryKey = /(?:ssd|hard-drive)/.test(slug)
          ? "storage"
          : "components";
        const pageDrafts = records
          .map((record) => draftFromDigikalaRecord(record, "digikala.com", fallbackCategory))
          .filter((draft): draft is ImportedStoreProductDraft => Boolean(draft))
          .filter((draft) =>
            (selectedCategories.length === 0 || productMatchesImportCategories(draft, selectedCategories)) &&
            productMatchesComputerPartFilters(draft, partFilters),
          );
        const before = uniqueDrafts(drafts).length;
        drafts.push(...pageDrafts);
        if (uniqueDrafts(drafts).length === before) endedApiSlugs.add(slug);
      } catch (error) {
        endedApiSlugs.add(slug);
        if (page === 1) {
          warnings.push(`API زیرگروه ${slug} در دسترس نبود: ${error instanceof Error ? error.message : "خطا"}`);
        }
      }
    }
    if (attemptedOnPage === 0) break;
  }

  // برای زیرگروه‌هایی که API آن‌ها بسته است، صفحهٔ SEO عمومی حداقل صفحه اول را می‌دهد.
  for (let index = 0; index < pageUrls.length && uniqueDrafts(drafts).length < limit; index += 1) {
    const pageUrl = pageUrls[index];
    scannedUrls.push(pageUrl);
    try {
      const html = await fetchDigikalaSeoHtml(pageUrl);
      const pageDrafts = productCardDraftsFromHtml(html, pageUrl, "digikala").filter(
        (draft) =>
          (selectedCategories.length === 0 || productMatchesImportCategories(draft, selectedCategories)) &&
          productMatchesComputerPartFilters(draft, partFilters),
      );
      drafts.push(...pageDrafts);
    } catch (error) {
      warnings.push(`زیرگروه ${(index + 1).toLocaleString("fa-IR")} دیجی‌کالا خوانده نشد: ${error instanceof Error ? error.message : "خطا"}`);
    }
  }

  const unique = uniqueDrafts(drafts).slice(0, limit);
  if (!unique.length && warnings.length === 0) {
    warnings.push("از صفحه‌های عمومی زیرگروه‌های دیجی‌کالا کارت قیمت‌دار قابل استفاده‌ای استخراج نشد.");
  }
  return { drafts: unique, scannedUrls };
}

async function scanTorobBrowseRobot(sourceUrl: string, limit: number, warnings: string[]) {
  const parsedSource = new URL(sourceUrl);
  const categoryId = parsedSource.pathname.match(/\/browse\/(\d+)/i)?.[1];
  if (!categoryId) return { drafts: [] as ImportedStoreProductDraft[], scannedUrls: [] as string[] };

  // API ترب روی IP ورکر پاسخ 490 می‌دهد؛ خود صفحهٔ عمومی دسته‌بندی SSR است و
  // با پارامتر page محصولات واقعی، تصویر و کمترین قیمت را برمی‌گرداند.
  const pageCount = Math.min(20, Math.max(1, Math.ceil(limit / 22)));
  const pageUrls = Array.from({ length: pageCount }, (_, index) => {
    if (index === 0) return sourceUrl;
    const pageUrl = new URL(sourceUrl);
    pageUrl.searchParams.set("page", String(index + 1));
    return pageUrl.toString();
  });
  const drafts: ImportedStoreProductDraft[] = [];
  const scannedUrls: string[] = [];

  for (let index = 0; index < pageUrls.length && uniqueDrafts(drafts).length < limit; index += 1) {
    const pageUrl = pageUrls[index];
    scannedUrls.push(pageUrl);
    try {
      const html = await fetchText(pageUrl);
      const pageDrafts = productCardDraftsFromHtml(html, pageUrl, "torob");
      if (!pageDrafts.length) {
        warnings.push(`صفحهٔ ${(index + 1).toLocaleString("fa-IR")} ترب کارت قیمت‌دار قابل تشخیص نداشت.`);
        if (index === 0) break;
        continue;
      }
      drafts.push(...pageDrafts);
    } catch (error) {
      warnings.push(`صفحهٔ ${(index + 1).toLocaleString("fa-IR")} ترب خوانده نشد: ${error instanceof Error ? error.message : "خطا"}`);
      if (index === 0) break;
    }
  }

  const unique = uniqueDrafts(drafts).slice(0, limit);
  if (!unique.length && warnings.length === 0) {
    warnings.push("از صفحه‌های عمومی ترب کارت قیمت‌دار قابل استفاده‌ای استخراج نشد.");
  }
  return { drafts: unique, scannedUrls };
}

export async function scanStoreProductsFromUrl(
  inputUrl: string,
  options: StoreProductImportScanOptions = {},
): Promise<StoreProductImportScanResult> {
  const sourceUrl = publicHttpUrl(inputUrl);
  const parsedSource = new URL(sourceUrl);
  const sourceHost = parsedSource.hostname.replace(/^www\./, "");
  const isDigikalaSource = /(^|\.)digikala\.com$/i.test(sourceHost) || /(^|\.)digikala\./i.test(sourceHost);
  const isTorobBrowseSource = /(^|\.)torob\.com$/i.test(sourceHost) && /\/browse\/\d+/i.test(parsedSource.pathname);
  const isEmallsSource = /(^|\.)emalls\.ir$/i.test(sourceHost);
  const specializedLimit = isEmallsSource ? 1000 : isDigikalaSource || isTorobBrowseSource ? 500 : 50;
  const defaultLimit = options.fullSite ? specializedLimit : 20;
  const limit = Math.max(1, Math.min(specializedLimit, Number(options.limit || defaultLimit)));
  const maxPages = Math.max(1, Math.min(100, Number(options.maxPages || Math.min(100, limit + 30))));
  const warnings: string[] = [];
  const scannedUrls: string[] = [];
  const allDrafts: ImportedStoreProductDraft[] = [];
  const selectedCategories = options.categoryFilters || [];
  const selectedPartFilters = options.partFilters || [];

  if (isEmallsSource) {
    const robot = await scanEmallsRobot(
      sourceUrl,
      selectedCategories,
      selectedPartFilters,
      limit,
      warnings,
    );
    scannedUrls.push(...robot.scannedUrls);
    return {
      sourceUrl,
      sourceHost,
      scannedUrls,
      products: robot.drafts,
      warnings,
    };
  }

  if (isTorobBrowseSource) {
    const robot = await scanTorobBrowseRobot(sourceUrl, limit, warnings);
    scannedUrls.push(...robot.scannedUrls);
    const filtered = robot.drafts.filter((draft) =>
      (selectedCategories.length === 0 || productMatchesImportCategories(draft, selectedCategories)) &&
      productMatchesComputerPartFilters(draft, selectedPartFilters),
    );
    if (filtered.length > 0) {
      return {
        sourceUrl,
        sourceHost,
        scannedUrls,
        products: uniqueDrafts(filtered).slice(0, limit),
        warnings,
      };
    }
    warnings.push("صفحه‌های عمومی دسته‌بندی ترب در این نوبت محصول قابل استفاده‌ای برنگرداندند.");
    return {
      sourceUrl,
      sourceHost,
      scannedUrls,
      products: [],
      warnings,
    };
  }

  const isDigikalaProductPage = /\/product\/dkp-/i.test(new URL(sourceUrl).pathname);
  if (isDigikalaSource && isDigikalaProductPage) {
    try {
      const detail = await fetchDigikalaProductPageDraft(sourceUrl, sourceHost);
      if (detail?.draft) {
        scannedUrls.push(sourceUrl, detail.apiUrl);
        const matchesCategory = selectedCategories.length === 0
          || productMatchesImportCategories(detail.draft, selectedCategories);
        const matchesPart = productMatchesComputerPartFilters(detail.draft, selectedPartFilters);
        return {
          sourceUrl,
          sourceHost,
          scannedUrls,
          products: matchesCategory && matchesPart ? [detail.draft] : [],
          warnings: matchesCategory && matchesPart
            ? warnings
            : [...warnings, "محصول استخراج شد اما با فیلتر دسته یا نوع قطعهٔ انتخاب‌شده مطابقت نداشت."],
        };
      }
      warnings.push("API جزئیات دیجی‌کالا دادهٔ قیمت‌دار نداد؛ خود صفحه بررسی شد.");
    } catch (error) {
      warnings.push(`خواندن جزئیات کامل دیجی‌کالا ناموفق بود و خود صفحه بررسی شد: ${error instanceof Error ? error.message : "خطا"}`);
    }
  }

  const shouldSearchDigikalaCategories =
    isDigikalaSource && !isDigikalaProductPage && (options.fullSite || selectedCategories.length > 0);

  if (shouldSearchDigikalaCategories) {
    try {
      const robot = await scanDigikalaRobot(sourceUrl, selectedCategories, limit, warnings, selectedPartFilters);
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
      warnings.push("صفحه‌های عمومی زیرگروه‌های دیجی‌کالا محصول قیمت‌دار قابل استفاده‌ای برنگرداندند.");
    } catch (error) {
      warnings.push(`ربات دیجی‌کالا اجرا نشد: ${error instanceof Error ? error.message : "خطا"}`);
    }
    return {
      sourceUrl,
      sourceHost,
      scannedUrls,
      products: [],
      warnings,
    };
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

  const products = uniqueDrafts(allDrafts)
    .filter((draft) => productMatchesComputerPartFilters(draft, selectedPartFilters))
    .slice(0, limit);
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
    marketPrice: draft.price,
    priceMultiplier: 1,
    originalPrice:
      draft.originalPrice &&
      draft.originalPrice > draft.price &&
      draft.originalPrice <= draft.price * 1.8
        ? draft.originalPrice
        : undefined,
    priceHistory: appendStorePriceHistory([], {
      recordedAt: now,
      price: draft.price,
      source: draft.sourceHost || "CSV",
      sourceUrl: draft.externalSourceUrl,
    }),
    imageUrls: uniqueImageUrls(
      [...(draft.imageUrls || []), draft.imageUrl],
      draft.externalSourceUrl,
      8,
    ),
    imageUrl: draft.imageUrl || draft.imageUrls?.[0],
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
