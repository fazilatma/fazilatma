import type { JsonStoreProduct } from "@/lib/json-store";
import { appendStorePriceHistory } from "@/lib/store-price-history";
import { technicalSpecsFromText } from "@/lib/store-product-specs";
import {
  normalizeStorePriceMultiplier,
  roundStorePrice,
  storedProductMarketPrice,
} from "@/lib/store-pricing";

export type LiveStoreProductComment = {
  id: string;
  userName: string;
  body: string;
  rate: number;
  createdAt: string;
  isBuyer: boolean;
};

export type LiveStoreProductSnapshot = {
  /** قیمت نهایی پس از اعمال ضریب فروشگاه. */
  price?: number;
  /** کمترین قیمت معتبر بازار پیش از اعمال ضریب. */
  marketPrice?: number;
  priceMultiplier?: number;
  originalPrice?: number;
  imageUrl?: string;
  brand?: string;
  specs?: Record<string, string>;
  description?: string;
  comments?: LiveStoreProductComment[];
  rating?: number;
  reviewsCount?: number;
  checkedAt: string;
};

type CachedSnapshot = {
  expiresAt: number;
  value: LiveStoreProductSnapshot | null;
};

const snapshotCache = new Map<string, CachedSnapshot>();
const cacheTtlMs = 5 * 60 * 1000;
const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
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

function formattedToman(value: string) {
  const number = Number(
    toEnglishDigits(value)
      .replace(/[٬،٫,.\s]/g, "")
      .replace(/[^0-9]/g, ""),
  );
  return Number.isFinite(number) && number >= 100_000 && number <= 1_500_000_000
    ? Math.round(number)
    : 0;
}

function firstTorobPrice(html: string) {
  const text = stripTags(html);
  const headerText = text.split(/فروشنده[‌\s]*ها/i)[0] || text;
  // بعضی مدل‌های هم‌نام به صفحه‌ای منتهی می‌شوند که فروشندهٔ آخر آن ناموجود است؛
  // قیمت چنین صفحه‌ای نباید جای قیمت فعال ذخیره‌شده را بگیرد.
  if (/مشاهده\s+در[\s\S]{0,160}?ناموجود[\s\S]{0,100}?آخرین\s+فروشنده/i.test(headerText)) return 0;
  if (/ناموجود/i.test(headerText) && !/ارزان[‌\s-]*ترین/i.test(headerText)) return 0;
  const priorityPatterns = [
    /تمام\s+ایران[\s\S]{0,160}?از\s+([\d۰-۹٠-٩][\d۰-۹٠-٩٬،٫,.\s]{4,})\s*تومان/i,
    /خرید\s+اینترنتی[\s\S]{0,160}?از\s+([\d۰-۹٠-٩][\d۰-۹٠-٩٬،٫,.\s]{4,})\s*تومان/i,
    /خرید\s+از[\s\S]{0,240}?([\d۰-۹٠-٩][\d۰-۹٠-٩٬،٫,.\s]{4,})\s*تومان[\s\S]{0,80}?ارزان[‌\s-]*ترین/i,
    /ارزان[‌\s-]*ترین[\s\S]{0,120}?([\d۰-۹٠-٩][\d۰-۹٠-٩٬،٫,.\s]{4,})\s*تومان/i,
    /از\s+([\d۰-۹٠-٩][\d۰-۹٠-٩٬،٫,.\s]{4,})\s*تومان/i,
    /([\d۰-۹٠-٩][\d۰-۹٠-٩٬،٫,.\s]{4,})\s*تومان/i,
  ];
  for (const pattern of priorityPatterns) {
    const price = formattedToman(text.match(pattern)?.[1] || "");
    if (price) return price;
  }
  return 0;
}

function strongModelTokens(value: string) {
  return toEnglishDigits(value)
    .toLowerCase()
    // فاصلهٔ بعد از شماره فقط وقتی همراه پسوند واقعی است مصرف شود؛ وگرنه
    // RTX 5080 16GB اشتباهاً به توکن rtx508016gb تبدیل می‌شود.
    .replace(/\b(rtx|gtx)\s*-?\s*(\d{3,4})(?:\s*(ti|super))?\b/g, (_, family, model, suffix) => `${family}${model}${suffix || ""}`)
    .replace(/\b(rx)\s*-?\s*(\d{3,4})(?:\s*(xtx|xt))?\b/g, (_, family, model, suffix) => `${family}${model}${suffix || ""}`)
    .replace(/\b(?:core\s*)?(i[3579])\s*-?\s*(\d{4,5}[a-z]{0,3})\b/g, "$1-$2")
    .replace(/\b(ryzen\s*[3579])\s*-?\s*(\d{4}[a-z0-9]*)\b/g, (_, family, model) => `${String(family).replace(/\s+/g, "")}-${model}`)
    .replace(/\b([a-z]*\d[a-z0-9]*)-(tray|box)\b/g, "$1 $2")
    .replace(/[^a-z0-9آ-ی-]+/g, " ")
    .split(/\s+/)
    .filter((token) => /[a-z]/.test(token) && /\d/.test(token) && token.length >= 4)
    .filter((token) => !/^\d+(?:gb|tb|w|mhz|rpm)$/.test(token))
    .filter((token) => !/^(?:gddr\d+x?|ddr\d|pcie\d*|sata\d*|usb\d*)$/.test(token));
}

function packageKind(value: string) {
  const normalized = toEnglishDigits(value).toLowerCase().replace(/[‌\s]+/g, " ");
  if (/\btray\b|بدون جعبه/.test(normalized)) return "tray";
  if (/\bbox\b|با جعبه/.test(normalized)) return "box";
  return "";
}

