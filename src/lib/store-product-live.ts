import type { JsonStoreProduct } from "@/lib/json-store";
import { appendStorePriceHistory } from "@/lib/store-price-history";

export type LiveStoreProductSnapshot = {
  price?: number;
  imageUrl?: string;
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
    const html = await fetchSourceHtml(sourceUrl);
    const extractedPrice = isTorobProduct ? firstTorobPrice(html) : digikalaPrice(html);
    const imageUrl = isTorobProduct
      ? torobImage(html, sourceUrl)
      : digikalaImage(html, sourceUrl);
    const storedPrice = Number(product.price || 0);
    const priceIsSane =
      extractedPrice > 0 &&
      (!storedPrice || (extractedPrice >= storedPrice * 0.4 && extractedPrice <= storedPrice * 2.5));
    const value = priceIsSane || imageUrl
      ? {
          price: priceIsSane ? extractedPrice : undefined,
          imageUrl: imageUrl || undefined,
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

export function applyLiveStoreProductSnapshot(
  product: JsonStoreProduct,
  snapshot: LiveStoreProductSnapshot | null,
): JsonStoreProduct {
  if (!snapshot) return product;
  const price = snapshot.price || product.price;
  const priceChanged = Boolean(snapshot.price && snapshot.price !== product.price);
  return {
    ...product,
    price,
    originalPrice: priceChanged ? undefined : product.originalPrice,
    imageUrl: snapshot.imageUrl || product.imageUrl,
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
