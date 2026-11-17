export type ExternalMarketPoint = {
  at: string;
  value: number;
};

export type ExternalMarketSeries = {
  sourceName: string;
  sourceUrl: string;
  sourceSlug: string;
  sourceTitle: string;
  matchReason: string;
  isProxy: boolean;
  currency: string;
  unit: string;
  fetchedAt: string;
  currentPrice: number;
  points: ExternalMarketPoint[];
};

type MarketSourceConfig = {
  slug: string;
  title: string;
  sourceName: string;
  currency: string;
  unit: string;
  keywords: string[];
  categories?: string[];
  isProxy?: boolean;
  matchReason: string;
};

const TGJU_PROFILE_BASE = "https://www.tgju.org/profile";
const EXTERNAL_CACHE_TTL_MS = 30 * 60 * 1000;
const FETCH_TIMEOUT_MS = 7_000;

const tgjuSources: MarketSourceConfig[] = [
  {
    slug: "commodity_orange_juice",
    title: "آب پرتقال جهانی",
    sourceName: "TGJU",
    currency: "USD",
    unit: "پوند",
    keywords: ["آب پرتقال", "پرتقال", "orange juice"],
    categories: ["محصولات زراعی", "مواد غذایی"],
    matchReason: "نماد مستقیم کالایی در TGJU",
  },
  {
    slug: "geram18",
    title: "طلای ۱۸ عیار",
    sourceName: "TGJU",
    currency: "IRR",
    unit: "گرم",
    keywords: ["طلا", "طلای", "gold", "جواهر", "زیور"],
    categories: ["طلا", "جواهر"],
    matchReason: "نماد مستقیم طلا در TGJU",
  },
  {
    slug: "price_dollar_rl",
    title: "دلار بازار آزاد",
    sourceName: "TGJU",
    currency: "IRR",
    unit: "دلار",
    keywords: ["دلار", "ارز", "usd", "لپ تاپ", "لب تاب", "موبایل", "گوشی", "آیفون", "iphone", "macbook", "کامپیوتر", "کارت گرافیک", "قطعه", "دیجیتال", "خودرو", "ماشین"],
    categories: ["کالای دیجیتال", "خودرو و موتور", "صنعتی و اداری"],
    isProxy: true,
    matchReason: "پروکسی نرخ ارز برای کالاهای وارداتی/نو",
  },
  {
    slug: "price_eur",
    title: "یورو",
    sourceName: "TGJU",
    currency: "IRR",
    unit: "یورو",
    keywords: ["یورو", "eur", "اروپا", "اروپایی"],
    isProxy: true,
    matchReason: "پروکسی نرخ ارز یورو برای کالاهای وارداتی اروپایی",
  },
  {
    slug: "commodity_oil_brent",
    title: "نفت برنت",
    sourceName: "TGJU",
    currency: "USD",
    unit: "بشکه",
    keywords: ["نفت", "روغن صنعتی", "پتروشیمی", "پلیمر", "سوخت", "برنت"],
    categories: ["صنعتی و اداری"],
    isProxy: true,
    matchReason: "پروکسی انرژی/مواد اولیه برای کالای صنعتی",
  },
];

const defaultProxySource: MarketSourceConfig = {
  slug: "price_dollar_rl",
  title: "دلار بازار آزاد",
  sourceName: "TGJU",
  currency: "IRR",
  unit: "دلار",
  keywords: [],
  isProxy: true,
  matchReason: "پروکسی عمومی نرخ ارز برای قیمت‌گذاری کالاهای نو بدون نماد اختصاصی",
};

const cache = new Map<string, { expiresAt: number; data: ExternalMarketSeries | null }>();

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveSource(product: string, category = "") {
  const haystack = `${normalize(product)} ${normalize(category)}`;
  const matched = tgjuSources.find((source) =>
    source.keywords.some((keyword) => haystack.includes(normalize(keyword))) ||
    source.categories?.some((item) => haystack.includes(normalize(item)))
  );
  return matched || defaultProxySource;
}

function parseChartData(html: string): ExternalMarketPoint[] {
  const matches = [...html.matchAll(/chartData\s*:\s*(\[\[[\s\S]*?\]\])/g)].map((match) => match[1]);
  const candidate = matches.sort((a, b) => b.length - a.length)[0];
  if (!candidate) return [];

  try {
    const parsed = JSON.parse(candidate) as Array<[number, number]>;
    return parsed
      .map(([timestamp, price]) => ({
        at: new Date(Number(timestamp)).toISOString(),
        value: Math.max(0, Number(price) || 0),
      }))
      .filter((point) => Number.isFinite(new Date(point.at).getTime()) && point.value > 0)
      .slice(-420);
  } catch {
    return [];
  }
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "Cache-Control": "no-cache",
        "User-Agent": "OptiBid-Market-Analytics/1.0",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function getExternalMarketSeriesForProduct(product: string, category = ""): Promise<ExternalMarketSeries | null> {
  const source = resolveSource(product, category);
  const cacheKey = `${source.sourceName}:${source.slug}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const sourceUrl = `${TGJU_PROFILE_BASE}/${source.slug}`;
  try {
    const response = await fetchWithTimeout(sourceUrl);
    if (!response.ok) throw new Error(`External source HTTP ${response.status}`);
    const html = await response.text();
    const points = parseChartData(html);
    if (points.length === 0) throw new Error("No chartData found");

    const data: ExternalMarketSeries = {
      sourceName: source.sourceName,
      sourceUrl,
      sourceSlug: source.slug,
      sourceTitle: source.title,
      matchReason: source.matchReason,
      isProxy: Boolean(source.isProxy),
      currency: source.currency,
      unit: source.unit,
      fetchedAt: new Date().toISOString(),
      currentPrice: points[points.length - 1]?.value || 0,
      points,
    };
    cache.set(cacheKey, { expiresAt: Date.now() + EXTERNAL_CACHE_TTL_MS, data });
    return data;
  } catch (error) {
    console.error("[optibid] external market data failed", sourceUrl, error);
    cache.set(cacheKey, { expiresAt: Date.now() + 5 * 60 * 1000, data: null });
    return null;
  }
}
