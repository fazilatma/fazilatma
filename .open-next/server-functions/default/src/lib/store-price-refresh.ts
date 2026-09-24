import type { JsonStoreProduct } from "@/lib/json-store";

export type PriceReferenceKey = "torob" | "digikala" | "instagram" | "telegram" | "google";

export type PriceCandidate = {
  source: PriceReferenceKey;
  title: string;
  price: number;
  url: string;
  score: number;
};

export type ProductPriceRefreshResult = {
  productId: string;
  slug: string;
  title: string;
  oldPrice: number;
  newPrice?: number;
  source?: PriceReferenceKey;
  sourceUrl?: string;
  candidateTitle?: string;
  status: "updated" | "unchanged" | "not-found" | "failed";
  message: string;
};

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

const referenceHosts: Record<PriceReferenceKey, string[]> = {
  torob: ["torob.com"],
  digikala: ["digikala.com"],
  instagram: ["instagram.com", "cdninstagram.com"],
  telegram: ["t.me", "telegram.me", "telegram.org"],
  google: ["google.com", "googleusercontent.com"],
};

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
  if (!normalizedCurrency && price >= 250_000_000) price = price / 10;
  return Math.round(price);
}

function roundToman(value: number) {
  return Math.max(0, Math.round(Number(value || 0) / 10_000) * 10_000);
}

function normalizeText(value: string) {
  return toEnglishDigits(value)
    .toLowerCase()
    .replace(/[\u200c\s]+/g, " ")
    .replace(/[^a-z0-9آ-ی ]+/g, " ")
    .trim();
}

function tokens(value: string) {
  return normalizeText(value)
    .split(/\s+/)
    .filter(
      (token) =>
        token.length >= 2 &&
        ![
          "لپ",
          "تاپ",
          "لپتاپ",
          "لپ‌تاپ",
          "خرید",
          "قیمت",
          "مدل",
          "فروش",
          "کالا",
          "laptop",
          "notebook",
          "gb",
          "ram",
          "ssd",
          "core",
          "inch",
        ].includes(token),
    );
}

function candidateScore(product: JsonStoreProduct, title: string) {
  const productTokens = new Set(tokens(`${product.brand} ${product.title} ${Object.values(product.specs || {}).join(" ")}`));
  const titleTokens = tokens(title);
  let score = 0;
  for (const token of titleTokens) {
    if (productTokens.has(token)) score += /\d/.test(token) ? 2 : 1;
  }
  if (title.toLowerCase().includes(product.brand.toLowerCase())) score += 4;
  return score;
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested = firstText(...value);
      if (nested) return nested;
      continue;
    }
    if (typeof value === "object" && value) {
      const record = value as Record<string, unknown>;
      const nested = firstText(record.name, record.title, record.value, record.url);
      if (nested) return nested;
      continue;
    }
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (text) return text;
  }
  return "";
}

function flattenJson(value: unknown): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(flattenJson);
  if (typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  return [record, ...Object.values(record).flatMap(flattenJson)];
}

function parseJsonLoose(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(decodeHtml(raw).replace(/,\s*([}\]])/g, "$1"));
    } catch {
      return null;
    }
  }
}

function absoluteUrl(value: string, baseUrl: string) {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}

async function fetchText(url: string, accept = "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8") {
  const timeoutSignal =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? (AbortSignal as unknown as { timeout: (milliseconds: number) => AbortSignal }).timeout(14000)
      : undefined;
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; OptiBidPriceUpdater/1.0; +https://optibid.ir)",
      accept,
    },
    signal: timeoutSignal,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function extractJsonLdObjects(html: string) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  return scripts.flatMap((match) => flattenJson(parseJsonLoose(match[1] || "")));
}

function extractTitle(html: string) {
  return stripTags(
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ||
      html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
      "",
  );
}

function candidatesFromJson(value: unknown, source: PriceReferenceKey, baseUrl: string) {
  const candidates: Omit<PriceCandidate, "score">[] = [];
  for (const record of flattenJson(value)) {
    const title = firstText(
      record.title_fa,
      record.title_en,
      record.title,
      record.name,
      record.product_title,
      record.fa_title,
    );
    const priceRaw = firstText(
      record.price,
      record.selling_price,
      record.rrp_price,
      record.lowPrice,
      record.highPrice,
      record?.default_variant?.price?.selling_price,
      record?.default_variant?.price?.rrp_price,
      record?.price?.selling_price,
      record?.price?.rrp_price,
      record?.offers?.price,
      record?.offers?.lowPrice,
      record?.offers?.highPrice,
    );
    const currency = firstText(
      record.priceCurrency,
      record?.offers?.priceCurrency,
      record?.default_variant?.price?.currency,
    );
    const price = normalizePriceToToman(priceRaw, currency);
    if (!title || price < 100_000 || price > 1_500_000_000) continue;
    const url = firstText(record.url, record.web_url, record.absolute_url, record?.url?.uri);
    candidates.push({
      source,
      title,
      price,
      url: url ? absoluteUrl(url, baseUrl) : baseUrl,
    });
  }
  return candidates;
}