function capacityTokens(value: string) {
  const normalized = toEnglishDigits(value)
    .toLowerCase()
    .replace(/(\d+)\s*گیگابایت/g, "$1gb")
    .replace(/(\d+)\s*ترابایت/g, "$1tb");
  return [...normalized.matchAll(/\b(\d+(?:\.\d+)?)\s*(gb|tb)\b/g)]
    .map((match) => `${match[1]}${match[2]}`)
    .filter((token, index, items) => items.indexOf(token) === index);
}

function marketQualifierTokens(value: string) {
  const text = toEnglishDigits(value).toLowerCase();
  const qualifiers = ["dual", "tuf", "prime", "rog", "strix", "ventus", "gaming", "eagle", "pulse", "nitro", "aorus", "windforce", "v2"];
  const result = qualifiers.filter((token) => new RegExp(`\\b${token}\\b`, "i").test(text));
  if (/\boc\b|اورکلاک/.test(text)) result.push("oc");
  return result;
}

function marketVariantMatches(productTitle: string, candidateTitle: string) {
  const requiredTokens = strongModelTokens(productTitle).slice(0, 4);
  if (!requiredTokens.length) return false;
  const candidateTokens = new Set(strongModelTokens(candidateTitle));
  if (!requiredTokens.every((token) => candidateTokens.has(token))) return false;
  const requiredPackage = packageKind(productTitle);
  const candidatePackage = packageKind(candidateTitle);
  if (requiredPackage && candidatePackage && candidatePackage !== requiredPackage) return false;
  const requiredCapacities = capacityTokens(productTitle);
  const candidateCapacities = new Set(capacityTokens(candidateTitle));
  if (requiredCapacities.length && !requiredCapacities.every((token) => candidateCapacities.has(token))) return false;
  const requiredQualifiers = marketQualifierTokens(productTitle);
  const candidateQualifiers = new Set(marketQualifierTokens(candidateTitle));
  return requiredQualifiers.every((token) => candidateQualifiers.has(token));
}

function isDefectiveMarketListing(value: string) {
  return /خراب|معیوب|اوراق|برای تعمیر|قطعاتی|صفحه\s*سیاه|شطرنجی|کرش|بدون تصویر|no\s*display|defective|for\s*parts/i.test(value);
}

function marketBrandKey(value: string) {
  const text = String(value || "").toLowerCase();
  if (/\bxfx\b|ایکس\s*اف\s*ایکس/.test(text)) return "xfx";
  if (/sapphire|سافایر/.test(text)) return "sapphire";
  if (/\basus\b|ایسوس/.test(text)) return "asus";
  if (/\bmsi\b|ام\s*اس\s*آی/.test(text)) return "msi";
  if (/gigabyte|گیگابایت/.test(text)) return "gigabyte";
  if (/zotac|زوتک/.test(text)) return "zotac";
  if (/palit|پالیت/.test(text)) return "palit";
  if (/powercolor|پاورکالر/.test(text)) return "powercolor";
  if (/\bpny\b/.test(text)) return "pny";
  return "";
}

