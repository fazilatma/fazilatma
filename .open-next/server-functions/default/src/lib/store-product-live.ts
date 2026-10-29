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
  /** نتیجه قطعی بررسی موجودی در صفحه دقیق مرجع. */
  available?: boolean;
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
  return Number.isFinite(number) && number >= 100_000 && number <= 10_000_000_000
    ? Math.round(number)
    : 0;
}

function torobPageExplicitlyUnavailable(html: string) {
  const text = stripTags(html);
  const headerText = text.split(/فروشنده[‌\s]*ها|sellers?/i)[0] || text;
  return /(?:ناموجود|unavailable|out\s+of\s+stock)[\s\S]{0,120}?(?:آخرین\s+فروشنده|last\s+seller)|(?:مشاهده\s+در|view\s+at)[\s\S]{0,160}?(?:ناموجود|unavailable|out\s+of\s+stock)/i.test(headerText);
}

export function firstTorobPrice(html: string) {
  const text = stripTags(html);
  const headerText = text.split(/فروشنده[‌\s]*ها/i)[0] || text;
  // بعضی مدل‌های هم‌نام به صفحه‌ای منتهی می‌شوند که فروشندهٔ آخر آن ناموجود است؛
  // قیمت چنین صفحه‌ای نباید جای قیمت فعال ذخیره‌شده را بگیرد.
  if (torobPageExplicitlyUnavailable(html)) return 0;
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
    // مدل‌های قدیمی GeForce با GT (نه GTX) نیز باید مستقل از خط‌تیرهٔ کد برد
    // شناسایی شوند؛ 2GD3 و 2GD5 سپس به‌عنوان توکن‌های متفاوت باقی می‌مانند.
    .replace(/\b(gt)\s*-?\s*(\d{3,4})\b/g, (_, family, model) => ` ${family}${model}`)
    .replace(/\b(gt\d{3,4})((?:-[a-z0-9]+)+)/g, (_, model, boardCode) => `${model} ${String(boardCode).replace(/-/g, " ")}`)
    .replace(/\b(?:core\s*)?(i[3579])\s*-?\s*(\d{4,5}[a-z]{0,3})\b/g, "$1-$2")
    .replace(/\b(ryzen\s*[3579])\s*-?\s*(\d{4}[a-z0-9]*)\b/g, (_, family, model) => `${String(family).replace(/\s+/g, "")}-${model}`)
    .replace(/\b([a-z]*\d[a-z0-9]*)-(tray|box)\b/g, "$1 $2")
    // بعضی عناوین وارداتی بدون فاصله نوشته شده‌اند: «مدلTX500».
    .replace(/([آ-ی])([a-z0-9])/gi, "$1 $2")
    .replace(/([a-z0-9])([آ-ی])/gi, "$1 $2")
    .replace(/[^a-z0-9آ-ی-]+/g, " ")
    .split(/\s+/)
    .filter((token) => /[a-z]/.test(token) && /\d/.test(token) && token.length >= 4)
    .filter((token) => !/^\d+(?:gb|tb|w|mhz|rpm)$/.test(token))
    .filter((token) => !/^(?:gddr\d+x?|ddr\d|pcie\d*|sata\d*|usb\d*|80plus(?:white|bronze|silver|gold|platinum|titanium)?)$/.test(token));
}

function normalizeDistinctiveToken(value: string) {
  // فروشگاه‌ها گاهی نام مدل را با حروف تکراری متفاوت ثبت می‌کنند؛ برای نمونه
  // SAPPHIRE در یک منبع و SAPHHIRE در منبع دیگر. حذف تکرار حروف فقط برای
  // تطبیق نام انجام می‌شود و عنوان اصلی محصول را تغییر نمی‌دهد.
  return value.replace(/([a-z])\1+/g, "$1");
}

function distinctiveNameTokens(value: string) {
  const generic = new Set([
    "card", "graphic", "graphics", "model", "holder", "support", "computer",
    "edition", "gaming", "with", "for", "the", "کارت", "گرافیک", "مدل",
  ]);
  return toEnglishDigits(value)
    .toLowerCase()
    .replace(/[^a-z0-9آ-ی]+/g, " ")
    .split(/\s+/)
    .map(normalizeDistinctiveToken)
    .filter((token) => token.length >= 4 && /[a-z]/.test(token) && !generic.has(token))
    .filter((token, index, items) => items.indexOf(token) === index)
    .slice(0, 3);
}

function persianModelTokens(value: string) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\s]+/g, " ");
  return [...normalized.matchAll(/مدل\s+([آ-ی]{3,})/g)]
    .map((match) => match[1] === "سیبلان" ? "سبلان" : match[1])
    .filter((token, index, items) => items.indexOf(token) === index)
    .slice(0, 2);
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