function candidatesFromHtml(html: string, source: PriceReferenceKey, baseUrl: string) {
  const candidates = candidatesFromJson(extractJsonLdObjects(html), source, baseUrl);
  const title = extractTitle(html);
  const text = stripTags(html);
  const priceValues = new Set<number>();
  const patterns = [
    /([\d۰-۹٠-٩][\d۰-۹٠-٩,.٬\s]{4,})\s*(?:تومان|تومن|IRT)/gi,
    /(?:تومان|تومن|IRT)\s*([\d۰-۹٠-٩][\d۰-۹٠-٩,.٬\s]{4,})/gi,
    /"price"\s*:\s*"?([\d۰-۹٠-٩][\d۰-۹٠-٩,.٬\s]{4,})"?/gi,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const price = normalizePriceToToman(match[1]);
      if (price >= 100_000 && price <= 1_500_000_000) priceValues.add(price);
    }
  }
  const minPrice = [...priceValues].sort((a, b) => a - b)[0];
  if (title && minPrice) candidates.push({ source, title, price: minPrice, url: baseUrl });
  return candidates;
}

async function directSourceCandidates(product: JsonStoreProduct, source: PriceReferenceKey) {
  if (!product.externalSourceUrl) return [];
  let host = "";
  try {
    host = new URL(product.externalSourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return [];
  }
  if (!referenceHosts[source].some((item) => host.includes(item))) return [];
  const html = await fetchText(product.externalSourceUrl);
  return candidatesFromHtml(html, source, product.externalSourceUrl);
}

async function digikalaCandidates(product: JsonStoreProduct) {
  const query = encodeURIComponent(product.title);
  const url = `https://api.digikala.com/v1/search/?q=${query}`;
  const raw = await fetchText(url, "application/json,text/plain,*/*");
  return candidatesFromJson(parseJsonLoose(raw), "digikala", "https://www.digikala.com/");
}

async function torobCandidates(product: JsonStoreProduct) {
  const query = encodeURIComponent(product.title);
  const urls = [
    `https://api.torob.com/v4/base-product/search/?page=0&sort=popularity&size=20&q=${query}`,
    `https://torob.com/search/?query=${query}`,
  ];
  const all: Omit<PriceCandidate, "score">[] = [];
  for (const url of urls) {
    try {
      const raw = await fetchText(url);
      const json = parseJsonLoose(raw);
      all.push(...(json ? candidatesFromJson(json, "torob", "https://torob.com/") : candidatesFromHtml(raw, "torob", url)));
    } catch {
      // منبع بعدی امتحان شود.
    }
  }
  return all;
}

async function googleCandidates(product: JsonStoreProduct) {
  const query = encodeURIComponent(`${product.title} قیمت`);
  const url = `https://www.google.com/search?q=${query}&hl=fa`;
  const html = await fetchText(url);
  return candidatesFromHtml(html, "google", url);
}

async function socialCandidates(product: JsonStoreProduct, source: "instagram" | "telegram") {
  return directSourceCandidates(product, source);
}

export function normalizePriceReferences(value: unknown): PriceReferenceKey[] {
  const valid = new Set<PriceReferenceKey>(["torob", "digikala", "instagram", "telegram", "google"]);
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter((item): item is PriceReferenceKey => valid.has(item as PriceReferenceKey));
}

export async function findProductPriceCandidates(
  product: JsonStoreProduct,
  references: PriceReferenceKey[],
) {
  const selected: PriceReferenceKey[] = references.length ? references : ["torob", "digikala"];
  const errors: string[] = [];
  const rawCandidates: Omit<PriceCandidate, "score">[] = [];

  for (const source of selected) {
    try {
      if (source === "digikala") rawCandidates.push(...(await digikalaCandidates(product)));
      else if (source === "torob") rawCandidates.push(...(await torobCandidates(product)));
      else if (source === "google") rawCandidates.push(...(await googleCandidates(product)));
      else if (source === "instagram" || source === "telegram") rawCandidates.push(...(await socialCandidates(product, source)));
      rawCandidates.push(...(await directSourceCandidates(product, source)));
    } catch (error) {
      errors.push(`${source}: ${error instanceof Error ? error.message : "خطا"}`);
    }
  }

  const scored = rawCandidates
    .map((candidate) => ({ ...candidate, score: candidateScore(product, candidate.title) }))
    .filter((candidate) => candidate.score >= 4)
    .sort((a, b) => b.score - a.score || a.price - b.price);

  return { candidates: scored, errors };
}

export function chooseBestPriceCandidate(candidates: PriceCandidate[]) {
  if (!candidates.length) return null;
  const topScore = candidates[0].score;
  const top = candidates.filter((candidate) => candidate.score >= topScore - 1).slice(0, 5);
  return [...top].sort((a, b) => a.price - b.price)[Math.floor(top.length / 2)] || top[0];
}

export function applyRefreshedPrice(
  product: JsonStoreProduct,
  candidate: PriceCandidate,
  multiplier = 1,
): JsonStoreProduct {
  const price = roundToman(candidate.price * Math.max(0.1, Math.min(10, multiplier || 1)));
  const previousPrice = Number(product.price || 0);
  const originalPrice = Math.max(Number(product.originalPrice || 0), previousPrice, price);
  return {
    ...product,
    price,
    originalPrice: originalPrice > price ? originalPrice : product.originalPrice,
    priceUpdatedAt: new Date().toISOString().slice(0, 10),
    marketReferenceNote: `به‌روزرسانی قیمت از ${candidate.source}: ${candidate.title}`,
    externalSourceUrl: candidate.url || product.externalSourceUrl,
    badges: Array.from(new Set([...(product.badges || []), "قیمت به‌روز"])).slice(0, 6),
  };
}
