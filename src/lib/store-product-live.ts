import type { JsonStoreProduct } from "@/lib/json-store";
import { appendStorePriceHistory } from "@/lib/store-price-history";
import { technicalSpecsFromText } from "@/lib/store-product-specs";

export type LiveStoreProductComment = {
  id: string;
  userName: string;
  body: string;
  rate: number;
  createdAt: string;
  isBuyer: boolean;
};

export type LiveStoreProductSnapshot = {
  price?: number;
  originalPrice?: number;
  imageUrl?: string;
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
    .replace(/\b(rtx|gtx|rx)\s*-?\s*(\d{3,4})\b/g, "$1$2")
    .replace(/[^a-z0-9آ-ی]+/g, " ")
    .split(/\s+/)
    .filter((token) => /[a-z]/.test(token) && /\d/.test(token) && token.length >= 4)
    .filter((token) => !/^\d+(?:gb|tb|w|mhz|rpm)$/.test(token));
}

function torobComparablePrice(html: string, productTitle: string) {
  const requiredTokens = strongModelTokens(productTitle).slice(0, 4);
  if (!requiredTokens.length) return 0;
  const anchorPattern = /<a\b[^>]*href=["'][^"']*\/p\/[^"']+["'][^>]*>([\s\S]*?)<\/a>/gi;
  const prices: number[] = [];
  for (const match of html.matchAll(anchorPattern)) {
    const text = stripTags(match[1] || "");
    const normalized = toEnglishDigits(text)
      .toLowerCase()
      .replace(/\b(rtx|gtx|rx)\s*-?\s*(\d{3,4})\b/g, "$1$2")
      .replace(/[^a-z0-9آ-ی]+/g, " ");
    if (!requiredTokens.every((token) => normalized.includes(token))) continue;
    const rawPrice = text.match(/(?:از\s*)?([\d۰-۹٠-٩][\d۰-۹٠-٩٬،٫,.\s]{4,})\s*تومان/i)?.[1] || "";
    const price = formattedToman(rawPrice);
    if (price) prices.push(price);
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
  };
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

export async function getLiveStoreProductSnapshot(
  product: JsonStoreProduct,
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

  const cached = snapshotCache.get(sourceUrl);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const html = await fetchSourceHtml(sourceUrl).catch(() => "");
    let extractedPrice = html
      ? isTorobProduct ? firstTorobPrice(html) : digikalaPrice(html)
      : 0;
    let imageUrl = html
      ? isTorobProduct ? torobImage(html, sourceUrl) : digikalaImage(html, sourceUrl)
      : "";
    let detailData: ReturnType<typeof digikalaDetailSnapshot> | null = null;
    let comments: LiveStoreProductComment[] = [];
    let trustedCurrentPrice = false;

    if (isDigikalaProduct) {
      const productId = parsed.pathname.match(/\/product\/dkp-(\d+)/i)?.[1];
      if (productId) {
        const [detailResult, commentsResult, torobResult] = await Promise.allSettled([
          fetchDigikalaJson(`https://api.digikala.com/v2/product/${productId}/`),
          fetchDigikalaJson(`https://api.digikala.com/v1/product/${productId}/comments/?page=1`),
          fetchSourceHtml(`https://torob.com/search/?query=${encodeURIComponent(product.title)}`),
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

    const storedPrice = Number(product.price || 0);
    const priceIsSane =
      extractedPrice > 0 &&
      (trustedCurrentPrice || !storedPrice || (extractedPrice >= storedPrice * 0.4 && extractedPrice <= storedPrice * 2.5));
    const hasDetails = Boolean(detailData && (Object.keys(detailData.specs).length || detailData.description));
    const value = priceIsSane || imageUrl || hasDetails || comments.length
      ? {
          price: priceIsSane ? extractedPrice : undefined,
          originalPrice:
            priceIsSane && detailData?.price === extractedPrice
              ? detailData.originalPrice
              : undefined,
          imageUrl: imageUrl || undefined,
          specs: detailData?.specs,
          description: detailData?.description || undefined,
          comments,
          rating: detailData?.rating,
          reviewsCount: detailData?.reviewsCount,
          checkedAt: new Date().toISOString(),
        }
      : null;
    snapshotCache.set(sourceUrl, { value, expiresAt: Date.now() + cacheTtlMs });
    return value;
  } catch {
    snapshotCache.set(sourceUrl, { value: null, expiresAt: Date.now() + 60_000 });
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
    originalPrice:
      snapshot.originalPrice && snapshot.originalPrice > price
        ? snapshot.originalPrice
        : priceChanged
          ? undefined
          : product.originalPrice,
    imageUrl: snapshot.imageUrl || product.imageUrl,
    specs: { ...inferred.specs, ...product.specs, ...(snapshot.specs || {}) },
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