function marketModelTokenMatches(
  requiredToken: string,
  candidateTokens: Set<string>,
  productTitle: string,
  candidateTitle: string,
) {
  if (candidateTokens.has(requiredToken)) return true;
  const requiredBrand = marketBrandKey(productTitle);
  const candidateBrand = marketBrandKey(candidateTitle);
  // مدل پاور فاطر در دیجی‌کالا TX500 و در ترب/سایت رسمی TX500M نوشته شده است.
  // فقط برای برند فاطر و فقط پسوند M همین خانواده معادل در نظر گرفته می‌شود.
  if (requiredBrand === "fater" && candidateBrand === "fater") {
    const base = requiredToken.match(/^(tx\d{3,4})m?$/i)?.[1];
    if (base && [...candidateTokens].some((token) => token === base || token === `${base}m`)) return true;
  }
  return false;
}

export function marketVariantMatches(productTitle: string, candidateTitle: string) {
  const requiredTokens = strongModelTokens(productTitle).slice(0, 4);
  const requiredNameTokens = distinctiveNameTokens(productTitle);
  const requiredPersianModels = persianModelTokens(productTitle);
  if (!requiredTokens.length && !requiredNameTokens.length && !requiredPersianModels.length) return false;
  const requiredBrand = marketBrandKey(productTitle);
  const candidateBrand = marketBrandKey(candidateTitle);
  if (requiredBrand && candidateBrand !== requiredBrand) return false;
  const candidateTokens = new Set(strongModelTokens(candidateTitle));
  if (
    requiredTokens.length &&
    !requiredTokens.every((token) =>
      marketModelTokenMatches(token, candidateTokens, productTitle, candidateTitle),
    )
  ) return false;
  if (!requiredTokens.length) {
    const candidateNameTokens = new Set(distinctiveNameTokens(candidateTitle));
    if (!requiredNameTokens.every((token) => candidateNameTokens.has(token))) return false;
  }
  if (requiredPersianModels.length) {
    const candidatePersianModels = new Set(persianModelTokens(candidateTitle));
    if (!requiredPersianModels.every((token) => candidatePersianModels.has(token))) return false;
  }
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
  // Sapphire در این SSD نام مدل است، نه برند کارت گرافیک. برندهای محصول کامل
  // باید پیش از واژه‌هایی که هم برند و هم نام مدل هستند تشخیص داده شوند.
  if (/\bhyundai\b|هیوندای|هیوندا/.test(text)) return "hyundai";
  if (/\bfater\b|فاطر/.test(text)) return "fater";
  if (/\bsadata\b|سادیتا/.test(text)) return "sadata";
  if (/\bxfx\b|ایکس\s*اف\s*ایکس/.test(text)) return "xfx";
  if (/sapphire|saphhire|سافایر/.test(text)) return "sapphire";
  if (/\basus\b|ایسوس/.test(text)) return "asus";
  if (/\bmsi\b|ام\s*اس\s*آی/.test(text)) return "msi";
  if (/gigabyte|گیگابایت/.test(text)) return "gigabyte";
  if (/zotac|زوتاک|زوتک/.test(text)) return "zotac";
  if (/palit|پالیت/.test(text)) return "palit";
  if (/powercolor|پاورکالر/.test(text)) return "powercolor";
  if (/\bpny\b/.test(text)) return "pny";
  return "";
}

