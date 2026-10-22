export const BROWSER_STORE_PRICES_KEY = "optibid:verified-store-prices:v1";
export const STORE_PRICE_SYNC_EVENT = "optibid-store-price-synced";

export type BrowserStorePrice = {
  price: number;
  updatedAt: string;
};

type BrowserStorePriceMap = Record<string, BrowserStorePrice>;

function normalizePrice(value: unknown): BrowserStorePrice | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<BrowserStorePrice>;
  const price = Math.round(Number(record.price || 0));
  const updatedAt = String(record.updatedAt || "");
  if (
    !Number.isFinite(price) ||
    price < 100_000 ||
    price > 1_500_000_000 ||
    !Number.isFinite(Date.parse(updatedAt))
  ) return null;
  return { price, updatedAt };
}

function readAllBrowserStorePrices(): BrowserStorePriceMap {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(BROWSER_STORE_PRICES_KEY) || "{}") as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).flatMap(([productId, value]) => {
        const normalized = normalizePrice(value);
        return normalized ? [[productId, normalized]] : [];
      }),
    );
  } catch {
    return {};
  }
}

export function readBrowserStorePrice(productId: string) {
  return readAllBrowserStorePrices()[productId] || null;
}

export function rememberBrowserStorePrice(productId: string, value: BrowserStorePrice) {
  if (typeof window === "undefined" || !productId) return;
  const normalized = normalizePrice(value);
  if (!normalized) return;
  try {
    const current = readAllBrowserStorePrices();
    const previous = current[productId];
    if (!previous || Date.parse(normalized.updatedAt) >= Date.parse(previous.updatedAt)) {
      current[productId] = normalized;
    }
    const trimmed = Object.fromEntries(
      Object.entries(current)
        .sort((left, right) => Date.parse(right[1].updatedAt) - Date.parse(left[1].updatedAt))
        .slice(0, 200),
    );
    window.localStorage.setItem(BROWSER_STORE_PRICES_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent(STORE_PRICE_SYNC_EVENT, {
      detail: { productId, value: current[productId] },
    }));
  } catch {
    // نبودن localStorage نباید نمایش یا خرید را متوقف کند.
  }
}

export async function fetchBrowserStorePrices(productIds: string[]) {
  const ids = Array.from(new Set(productIds.filter(Boolean))).slice(0, 30);
  if (!ids.length) return {} as BrowserStorePriceMap;
  const query = new URLSearchParams({ ids: ids.join(",") });
  const response = await fetch(`/api/shop/prices?${query.toString()}`, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Price sync HTTP ${response.status}`);
  const payload = await response.json() as { prices?: Record<string, unknown> };
  const prices = payload.prices || {};
  const result: BrowserStorePriceMap = {};
  for (const productId of ids) {
    const normalized = normalizePrice(prices[productId]);
    if (normalized) {
      result[productId] = normalized;
      rememberBrowserStorePrice(productId, normalized);
    }
  }
  return result;
}