function torobComparablePrice(html: string, productTitle: string) {
  const requiredTokens = strongModelTokens(productTitle).slice(0, 4);
  if (!requiredTokens.length) return 0;
  const requiredPackage = packageKind(productTitle);
  const prices: number[] = [];
  const inspectCandidate = (value: string) => {
    const text = stripTags(value);
    const candidateTokens = new Set(strongModelTokens(text));
    if (!requiredTokens.every((token) => candidateTokens.has(token))) return;
    const candidatePackage = packageKind(text);
    if (requiredPackage && candidatePackage && candidatePackage !== requiredPackage) return;
    const rawPrice = text.match(/(?:از\s*)?([\d۰-۹٠-٩][\d۰-۹٠-٩٬،٫,.\s]{4,})\s*(?:تومان|tomans?)/i)?.[1] || "";
    const price = formattedToman(rawPrice);
    if (price) prices.push(price);
  };

  const anchorPattern = /<a\b[^>]*href=["'][^"']*\/p\/[^"']+["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(anchorPattern)) inspectCandidate(match[1] || "");

  // خروجی Jina و بعضی نسخه‌های SSR ترب Markdown یا کارت‌های چندتکه دارند؛ در آن‌ها
  // عنوان و قیمت الزاماً داخل یک تگ <a> نیست. اطراف هر قیمت را هم با مدل دقیق می‌سنجیم.
  const pricePattern = /[\d۰-۹٠-٩][\d۰-۹٠-٩٬،٫,.\s]{4,}\s*(?:تومان|tomans?)/gi;
  for (const match of html.matchAll(pricePattern)) {
    const index = match.index || 0;
    inspectCandidate(html.slice(Math.max(0, index - 500), Math.min(html.length, index + 160)));
  }
  return prices.length ? Math.min(...prices) : 0;
}

function torobComparableJsonPrice(
  payload: Record<string, any>,
  productTitle: string,
  requiredBrand = "",
) {
  if (!strongModelTokens(productTitle).length) return 0;
  const modernGpuRequiresNew = /\b(?:rtx|gtx)\s*\d{4}|\brx\s*[6-9]\d{3}/i.test(productTitle) && !/استوک|کارکرده|used/i.test(productTitle);
  const results = Array.isArray(payload?.results)
    ? payload.results
    : Array.isArray(payload?.data?.results)
      ? payload.data.results
      : [];
  const prices: number[] = [];
  for (const result of results) {
    const title = `${String(result?.name1 || "")} ${String(result?.name2 || "")}`.trim();
    if (isDefectiveMarketListing(title)) continue;
    if (requiredBrand && marketBrandKey(title) !== requiredBrand) continue;
    const listingIsUsed = /استوک|کارکرده|used/i.test(title) || String(result?.stock_status || "").trim().length > 0;
    if (modernGpuRequiresNew && listingIsUsed) continue;
    if (!marketVariantMatches(productTitle, title)) continue;
    const price = Math.round(Number(result?.price || 0));
    if (price >= 100_000 && price <= 1_500_000_000) prices.push(price);
  }
  return prices.length ? Math.min(...prices) : 0;
}

function torobImage(html: string, pageUrl: string) {
  const normalized = decodeHtml(html)
    .replace(/\\\//g, "/")
    .replace(/\\u002F/gi, "/")
    .replace(/\\"/g, '"');
  const matches = [
    ...normalized.matchAll(/https:\/\/image\.torob\.com\/[^\s"'<>\\]+/gi),
  ];
  for (const match of matches) {
    const raw = decodeHtml(match[0] || "")
      .replace(/_\/(?:\d+x\d+|0x\d+)\.(?:jpg|jpeg|webp|avif)(?:\?.*)?$/i, "");
    try {
      const url = new URL(raw, pageUrl);
      if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
    } catch {
      // Try the next image candidate.
    }
  }
  return "";
}

function digikalaPrice(html: string) {
  const normalized = html.replace(/\\"/g, '"');
  const sellingPrice = normalized.match(/"selling_price"\s*:\s*(\d{6,})/i)?.[1];
  const raw = Number(sellingPrice || 0);
  if (raw >= 1_000_000 && raw <= 15_000_000_000) return Math.round(raw / 10);
  const text = stripTags(html);
  const visible = text.match(/([\d۰-۹٠-٩][\d۰-۹٠-٩٬،٫,.\s]{4,})\s*(?:تومان|تومن)/i)?.[1] || "";
  return formattedToman(visible);
}

function digikalaImage(html: string, pageUrl: string) {
  const normalized = html.replace(/\\\//g, "/").replace(/\\"/g, '"');
  const matches = [
    ...normalized.matchAll(/https:\/\/dkstatics-public\.digikala\.com\/digikala-products\/[^\s"'<>\\]+/gi),
  ];
  for (const match of matches) {
    try {
      const url = new URL(decodeHtml(match[0] || ""), pageUrl);
      if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
    } catch {
      // Try the next image candidate.
    }
  }
  return "";
}

async function fetchDigikalaJson(url: string) {
  const timeoutSignal =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? (AbortSignal as unknown as { timeout: (milliseconds: number) => AbortSignal }).timeout(12000)
      : undefined;
  try {
    const direct = await fetch(url, {
      redirect: "manual",
      cache: "no-store",
      headers: { accept: "application/json, text/plain, */*" },
      signal: timeoutSignal,
    });
    if (direct.ok) return await direct.json() as Record<string, any>;
  } catch {
    // Google proxy below.
  }
  const target = new URL(url);
  const translated = new URL(`https://api-digikala-com.translate.goog${target.pathname}${target.search}`);
  translated.searchParams.set("_x_tr_sl", "auto");
  translated.searchParams.set("_x_tr_tl", "en");
  translated.searchParams.set("_x_tr_hl", "en");
  try {
    const response = await fetch(translated.toString(), {
      redirect: "follow",
      cache: "no-store",
      headers: { accept: "application/json, text/plain, */*" },
      signal: timeoutSignal,
    });
    if (response.ok) return await response.json() as Record<string, any>;
  } catch {
    // Reader عمومی در ادامه امتحان می‌شود.
  }

  const readerUrl = `https://r.jina.ai/http://api.digikala.com${target.pathname}${target.search}`;
  const readerResponse = await fetch(readerUrl, {
    redirect: "follow",
    cache: "no-store",
    headers: { accept: "text/plain, text/markdown, */*" },
    signal: timeoutSignal,
  });
  if (!readerResponse.ok) throw new Error(`Reader HTTP ${readerResponse.status}`);
  const text = await readerResponse.text();
  const jsonStart = text.indexOf("{");
  if (jsonStart < 0) throw new Error("پاسخ جزئیات کالا JSON نداشت.");
  return JSON.parse(text.slice(jsonStart).trim()) as Record<string, any>;
}

type CompactDigikalaPrice = {
  title: string;
  price: number;
  originalPrice: number;
};

function compactDigikalaPriceFromText(text: string): CompactDigikalaPrice | null {
  const titleLiteral = text.match(/"title_fa"\s*:\s*("(?:\\.|[^"\\])*")/)?.[1] || "";
  let title = "";
  try {
    title = titleLiteral ? String(JSON.parse(titleLiteral)) : "";
  } catch {
    title = "";
  }
  const variantIndex = text.indexOf('"default_variant"');
  if (!title || variantIndex < 0) return null;
  const variantText = text.slice(variantIndex, variantIndex + 32_000);
  const sellingRial = Number(
    variantText.match(/"price"\s*:\s*\{[\s\S]{0,12_000}?"selling_price"\s*:\s*(\d+)/)?.[1] || 0,
  );
  const rrpRial = Number(
    variantText.match(/"price"\s*:\s*\{[\s\S]{0,12_000}?"rrp_price"\s*:\s*(\d+)/)?.[1] || 0,
  );
  const price = Math.round(sellingRial / 10);
  const originalPrice = Math.round(rrpRial / 10);
  if (!Number.isFinite(price) || price < 100_000 || price > 1_500_000_000) return null;
  return {
    title,
    price,
    originalPrice: originalPrice > price && originalPrice <= price * 1.8 ? originalPrice : 0,
  };
}

async function readResponsePrefix(response: Response, maxBytes = 256_000) {
  if (!response.body) return (await response.text()).slice(0, maxBytes);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";
  try {
    while (received < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      text += decoder.decode(value, { stream: true });
      if (
        text.includes('"default_variant"') &&
        /"selling_price"\s*:\s*\d+/.test(text.slice(text.indexOf('"default_variant"')))
      ) break;
    }
    text += decoder.decode();
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return text.slice(0, maxBytes);
}

/** فقط عنوان و قیمت buy-box دیجی‌کالا را از ابتدای stream می‌خواند. */
async function fetchCompactDigikalaPrice(productId: string) {
  const path = `/v2/product/${productId}/`;
  const translated = new URL(`https://api-digikala-com.translate.goog${path}`);
  translated.searchParams.set("_x_tr_sl", "auto");
  translated.searchParams.set("_x_tr_tl", "en");
  translated.searchParams.set("_x_tr_hl", "en");
  const urls = [`https://api.digikala.com${path}`, translated.toString()];
  for (const url of urls) {
    const timeoutSignal =
      typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
        ? (AbortSignal as unknown as { timeout: (milliseconds: number) => AbortSignal }).timeout(10_000)
        : undefined;
    try {
      const response = await fetch(url, {
        redirect: "follow",
        cache: "no-store",
        headers: { accept: "application/json, text/plain, */*" },
        signal: timeoutSignal,
      });
      if (!response.ok) continue;
      const compact = compactDigikalaPriceFromText(await readResponsePrefix(response));
      if (compact) return compact;
    } catch {
      // پروکسی ترجمه در تلاش بعدی امتحان می‌شود.
    }
  }
  throw new Error("Digikala compact price unavailable");
}

async function fetchTorobSearchJson(productTitle: string) {
  const url = new URL("https://api-torob-com.translate.goog/v4/base-product/search/");
  url.searchParams.set("page", "0");
  url.searchParams.set("sort", "popularity");
  // پاسخ‌های بزرگ ترجمهٔ ترب روی Worker مصرف CPU/حافظه را بالا می‌برد؛ نتایج دقیق
  // معمولاً در رتبه‌های نخست هستند و ۱۲ کارت برای مقایسهٔ مدل کافی است.
  url.searchParams.set("size", "12");
  url.searchParams.set("q", productTitle);
  url.searchParams.set("_x_tr_sl", "auto");
  url.searchParams.set("_x_tr_tl", "en");
  url.searchParams.set("_x_tr_hl", "en");
  const timeoutSignal =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? (AbortSignal as unknown as { timeout: (milliseconds: number) => AbortSignal }).timeout(9000)
      : undefined;
  const response = await fetch(url.toString(), {
    redirect: "follow",
    cache: "no-store",
    headers: { accept: "application/json, text/plain, */*" },
    signal: timeoutSignal,
  });
  if (!response.ok) throw new Error(`Torob proxy HTTP ${response.status}`);
  return await response.json() as Record<string, any>;
}

function digikalaDetailSnapshot(payload: Record<string, any>) {
  const detail = payload?.data?.product || payload?.product || {};
  const specs: Record<string, string> = {};
  for (const group of Array.isArray(detail.specifications) ? detail.specifications : []) {
    for (const attribute of Array.isArray(group?.attributes) ? group.attributes : []) {
      const title = String(attribute?.title || "").trim();
      const value = (Array.isArray(attribute?.values) ? attribute.values : [attribute?.values])
        .map((item: unknown) => String(item || "").replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join("، ");
      if (title && value && Object.keys(specs).length < 36) specs[title.slice(0, 80)] = value.slice(0, 500);
    }
  }
  const description = String(
    detail?.review?.description ||
      detail?.expert_reviews?.description ||
      payload?.data?.seo?.description ||
      "",
  ).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const rawRate = Number(detail?.rating?.rate || 0);
  const rating = rawRate > 5 ? rawRate / 20 : rawRate;
  const sellingPrice = Math.round(Number(detail?.default_variant?.price?.selling_price || 0) / 10);
  const rrpPrice = Math.round(Number(detail?.default_variant?.price?.rrp_price || 0) / 10);
  return {
    specs,
    description: description.slice(0, 5000),
    rating: Number.isFinite(rating) && rating > 0 ? Math.min(5, rating) : undefined,
    reviewsCount: Math.max(0, Math.floor(Number(detail?.rating?.count || 0))),
    price: sellingPrice >= 100_000 && sellingPrice <= 1_500_000_000 ? sellingPrice : undefined,
    originalPrice: rrpPrice > sellingPrice && rrpPrice <= sellingPrice * 1.8 ? rrpPrice : undefined,
    brand: String(detail?.brand?.title_en || detail?.brand?.title_fa || detail?.data_layer?.brand || "").trim() || undefined,
  };
}

function digikalaComparablePrice(payload: Record<string, any>, productTitle: string) {
  if (!strongModelTokens(productTitle).length) return 0;
  const products = Array.isArray(payload?.data?.products)
    ? payload.data.products
    : Array.isArray(payload?.products)
      ? payload.products
      : [];
  const prices: number[] = [];
  for (const candidate of products) {
    const title = String(
      candidate?.title_fa || candidate?.title_en || candidate?.title || candidate?.name || "",
    ).trim();
    if (!marketVariantMatches(productTitle, title)) continue;
    const rawPrice = Number(
      candidate?.default_variant?.price?.selling_price ||
      candidate?.price?.selling_price ||
      candidate?.selling_price ||
      0,
    );
    const price = Math.round(rawPrice / 10);
    if (price >= 100_000 && price <= 1_500_000_000) prices.push(price);
  }
  return prices.length ? Math.min(...prices) : 0;
}

function digikalaComments(payload: Record<string, any>): LiveStoreProductComment[] {
  const comments = Array.isArray(payload?.data?.comments) ? payload.data.comments : [];
  return comments
    .map((comment: Record<string, any>) => ({
      id: String(comment.id || ""),
      userName: String(comment.user_name || "کاربر").trim() || "کاربر",
      body: String(comment.body || "").trim().slice(0, 1200),
      rate: Math.max(0, Math.min(5, Number(comment.rate || 0))),
      createdAt: String(comment.created_at || comment.relative_date || "").trim(),
      isBuyer: Boolean(comment.is_buyer),
    }))
    .filter((comment: LiveStoreProductComment) => comment.id && comment.body)
    .slice(0, 10);
}

async function fetchSourceHtml(url: string) {
  const timeoutSignal =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? (AbortSignal as unknown as { timeout: (milliseconds: number) => AbortSignal }).timeout(9000)
      : undefined;
  const response = await fetch(url, {
    redirect: "follow",
    cache: "no-store",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7",
    },
    signal: timeoutSignal,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function fetchTorobPublicPage(url: string) {
  const target = new URL(url);
  const translated = new URL(`https://torob-com.translate.goog${target.pathname}${target.search}`);
  translated.searchParams.set("_x_tr_sl", "fa");
  translated.searchParams.set("_x_tr_tl", "en");
  translated.searchParams.set("_x_tr_hl", "en");
  const usableTorobPayload = (value: string) => {
    if (!/(?:تومان|tomans?)/i.test(value) || !/\/p\//i.test(value)) {
      throw new Error("پاسخ ترب کارت قیمت‌دار نداشت.");
    }
    return value;
  };
  try {
    return await Promise.any([
      fetchSourceHtml(url).then(usableTorobPayload),
      fetchSourceHtml(translated.toString()).then(usableTorobPayload),
    ]);
  } catch {
    throw new Error("صفحه عمومی ترب قابل دریافت نبود.");
  }
}

function hasRecentVerifiedMarketPrice(product: JsonStoreProduct) {
  const verifiedAt = Date.parse(String(product.priceVerifiedAt || ""));
  return Number.isFinite(verifiedAt) && Date.now() - verifiedAt >= 0 && Date.now() - verifiedAt <= 6 * 60 * 60 * 1000;
}

export async function getLiveStoreProductPriceSnapshot(
  product: JsonStoreProduct,
  configuredPriceMultiplier?: number,
): Promise<LiveStoreProductSnapshot | null> {
  const sourceUrl = String(product.externalSourceUrl || "").trim();
  let parsed: URL | null = null;
  try {
    parsed = sourceUrl ? new URL(sourceUrl) : null;
  } catch {
    parsed = null;
  }
  const host = parsed?.hostname.replace(/^www\./i, "").toLowerCase() || "";
  const isTorobProduct = host === "torob.com" && /^\/p\//i.test(parsed?.pathname || "");
  const isDigikalaProduct = host === "digikala.com" && /\/product\/dkp-/i.test(parsed?.pathname || "");
  if (!isTorobProduct && !isDigikalaProduct && !strongModelTokens(product.title).length) return null;

  const priceMultiplier = normalizeStorePriceMultiplier(
    configuredPriceMultiplier ?? product.priceMultiplier,
    1,
  );
  const cacheKey = `price-only|${sourceUrl}|${product.title}|${priceMultiplier}`;
  const cached = snapshotCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    let extractedPrice = 0;
    let sourceOriginalPrice = 0;
    let sourcePrice = 0;
    const storedMarketPrice = storedProductMarketPrice(product);

    if (isDigikalaProduct) {
      const productId = parsed?.pathname.match(/\/product\/dkp-(\d+)/i)?.[1];
      if (!productId) return null;

      // ابتدا پاسخ سبک‌تر ترب خوانده می‌شود. اگر قیمت دقیق ترب از آخرین کف معتبر
      // کمتر شده باشد، همان به‌تنهایی کف جدید را ثابت می‌کند و دانلود/JSON.parse
      // پاسخ بسیار بزرگ جزئیات دیجی‌کالا فقط منابع Worker را هدر می‌دهد.
      let torobPrice = 0;
      try {
        const torobResult = await fetchTorobSearchJson(product.title);
        torobPrice = torobComparableJsonPrice(
          torobResult,
          product.title,
          marketBrandKey(`${product.brand} ${product.title} ${product.description}`),
        );
        if (torobPrice > 0) extractedPrice = torobPrice;
      } catch {
        // در ادامه دیجی‌کالا مستقلاً بررسی می‌شود.
      }

      const torobProvesCurrentMinimum =
        torobPrice > 0 &&
        storedMarketPrice > 0 &&
        torobPrice <= storedMarketPrice;

      if (!torobProvesCurrentMinimum) {
        let directDetailMatches = false;
        try {
          // پاسخ کامل جزئیات بعضی GPUها چند صد کیلوبایت است. فقط ابتدای stream تا
          // buy-box خوانده می‌شود تا مقایسهٔ قیمت باعث خطای CPU/حافظهٔ Worker نشود.
          const compactDetail = await fetchCompactDigikalaPrice(productId);
          if (marketVariantMatches(product.title, compactDetail.title)) {
            directDetailMatches = true;
            sourcePrice = compactDetail.price;
            sourceOriginalPrice = compactDetail.originalPrice;
            if (!extractedPrice || sourcePrice < extractedPrice) extractedPrice = sourcePrice;
          }
        } catch {
          // جستجوی دقیق دیجی‌کالا در ادامه مسیر جایگزین است.
        }

        if (!directDetailMatches || !sourcePrice) {
          try {
            const digikalaSearchResult = await fetchDigikalaJson(
              `https://api.digikala.com/v1/search/?q=${encodeURIComponent(product.title)}`,
            );
            const digikalaPriceValue = digikalaComparablePrice(digikalaSearchResult, product.title);
            if (digikalaPriceValue > 0 && (!extractedPrice || digikalaPriceValue < extractedPrice)) {
              extractedPrice = digikalaPriceValue;
            }
          } catch {
            // قیمت معتبر ترب همچنان قابل استفاده است.
          }
        }
      }
    } else if (isTorobProduct) {
      const [torobResult, digikalaResult] = await Promise.allSettled([
        fetchTorobSearchJson(product.title),
        fetchDigikalaJson(`https://api.digikala.com/v1/search/?q=${encodeURIComponent(product.title)}`),
      ]);
      if (torobResult.status === "fulfilled") {
        extractedPrice = torobComparableJsonPrice(
          torobResult.value,
          product.title,
          marketBrandKey(`${product.brand} ${product.title} ${product.description}`),
        );
      }
      if (digikalaResult.status === "fulfilled") {
        const digikalaPriceValue = digikalaComparablePrice(digikalaResult.value, product.title);
        if (digikalaPriceValue > 0 && (!extractedPrice || digikalaPriceValue < extractedPrice)) {
          extractedPrice = digikalaPriceValue;
        }
      }
    } else {
      // CSVها و ورودی‌های قدیمی ممکن است لینک مستقیم dkp یا /p/ نداشته باشند.
      // در این حالت نیز مدل دقیق به‌طور مستقل در هر دو مرجع جستجو می‌شود.
      const [torobResult, digikalaResult] = await Promise.allSettled([
        fetchTorobSearchJson(product.title),
        fetchDigikalaJson(`https://api.digikala.com/v1/search/?q=${encodeURIComponent(product.title)}`),
      ]);
      if (torobResult.status === "fulfilled") {
        extractedPrice = torobComparableJsonPrice(
          torobResult.value,
          product.title,
          marketBrandKey(`${product.brand} ${product.title} ${product.description}`),
        );
      }
      if (digikalaResult.status === "fulfilled") {
        const digikalaPriceValue = digikalaComparablePrice(digikalaResult.value, product.title);
        if (digikalaPriceValue > 0 && (!extractedPrice || digikalaPriceValue < extractedPrice)) {
          extractedPrice = digikalaPriceValue;
        }
      }
    }

    if (extractedPrice <= 0) {
      snapshotCache.set(cacheKey, { value: null, expiresAt: Date.now() + 60_000 });
      return null;
    }
    // اگر یک مرجع موقتاً پاسخ نداد، قیمت تأییدشدهٔ چند ساعت اخیر را بی‌دلیل
    // با قیمت بالاتر مرجع دیگر جایگزین نمی‌کنیم. دادهٔ صرفاً واردشده همچنان باید
    // حداقل ۸۵٪ قیمت جاری باشد؛ فقط قیمت زندهٔ تأییدشده بازهٔ ۵۵٪ دارد.
    const minimumPreviousRatio = hasRecentVerifiedMarketPrice(product) ? 0.55 : 0.85;
    if (
      storedMarketPrice > 0 &&
      storedMarketPrice < extractedPrice &&
      storedMarketPrice >= extractedPrice * minimumPreviousRatio
    ) {
      extractedPrice = storedMarketPrice;
    }
    const price = roundStorePrice(extractedPrice * priceMultiplier);
    const value: LiveStoreProductSnapshot = {
      price,
      marketPrice: extractedPrice,
      priceMultiplier,
      originalPrice:
        sourcePrice === extractedPrice && sourceOriginalPrice > sourcePrice
          ? roundStorePrice(sourceOriginalPrice * priceMultiplier)
          : undefined,
      checkedAt: new Date().toISOString(),
    };
    snapshotCache.set(cacheKey, { value, expiresAt: Date.now() + cacheTtlMs });
    return value;
  } catch {
    snapshotCache.set(cacheKey, { value: null, expiresAt: Date.now() + 60_000 });
    return null;
  }
}

export async function getLiveStoreProductSnapshot(
  product: JsonStoreProduct,
  configuredPriceMultiplier?: number,
): Promise<LiveStoreProductSnapshot | null> {
  const sourceUrl = String(product.externalSourceUrl || "").trim();
  if (!sourceUrl) return null;

  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  const isTorobProduct = host === "torob.com" && /^\/p\//i.test(parsed.pathname);
  const isDigikalaProduct = host === "digikala.com" && /\/product\/dkp-/i.test(parsed.pathname);
  if (!isTorobProduct && !isDigikalaProduct) return null;

  const priceMultiplier = normalizeStorePriceMultiplier(
    configuredPriceMultiplier ?? product.priceMultiplier,
    1,
  );
  const cacheKey = `${sourceUrl}|${product.title}|${priceMultiplier}`;
  const cached = snapshotCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const html = await (
      isTorobProduct ? fetchTorobPublicPage(sourceUrl) : fetchSourceHtml(sourceUrl)
    ).catch(() => "");
    let extractedPrice = html
      ? isTorobProduct ? firstTorobPrice(html) : digikalaPrice(html)
      : 0;
    let imageUrl = html
      ? isTorobProduct ? torobImage(html, sourceUrl) : digikalaImage(html, sourceUrl)
      : "";
    let detailData: ReturnType<typeof digikalaDetailSnapshot> | null = null;
    let comments: LiveStoreProductComment[] = [];
    let trustedCurrentPrice = extractedPrice > 0;

    if (isDigikalaProduct) {
      const productId = parsed.pathname.match(/\/product\/dkp-(\d+)/i)?.[1];
      if (productId) {
        const [detailResult, commentsResult, torobResult] = await Promise.allSettled([
          fetchDigikalaJson(`https://api.digikala.com/v2/product/${productId}/`),
          fetchDigikalaJson(`https://api.digikala.com/v1/product/${productId}/comments/?page=1`),
          fetchTorobPublicPage(`https://torob.com/search/?query=${encodeURIComponent(product.title)}`),
        ]);
        if (detailResult.status === "fulfilled") {
          detailData = digikalaDetailSnapshot(detailResult.value);
          if (detailData.price) {
            extractedPrice = detailData.price;
            trustedCurrentPrice = true;
          }
          if (!imageUrl) {
            const detail = detailResult.value?.data?.product;
            const rawImage = detail?.images?.main?.url?.[0] || detail?.images?.main?.webp_url?.[0];
            try { imageUrl = rawImage ? new URL(rawImage, sourceUrl).toString() : ""; } catch { imageUrl = ""; }
          }
        }
        if (commentsResult.status === "fulfilled") comments = digikalaComments(commentsResult.value);
        if (torobResult.status === "fulfilled") {
          const marketPrice = torobComparablePrice(torobResult.value, product.title);
          if (marketPrice > 0 && (!extractedPrice || marketPrice < extractedPrice)) {
            extractedPrice = marketPrice;
            trustedCurrentPrice = true;
          }
        }
      }
    }

    // اگر لینک اصلی محصول ترب است، دیجی‌کالا هم با مدل دقیق جستجو می‌شود تا
    // جهت مقایسه وابسته به منبع اولیهٔ محصول نباشد.
    if (isTorobProduct) {
      try {
        const digikalaSearch = await fetchDigikalaJson(
          `https://api.digikala.com/v1/search/?q=${encodeURIComponent(product.title)}`,
        );
        const digikalaMarketPrice = digikalaComparablePrice(digikalaSearch, product.title);
        if (digikalaMarketPrice > 0 && (!extractedPrice || digikalaMarketPrice < extractedPrice)) {
          extractedPrice = digikalaMarketPrice;
          trustedCurrentPrice = true;
        }
      } catch {
        // قیمت دقیق صفحهٔ ترب همچنان قابل استفاده است.
      }
    }

    const storedMarketPrice = storedProductMarketPrice(product);
    // قیمت ذخیره‌شده ممکن است کمترین قیمت معتبر مرجع دیگری (مثلاً CSV فروشگاه دیگر) باشد.
    // اختلاف منطقی حفظ می‌شود، اما دادهٔ خرابِ چندبرابر ارزان کنار گذاشته می‌شود.
    if (
      storedMarketPrice > 0 &&
      extractedPrice > storedMarketPrice &&
      storedMarketPrice >= extractedPrice * 0.45
    ) {
      extractedPrice = storedMarketPrice;
    }
    const priceIsSane =
      extractedPrice > 0 &&
      (trustedCurrentPrice || !storedMarketPrice || (
        extractedPrice >= storedMarketPrice * 0.4 && extractedPrice <= storedMarketPrice * 2.5
      ));
    const finalPrice = priceIsSane
      ? roundStorePrice(extractedPrice * priceMultiplier)
      : 0;
    const hasDetails = Boolean(detailData && (Object.keys(detailData.specs).length || detailData.description));
    const value = priceIsSane || imageUrl || hasDetails || comments.length
      ? {
          price: finalPrice || undefined,
          marketPrice: priceIsSane ? extractedPrice : undefined,
          priceMultiplier: priceIsSane ? priceMultiplier : undefined,
          originalPrice:
            priceIsSane && detailData?.price === extractedPrice && detailData.originalPrice
              ? roundStorePrice(detailData.originalPrice * priceMultiplier)
              : undefined,
          imageUrl: imageUrl || undefined,
          brand: detailData?.brand,
          specs: detailData?.specs,
          description: detailData?.description || undefined,
          comments,
          rating: detailData?.rating,
          reviewsCount: detailData?.reviewsCount,
          checkedAt: new Date().toISOString(),
        }
      : null;
    snapshotCache.set(cacheKey, { value, expiresAt: Date.now() + cacheTtlMs });
    return value;
  } catch {
    snapshotCache.set(cacheKey, { value: null, expiresAt: Date.now() + 60_000 });
    return null;
  }
}

function inferredProductDetails(product: JsonStoreProduct) {
  const raw = `${product.title} ${product.summary || ""}`;
  const text = toEnglishDigits(raw.replace(/[\u200c]/g, " "));
  const lower = text.toLowerCase();
  const specs: Record<string, string> = {
    ...technicalSpecsFromText(text),
  };
  if (product.brand && product.brand !== "OptiBid" && product.brand !== "Digikala") specs["برند"] = product.brand;

  const model = text.match(/مدل\s+(.+?)(?=\s+(?:ظرفیت|با\s|نوع\s|رابط|سوکت|حافظه)|$)/i)?.[1]?.trim();
  if (model && model.length <= 80) specs["مدل"] = model;
  const capacity = text.match(/(\d+(?:\.\d+)?)\s*(ترابایت|گیگابایت|tb|gb)/i);
  if (capacity && !specs["ظرفیت"]) specs["ظرفیت"] = `${capacity[1]} ${capacity[2]}`;
  const wattage = text.match(/(\d{3,4})\s*(?:وات|watt|w\b)/i)?.[1];
  if (wattage) specs["توان"] = `${wattage} وات`;
  const socket = text.match(/\b(?:LGA\s*\d{3,4}|AM[345]|TR[45]|sTRX4)\b/i)?.[0];
  if (socket) specs["سوکت"] = socket.toUpperCase().replace(/\s+/g, " ");
  const chipset = text.match(/\b(?:H|B|Z|X|A)\d{3}[A-Z0-9-]*\b/i)?.[0];
  if (chipset && /مادربرد|motherboard/i.test(text)) specs["چیپست"] = chipset.toUpperCase();
  const interfaceName = text.match(/\b(?:SATA(?:\s*III)?|PCIe(?:\s*[345](?:\.0)?)?|NVMe|USB\s*[23](?:\.\d)?)\b/i)?.[0];
  if (interfaceName) specs["رابط"] = interfaceName.toUpperCase().replace(/\s+/g, " ");
  const diskRpm = text.match(/(\d{4,5})\s*(?:RPM|دور در دقیقه)/i)?.[1];
  if (diskRpm) specs["سرعت چرخش"] = `${diskRpm} دور در دقیقه`;
  const formFactor = text.match(/(2\.5|3\.5)\s*(?:اینچ|inch)/i)?.[1];
  if (formFactor) specs["فرم فاکتور"] = `${formFactor} اینچ`;
  const memoryType = text.match(/\bGDDR[3567X]*\b/i)?.[0];
  if (memoryType) specs["نوع حافظه گرافیکی"] = memoryType.toUpperCase();
  const memoryAmount = text.match(/(\d{1,2})\s*GB/i)?.[1];
  if (memoryAmount && /گرافیک|rtx|gtx|radeon|gpu/i.test(text)) specs["حافظه گرافیکی"] = `${memoryAmount} GB`;

  let type = "قطعه کامپیوتر";
  if (/هارد|hard disk|hdd/i.test(lower)) {
    type = /اکسترنال|external/i.test(lower) ? "هارد اکسترنال" : "هارددیسک اینترنال";
    specs["نوع محصول"] = type;
    if (/purple|surveillance|نظارت/i.test(lower)) specs["کاربری"] = "ذخیره‌سازی سیستم‌های نظارتی";
  } else if (/ssd|nvme/i.test(lower)) type = "حافظه SSD";
  else if (/کارت گرافیک|rtx|gtx|radeon/i.test(lower)) type = "کارت گرافیک";
  else if (/پردازنده|cpu|ryzen|core i/i.test(lower)) type = "پردازنده";
  else if (/مادربرد|motherboard/i.test(lower)) type = "مادربرد";
  else if (/منبع تغذیه|پاور|power supply|psu/i.test(lower)) type = "منبع تغذیه";
  else if (/رم کامپیوتر|memory module/i.test(lower)) type = "حافظه RAM";
  specs["دسته محصول"] ||= type;

  const description = product.description && product.description !== product.title
    ? product.description
    : `${product.title} یک ${type} از برند ${product.brand || "معتبر"} است. مشخصات نمایش‌داده‌شده از عنوان، دسته‌بندی و داده‌های فنی قابل‌دریافت این مدل استخراج شده‌اند تا مقایسه و انتخاب دقیق‌تر انجام شود.`;
  return { specs, description };
}

export function applyLiveStoreProductSnapshot(
  product: JsonStoreProduct,
  snapshot: LiveStoreProductSnapshot | null,
): JsonStoreProduct {
  const inferred = inferredProductDetails(product);
  if (!snapshot) {
    return {
      ...product,
      specs: { ...inferred.specs, ...product.specs },
      description: inferred.description,
    };
  }
  const price = snapshot.price || product.price;
  const priceChanged = Boolean(snapshot.price && snapshot.price !== product.price);
  return {
    ...product,
    price,
    marketPrice: snapshot.marketPrice || product.marketPrice,
    priceMultiplier: snapshot.priceMultiplier || product.priceMultiplier,
    originalPrice:
      snapshot.originalPrice && snapshot.originalPrice > price
        ? snapshot.originalPrice
        : priceChanged
          ? undefined
          : product.originalPrice,
    imageUrl: snapshot.imageUrl || product.imageUrl,
    brand: snapshot.brand || product.brand,
    specs: {
      ...inferred.specs,
      ...product.specs,
      ...(snapshot.specs || {}),
      ...(snapshot.brand ? { "برند": snapshot.brand } : {}),
    },
    description: snapshot.description || inferred.description,
    rating: snapshot.rating || product.rating,
    reviewsCount: snapshot.reviewsCount || product.reviewsCount,
    priceUpdatedAt: snapshot.checkedAt.slice(0, 10),
    shippingNote: snapshot.price
      ? "قیمت هنگام نمایش دوباره بررسی شد"
      : product.shippingNote,
    priceHistory: snapshot.price
      ? appendStorePriceHistory(product.priceHistory, {
          recordedAt: snapshot.checkedAt,
          price,
          source: "بررسی زنده",
          sourceUrl: product.externalSourceUrl,
        })
      : product.priceHistory,
  };
}