function torobComparablePrice(html: string, productTitle: string) {
  if (!strongModelTokens(productTitle).length && !distinctiveNameTokens(productTitle).length) return 0;
  const sourceRequiresNew = !/استوک|کارکرده|used/i.test(productTitle);
  const prices: number[] = [];
  const inspectCandidate = (value: string) => {
    const text = stripTags(value);
    if (isDefectiveMarketListing(text)) return;
    if (sourceRequiresNew && /استوک|کارکرده|used/i.test(text)) return;
    if (!marketVariantMatches(productTitle, text)) return;
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

function torobExactListingUnavailable(
  payload: Record<string, any>,
  productTitle: string,
  requiredBrand = "",
) {
  const sourceRequiresNew = !/استوک|کارکرده|used/i.test(productTitle);
  const results = Array.isArray(payload?.results)
    ? payload.results
    : Array.isArray(payload?.data?.results)
      ? payload.data.results
      : [];
  let exactUnavailable = false;
  for (const result of results) {
    const title = `${String(result?.name1 || "")} ${String(result?.name2 || "")}`.trim();
    if (isDefectiveMarketListing(title)) continue;
    if (requiredBrand && marketBrandKey(title) !== requiredBrand) continue;
    const listingIsUsed = /استوک|کارکرده|used/i.test(title) || String(result?.stock_status || "").trim().length > 0;
    if (sourceRequiresNew && listingIsUsed) continue;
    if (!marketVariantMatches(productTitle, title)) continue;
    const price = Math.round(Number(result?.price || 0));
    if (price >= 100_000) return false;
    if (
      String(result?.price_text_mode || "").toLowerCase() === "disabled" ||
      /ناموجود|unavailable|out\s+of\s+stock/i.test(String(result?.price_text || ""))
    ) exactUnavailable = true;
  }
  return exactUnavailable;
}

export function torobComparableJsonPrice(
  payload: Record<string, any>,
  productTitle: string,
  requiredBrand = "",
) {
  if (!strongModelTokens(productTitle).length && !distinctiveNameTokens(productTitle).length) return 0;
  // برای هر محصولی که خود عنوان آن کارکرده/استوک نیست، آگهی‌های کارکرده نباید
  // به‌عنوان کف قیمت کالای نو انتخاب شوند (این قاعده فقط مخصوص GPU نیست).
  const sourceRequiresNew = !/استوک|کارکرده|used/i.test(productTitle);
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
    if (sourceRequiresNew && listingIsUsed) continue;
    if (!marketVariantMatches(productTitle, title)) continue;
    const price = Math.round(Number(result?.price || 0));
    if (price >= 100_000 && price <= 10_000_000_000) prices.push(price);
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
  if (raw >= 1_000_000 && raw <= 100_000_000_000) return Math.round(raw / 10);
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

function verifiedCanonicalTorobProductUrls(productTitle: string) {
  const modelTokens = new Set(strongModelTokens(productTitle));
  const packageType = packageKind(productTitle);
  const urls: string[] = [];
  if (packageType === "tray" && modelTokens.has("i5-12400f")) {
    urls.push("https://torob.com/p/165eb750-39a4-400a-abd8-92e787188438/پردازنده-مرکزی-اینتل-مدل-core-i5-12400f-tray/");
  }
  if (packageType === "tray" && modelTokens.has("i3-12100f")) {
    urls.push("https://torob.com/p/a1a69157-6d00-41b6-ac31-4e0e04651861/پردازنده-کامپیوتر-اینتل-مدل-core-i3-12100f-alder-lake-tray/");
  }
  if (packageType === "tray" && modelTokens.has("i3-10105f")) {
    urls.push("https://torob.com/p/dcd67bb8-764c-4d8b-8930-09a14612ad0d/پردازنده-intel-core-i3-10105f-tray/");
  }
  const normalized = toEnglishDigits(productTitle).toLowerCase().replace(/[‌\s]+/g, " ");
  if (
    /hyundai|هیوندای|هیوندا/.test(normalized) &&
    /sapp?h+h?ire|sapphire|سافایر/.test(normalized) &&
    /(?:^|\s)480\s*(?:gb\b|گیگابایت)/.test(normalized)
  ) {
    urls.push("https://torob.com/p/24f8d88f-23a7-42a8-8949-9c0e17354c87/حافظه-اس-اس-دی-اینترنال-هیوندای-مدل-sapphire-ظرفیت-480-گیگابایت/");
  }
  if (/\bfater\b|فاطر/.test(normalized) && /\btx\s*-?\s*500m?\b/.test(normalized)) {
    urls.push("https://torob.com/p/d15472ff-8091-45c2-bae0-33599b108462/منبع-تغذیه-کامپیوتر-فاطر-مدل-tx500m-80-plus-gold-توان-500-وات/");
  }
  if (/\bfater\b|فاطر/.test(normalized) && /\bfp\s*-?\s*w400\b/.test(normalized)) {
    urls.push("https://torob.com/p/1c88f316-bf9b-4f0f-9497-dc443fe9004e/منبع-تغذیه-کامپیوتر-فاطر-مدل-fp-w400-توان-400-وات/");
  }
  if (/\bsadata\b|سادیتا/.test(normalized) && /مدل\s+س(?:ی)?بلان/.test(normalized)) {
    urls.push("https://torob.com/p/20885b4f-fba3-4a53-94d5-52d2989e84f9/کیس-کامپیوتر-سادیتا-مدل-سبلان/");
  }
  if (/\bsadata\b|سادیتا/.test(normalized) && /مدل\s+دماوند/.test(normalized)) {
    urls.push("https://torob.com/p/e0459a08-7ef3-4d49-a863-b9f28cf156c6/کیس-سادیتا-مدل-دماوند/");
  }
  return urls;
}

function verifiedCanonicalDigikalaProductIds(productTitle: string) {
  const normalized = toEnglishDigits(productTitle).toLowerCase().replace(/[‌\s]+/g, " ");
  const ids: string[] = [];
  // این مدل با چند رکورد هم‌نام وارد کاتالوگ شده است؛ 4947207 همان صفحهٔ دقیق
  // XFX RX 580 OC+ GTS 3X Black Edition 8GB است که باید در مقایسه بماند.
  if (
    /\brx\s*-?\s*580\b/.test(normalized) &&
    /\bgts\s*3x\b/.test(normalized) &&
    /black\s*edition/.test(normalized) &&
    /\b8\s*gb\b|8\s*گیگابایت/.test(normalized)
  ) ids.push("4947207");
  // صفحهٔ دقیق پایه نگهدارنده garli در دیجی‌کالا؛ عنوان این اکسسوری کد عددی ندارد
  // و برای بازیابی پایدار buy-box از شناسهٔ canonical استفاده می‌شود.
  if (/\bgarli\b/.test(normalized) && /نگهدارنده\s*کارت\s*گرافیک/.test(normalized)) {
    ids.push("19914634");
  }
  // دیجی‌کالا این مدل را با املای SAPHHIRE ثبت کرده، درحالی‌که ترب و کاتالوگ
  // SAPPHIRE می‌نویسند. شناسهٔ دقیق از حذف شدن قیمت جاری جلوگیری می‌کند.
  if (
    /hyundai|هیوندای|هیوندا/.test(normalized) &&
    /sapp?h+h?ire|sapphire|سافایر/.test(normalized) &&
    /(?:^|\s)480\s*(?:gb\b|گیگابایت)/.test(normalized)
  ) {
    ids.push("15425573");
  }
  if (/\bfater\b|فاطر/.test(normalized) && /\btx\s*-?\s*500m?\b/.test(normalized)) {
    ids.push("7985666");
  }
  if (/\bfater\b|فاطر/.test(normalized) && /\bfp\s*-?\s*w400\b/.test(normalized)) {
    ids.push("19097398");
  }
  if (/\bsadata\b|سادیتا/.test(normalized) && /مدل\s+دماوند/.test(normalized)) {
    ids.push("1035259");
  }
  return ids;
}

function torobProductUrlFromUrl(value: string) {
  try {
    const parsed = new URL(String(value || ""));
    if (!/(?:^|\.)torob\.com$/i.test(parsed.hostname) || !/^\/p\//i.test(parsed.pathname)) return "";
    parsed.protocol = "https:";
    parsed.hostname = "torob.com";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function digikalaProductIdFromUrl(value: string) {
  try {
    const parsed = new URL(String(value || ""));
    if (!/(?:^|\.)digikala\.com$/i.test(parsed.hostname)) return "";
    return parsed.pathname.match(/\/product\/dkp-(\d+)/i)?.[1]
      || parsed.pathname.match(/\/v\d+\/product\/(\d+)/i)?.[1]
      || "";
  } catch {
    return "";
  }
}

type CompactDigikalaPrice = {
  title: string;
  price: number;
  originalPrice: number;
};

type CompactDigikalaState = {
  title: string;
  price: CompactDigikalaPrice | null;
  unavailable: boolean;
};

function compactDigikalaTitleFromText(text: string) {
  const titleLiteral = text.match(/"title_fa"\s*:\s*("(?:\\.|[^"\\])*")/)?.[1] || "";
  try {
    return titleLiteral ? String(JSON.parse(titleLiteral)) : "";
  } catch {
    return "";
  }
}

function compactDigikalaStateFromText(text: string): CompactDigikalaState | null {
  const title = compactDigikalaTitleFromText(text);
  if (!title) return null;
  const price = compactDigikalaPriceFromText(text);
  const unavailable = !price && (
    /"status"\s*:\s*"(?:out_of_stock|inactive|unavailable)"/i.test(text) ||
    /"dimension20"\s*:\s*"out_of_stock"/i.test(text) ||
    /"default_variant"\s*:\s*null/i.test(text)
  );
  return { title, price, unavailable };
}

export function compactDigikalaPriceFromText(text: string): CompactDigikalaPrice | null {
  const title = compactDigikalaTitleFromText(text);
  const variantIndex = text.indexOf('"default_variant"');
  if (!title || variantIndex < 0) return null;
  const variantText = text.slice(variantIndex, variantIndex + 96_000);
  // اولین selling_price بعد از default_variant همان buy-box است؛ وابستگی به فاصلهٔ
  // دقیق شیء price باعث می‌شد بعضی پاسخ‌های ترجمه‌شده نادیده گرفته شوند.
  const sellingRial = Number(
    variantText.match(/"selling_price"\s*:\s*(\d+)/)?.[1] || 0,
  );
  const rrpRial = Number(
    variantText.match(/"rrp_price"\s*:\s*(\d+)/)?.[1] || 0,
  );
  const price = Math.round(sellingRial / 10);
  const originalPrice = Math.round(rrpRial / 10);
  if (!Number.isFinite(price) || price < 100_000 || price > 10_000_000_000) return null;
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

async function readResponseLimited(response: Response, maxBytes: number) {
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
    }
    text += decoder.decode();
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return text.slice(0, maxBytes);
}

export function compactDigikalaSearchPriceFromText(text: string, productTitle: string) {
  const productsIndex = text.indexOf('"products"');
  if (productsIndex < 0) return 0;
  const productText = text.slice(productsIndex);
  const titlePattern = /"title_fa"\s*:\s*("(?:\\.|[^"\\])*")/g;
  const prices: number[] = [];
  const titleMatches = [...productText.matchAll(titlePattern)];
  for (let index = 0; index < titleMatches.length; index += 1) {
    const match = titleMatches[index];
    let title = "";
    try {
      title = String(JSON.parse(match[1] || '""'));
    } catch {
      continue;
    }
    if (!marketVariantMatches(productTitle, title)) continue;
    const offset = match.index || 0;
    const nextOffset = titleMatches[index + 1]?.index ?? productText.length;
    // هر قیمت فقط باید از همان رکورد محصول خوانده شود. پنجرهٔ ثابت قبلی در
    // محصولات ناموجود از default_variant محصول بعدی استفاده می‌کرد.
    const recordText = productText.slice(offset, Math.min(nextOffset, offset + 96_000));
    const variantIndex = recordText.indexOf('"default_variant"');
    if (variantIndex < 0) continue;
    const variantText = recordText.slice(variantIndex, variantIndex + 40_000);
    const sellingRial = Number(
      variantText.match(/"price"\s*:\s*\{[\s\S]{0,16000}?"selling_price"\s*:\s*(\d+)/)?.[1] || 0,
    );
    const price = Math.round(sellingRial / 10);
    if (price >= 100_000 && price <= 10_000_000_000) prices.push(price);
  }
  return prices.length ? Math.min(...prices) : 0;
}

/** جستجوی دیجی‌کالا را بدون JSON.parse کل پاسخ بزرگ بررسی می‌کند. */
async function fetchCompactDigikalaSearchPrice(productTitle: string) {
  const direct = new URL("https://api.digikala.com/v1/search/");
  direct.searchParams.set("q", productTitle);
  // شناسهٔ ۲۰۸ فقط دستهٔ کارت گرافیک است؛ اعمال آن روی SSD/CPU باعث می‌شد
  // جستجو همیشه صفر شود و قیمت قدیمی در سایت باقی بماند.
  if (/کارت\s*گرافیک|\b(?:rtx|gtx|radeon\s*rx)\s*\d/i.test(productTitle)) {
    direct.searchParams.set("categories[0]", "208");
  }
  direct.searchParams.set("page", "1");
  const translated = new URL(`https://api-digikala-com.translate.goog${direct.pathname}${direct.search}`);
  translated.searchParams.set("_x_tr_sl", "auto");
  translated.searchParams.set("_x_tr_tl", "en");
  translated.searchParams.set("_x_tr_hl", "en");
  for (const url of [direct.toString(), translated.toString()]) {
    const timeoutSignal =
      typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
        ? (AbortSignal as unknown as { timeout: (milliseconds: number) => AbortSignal }).timeout(12_000)
        : undefined;
    try {
      const response = await fetch(url, {
        redirect: "follow",
        cache: "no-store",
        headers: { accept: "application/json, text/plain, */*" },
        signal: timeoutSignal,
      });
      if (!response.ok) continue;
      const price = compactDigikalaSearchPriceFromText(
        await readResponseLimited(response, 1_500_000),
        productTitle,
      );
      if (price > 0) return price;
    } catch {
      // پروکسی ترجمه در تلاش بعدی امتحان می‌شود.
    }
  }
  return 0;
}

/** عنوان، buy-box و وضعیت موجودی دیجی‌کالا را از ابتدای stream می‌خواند. */
async function fetchCompactDigikalaState(productId: string) {
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
      const state = compactDigikalaStateFromText(await readResponsePrefix(response));
      if (state && (state.price || state.unavailable)) return state;
    } catch {
      // پروکسی ترجمه در تلاش بعدی امتحان می‌شود.
    }
  }
  throw new Error("Digikala compact state unavailable");
}

async function fetchCompactDigikalaPrice(productId: string) {
  const state = await fetchCompactDigikalaState(productId);
  if (state.price) return state.price;
  throw new Error("Digikala compact price unavailable");
}

async function fetchTorobSearchJson(productTitle: string) {
  const direct = new URL("https://api.torob.com/v4/base-product/search/");
  direct.searchParams.set("page", "0");
  direct.searchParams.set("sort", "popularity");
  // پاسخ‌های بزرگ ترب مصرف CPU/حافظه را بالا می‌برند؛ نتیجهٔ مدل دقیق معمولاً در
  // هشت کارت نخست است. مستقیم و پروکسی ترجمه هم‌زمان امتحان می‌شوند تا بسته بودن
  // یکی از مسیرها باعث حفظ قیمت قدیمی نشود.
  direct.searchParams.set("size", "8");
  direct.searchParams.set("q", productTitle);
  const translated = new URL(`https://api-torob-com.translate.goog${direct.pathname}${direct.search}`);
  translated.searchParams.set("_x_tr_sl", "auto");
  translated.searchParams.set("_x_tr_tl", "en");
  translated.searchParams.set("_x_tr_hl", "en");
  const requestJson = async (url: string) => {
    const timeoutSignal =
      typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
        ? (AbortSignal as unknown as { timeout: (milliseconds: number) => AbortSignal }).timeout(9000)
        : undefined;
    const response = await fetch(url, {
      redirect: "follow",
      cache: "no-store",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; OptiBidPriceReader/1.0)",
        accept: "application/json, text/plain, */*",
      },
      signal: timeoutSignal,
    });
    if (!response.ok) throw new Error(`Torob HTTP ${response.status}`);
    const payload = await response.json() as Record<string, any>;
    if (!Array.isArray(payload?.results) && !Array.isArray(payload?.data?.results)) {
      throw new Error("Torob response has no results");
    }
    return payload;
  };
  const [directResult, translatedResult] = await Promise.allSettled([
    requestJson(direct.toString()),
    requestJson(translated.toString()),
  ]);
  // پاسخ مستقیم فارسی برای تطبیق مدل‌های فارسی (دماوند، سبلان و...) اولویت دارد؛
  // Promise.any ممکن بود پروکسی ترجمه را زودتر انتخاب و نام مدل فارسی را حذف کند.
  if (directResult.status === "fulfilled") return directResult.value;
  if (translatedResult.status === "fulfilled") return translatedResult.value;
  throw new Error("Torob search unavailable");
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
    price: sellingPrice >= 100_000 && sellingPrice <= 10_000_000_000 ? sellingPrice : undefined,
    originalPrice: rrpPrice > sellingPrice && rrpPrice <= sellingPrice * 1.8 ? rrpPrice : undefined,
    brand: String(detail?.brand?.title_en || detail?.brand?.title_fa || detail?.data_layer?.brand || "").trim() || undefined,
  };
}

function digikalaComparablePrice(payload: Record<string, any>, productTitle: string) {
  if (!strongModelTokens(productTitle).length && !distinctiveNameTokens(productTitle).length) return 0;
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
    if (price >= 100_000 && price <= 10_000_000_000) prices.push(price);
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
    const hasPrice = /(?:تومان|tomans?)/i.test(value);
    const explicitlyUnavailable = torobPageExplicitlyUnavailable(value);
    if ((!hasPrice && !explicitlyUnavailable) || !/\/p\//i.test(value)) {
      throw new Error("پاسخ ترب وضعیت قیمت معتبری نداشت.");
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
  additionalSourceUrls: string[] = [],
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
  if (
    !isTorobProduct &&
    !isDigikalaProduct &&
    !strongModelTokens(product.title).length &&
    !distinctiveNameTokens(product.title).length &&
    !persianModelTokens(product.title).length
  ) return null;

  const priceMultiplier = normalizeStorePriceMultiplier(
    configuredPriceMultiplier ?? product.priceMultiplier,
    1,
  );
  const extraSourceKey = additionalSourceUrls.slice(0, 3).sort().join("|");
  const cacheKey = `price-only|${sourceUrl}|${extraSourceKey}|${product.title}|${priceMultiplier}`;
  const cached = snapshotCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    let extractedPrice = 0;
    let sourceOriginalPrice = 0;
    let sourcePrice = 0;
    let torobCurrentPrice = 0;
    let digikalaCurrentPrice = 0;
    let authoritativeUnavailable = false;
    let torobAuthoritativeUnavailable = false;
    let digikalaAuthoritativeUnavailable = false;
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
        const requiredBrand = marketBrandKey(`${product.brand} ${product.title} ${product.description}`);
        torobPrice = torobComparableJsonPrice(
          torobResult,
          product.title,
          requiredBrand,
        );
        if (torobPrice <= 0 && torobExactListingUnavailable(torobResult, product.title, requiredBrand)) {
          torobAuthoritativeUnavailable = true;
          authoritativeUnavailable = true;
        }
        if (torobPrice > 0) {
          torobCurrentPrice = torobPrice;
          extractedPrice = torobPrice;
        }
      } catch {
        // در ادامه دیجی‌کالا مستقلاً بررسی می‌شود.
      }

      const torobProvesCurrentMinimum =
        torobPrice > 0 &&
        storedMarketPrice > 0 &&
        torobPrice <= storedMarketPrice;

      if (!torobProvesCurrentMinimum) {
        try {
          // پاسخ کامل جزئیات بعضی GPUها چند صد کیلوبایت است. فقط ابتدای stream تا
          // buy-box خوانده می‌شود تا مقایسهٔ قیمت باعث خطای CPU/حافظهٔ Worker نشود.
          const compactState = await fetchCompactDigikalaState(productId);
          if (marketVariantMatches(product.title, compactState.title)) {
            if (compactState.price) {
              sourcePrice = compactState.price.price;
              digikalaCurrentPrice = compactState.price.price;
              sourceOriginalPrice = compactState.price.originalPrice;
              if (!extractedPrice || sourcePrice < extractedPrice) extractedPrice = sourcePrice;
            } else if (compactState.unavailable) {
              digikalaAuthoritativeUnavailable = true;
              authoritativeUnavailable = true;
            }
          }
        } catch {
          // جستجوی دقیق دیجی‌کالا در ادامه مسیر جایگزین است.
        }

        // واردات چندمرحله‌ای ممکن است برای یک عنوان دقیق چند لینک dkp نگه دارد.
        // همهٔ لینک‌های همان عنوان بررسی می‌شوند تا قیمت ارزان‌ترِ شناسهٔ تکراری جا نماند.
        const extraProductIds = Array.from(new Set([
          ...additionalSourceUrls.map(digikalaProductIdFromUrl).filter(Boolean),
          ...verifiedCanonicalDigikalaProductIds(product.title),
        ])).filter((id) => id !== productId).slice(0, 3);
        for (const extraProductId of extraProductIds) {
          try {
            const extraDetail = await fetchCompactDigikalaPrice(extraProductId);
            if (
              marketVariantMatches(product.title, extraDetail.title) &&
              (!extractedPrice || extraDetail.price < extractedPrice)
            ) {
              extractedPrice = extraDetail.price;
              sourcePrice = extraDetail.price;
              digikalaCurrentPrice = extraDetail.price;
              sourceOriginalPrice = extraDetail.originalPrice;
            }
          } catch {
            // لینک اصلی و ترب همچنان قابل استفاده‌اند.
          }
        }

        // ممکن است یک مدل دقیق با چند شناسهٔ dkp ثبت شده باشد؛ کمترین buy-box همهٔ
        // نتایج دقیق صفحهٔ اول نیز به‌صورت stream بررسی می‌شود (بدون parse پاسخ عظیم).
        const digikalaSearchPrice = await fetchCompactDigikalaSearchPrice(product.title);
        if (digikalaSearchPrice > 0) {
          digikalaCurrentPrice = !digikalaCurrentPrice
            ? digikalaSearchPrice
            : Math.min(digikalaCurrentPrice, digikalaSearchPrice);
          if (!extractedPrice || digikalaSearchPrice < extractedPrice) extractedPrice = digikalaSearchPrice;
        }
      }
    } else if (isTorobProduct) {
      const [torobResult, digikalaResult] = await Promise.allSettled([
        fetchTorobSearchJson(product.title),
        fetchCompactDigikalaSearchPrice(product.title),
      ]);
      if (torobResult.status === "fulfilled") {
        const requiredBrand = marketBrandKey(`${product.brand} ${product.title} ${product.description}`);
        torobCurrentPrice = torobComparableJsonPrice(
          torobResult.value,
          product.title,
          requiredBrand,
        );
        if (torobCurrentPrice <= 0 && torobExactListingUnavailable(torobResult.value, product.title, requiredBrand)) {
          torobAuthoritativeUnavailable = true;
          authoritativeUnavailable = true;
        }
        extractedPrice = torobCurrentPrice;
      }
      if (digikalaResult.status === "fulfilled" && digikalaResult.value > 0) {
        digikalaCurrentPrice = digikalaResult.value;
        if (!extractedPrice || digikalaResult.value < extractedPrice) extractedPrice = digikalaResult.value;
      }
    } else {
      // CSVها و ورودی‌های قدیمی ممکن است لینک مستقیم dkp یا /p/ نداشته باشند.
      // جستجوی دیجی‌کالا به‌صورت stream خوانده می‌شود تا JSON بزرگ کل Worker را
      // به خطای 1102 نبرد؛ ترب نیز فقط هشت نتیجهٔ نخست را برمی‌گرداند.
      const [torobResult, digikalaResult] = await Promise.allSettled([
        fetchTorobSearchJson(product.title),
        fetchCompactDigikalaSearchPrice(product.title),
      ]);
      if (torobResult.status === "fulfilled") {
        const requiredBrand = marketBrandKey(`${product.brand} ${product.title} ${product.description}`);
        torobCurrentPrice = torobComparableJsonPrice(
          torobResult.value,
          product.title,
          requiredBrand,
        );
        if (torobCurrentPrice <= 0 && torobExactListingUnavailable(torobResult.value, product.title, requiredBrand)) {
          torobAuthoritativeUnavailable = true;
          authoritativeUnavailable = true;
        }
        extractedPrice = torobCurrentPrice;
      }
      if (digikalaResult.status === "fulfilled" && digikalaResult.value > 0) {
        digikalaCurrentPrice = digikalaResult.value;
        if (!extractedPrice || digikalaResult.value < extractedPrice) extractedPrice = digikalaResult.value;
      }
    }

    // لینک مستقیم دقیق ترب (لینک اصلی، لینک رکورد تکراری و canonicalهای تأییدشده)
    // مسیر پشتیبان جستجوی API است. فقط وقتی جستجو قیمت دقیق نداده باشد صفحهٔ
    // عمومی خوانده می‌شود تا تعداد درخواست و احتمال خطای 1102 پایین بماند.
    const exactTorobUrls = Array.from(new Set([
      torobProductUrlFromUrl(sourceUrl),
      ...additionalSourceUrls.map(torobProductUrlFromUrl),
      ...verifiedCanonicalTorobProductUrls(product.title),
    ].filter(Boolean))).slice(0, 4);
    if (torobCurrentPrice <= 0) {
      for (const exactTorobUrl of exactTorobUrls) {
        try {
          const exactTorobPage = await fetchTorobPublicPage(exactTorobUrl);
          const exactTorobPrice = firstTorobPrice(exactTorobPage);
          if (exactTorobPrice > 0) {
            torobCurrentPrice = !torobCurrentPrice
              ? exactTorobPrice
              : Math.min(torobCurrentPrice, exactTorobPrice);
            if (!extractedPrice || exactTorobPrice < extractedPrice) extractedPrice = exactTorobPrice;
          } else if (torobPageExplicitlyUnavailable(exactTorobPage)) {
            torobAuthoritativeUnavailable = true;
            authoritativeUnavailable = true;
          }
        } catch {
          // سایر مراجع معتبر همچنان قابل استفاده‌اند.
        }
      }
    }

    // لینک‌های مستقیم دیجی‌کالا و رکوردهای canonical مستقل از منبع اولیه بررسی
    // می‌شوند. در صورت موفق بودن جستجوی stream، درخواست تکراری حذف می‌شود.
    const exactDigikalaIds = Array.from(new Set([
      digikalaProductIdFromUrl(sourceUrl),
      ...additionalSourceUrls.map(digikalaProductIdFromUrl),
      ...verifiedCanonicalDigikalaProductIds(product.title),
    ].filter(Boolean))).slice(0, 4);
    if (exactDigikalaIds.length > 0) {
      for (const exactProductId of exactDigikalaIds) {
        try {
          const exactState = await fetchCompactDigikalaState(exactProductId);
          if (marketVariantMatches(product.title, exactState.title)) {
            if (exactState.price) {
              digikalaCurrentPrice = !digikalaCurrentPrice
                ? exactState.price.price
                : Math.min(digikalaCurrentPrice, exactState.price.price);
              if (!extractedPrice || exactState.price.price < extractedPrice) {
                extractedPrice = exactState.price.price;
                sourcePrice = exactState.price.price;
                sourceOriginalPrice = exactState.price.originalPrice;
              }
            } else if (exactState.unavailable) {
              digikalaAuthoritativeUnavailable = true;
              authoritativeUnavailable = true;
            }
          }
        } catch {
          // سایر مراجع معتبر همچنان قابل استفاده‌اند.
        }
      }
    }

    // وقتی صفحهٔ دقیق دیجی‌کالا و نتیجهٔ دقیق ترب هر دو ناموجودند، قیمت احتمالی
    // جستجوی عمومی/رکورد تکراری نباید قیمت تاریخی این شناسه را فعال نگه دارد.
    if (
      (digikalaAuthoritativeUnavailable && torobCurrentPrice <= 0) ||
      (torobAuthoritativeUnavailable && digikalaCurrentPrice <= 0)
    ) {
      extractedPrice = 0;
      authoritativeUnavailable = true;
    }

    if (extractedPrice <= 0) {
      if (authoritativeUnavailable) {
        const unavailableValue: LiveStoreProductSnapshot = {
          available: false,
          checkedAt: new Date().toISOString(),
        };
        snapshotCache.set(cacheKey, { value: unavailableValue, expiresAt: Date.now() + cacheTtlMs });
        return unavailableValue;
      }
      snapshotCache.set(cacheKey, { value: null, expiresAt: Date.now() + 60_000 });
      return null;
    }
    // اگر یک مرجع موقتاً پاسخ نداد، قیمت تأییدشدهٔ چند ساعت اخیر را بی‌دلیل
    // با قیمت بالاتر مرجع دیگر جایگزین نمی‌کنیم. دادهٔ صرفاً واردشده همچنان باید
    // حداقل ۸۵٪ قیمت جاری باشد؛ فقط قیمت زندهٔ تأییدشده بازهٔ ۵۵٪ دارد.
    const minimumPreviousRatio = hasRecentVerifiedMarketPrice(product) ? 0.55 : 0.85;
    const bothMarketsVerified = torobCurrentPrice > 0 && digikalaCurrentPrice > 0;
    if (
      !bothMarketsVerified &&
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
    priceAvailable: snapshot.available === false ? false : snapshot.price ? true : product.priceAvailable,
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
