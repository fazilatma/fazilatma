import { kvGetText, kvPutText } from "@/lib/kv-storage";

const STORE_PRICE_OVERRIDES_KEY = "optibid:store-price-overrides";

export type StorePriceOverride = {
  price: number;
  marketPrice: number;
  priceMultiplier: number;
  updatedAt: string;
};

type PriceOverrideMap = Record<string, StorePriceOverride>;

function normalizeOverride(value: unknown): StorePriceOverride | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<StorePriceOverride>;
  const price = Number(record.price || 0);
  const marketPrice = Number(record.marketPrice || 0);
  const priceMultiplier = Number(record.priceMultiplier || 1);
  const updatedAt = String(record.updatedAt || "");
  if (
    !Number.isFinite(price) || price < 100_000 || price > 1_500_000_000 ||
    !Number.isFinite(marketPrice) || marketPrice < 100_000 || marketPrice > 1_500_000_000 ||
    !Number.isFinite(priceMultiplier) || priceMultiplier < 0.1 || priceMultiplier > 10 ||
    !Number.isFinite(Date.parse(updatedAt))
  ) return null;
  return { price: Math.round(price), marketPrice: Math.round(marketPrice), priceMultiplier, updatedAt };
}

export async function getStorePriceOverrides(): Promise<PriceOverrideMap> {
  try {
    const raw = await kvGetText(STORE_PRICE_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).flatMap(([productId, value]) => {
        const normalized = normalizeOverride(value);
        return normalized ? [[productId, normalized]] : [];
      }),
    );
  } catch {
    return {};
  }
}

export function applyStorePriceOverrides<T extends { id: string; price: number; marketPrice?: number; priceMultiplier?: number; priceUpdatedAt?: string }>(
  products: T[],
  overrides: PriceOverrideMap,
) {
  return products.map((product) => {
    const override = overrides[product.id];
    if (!override) return product;
    return {
      ...product,
      price: override.price,
      marketPrice: override.marketPrice,
      priceMultiplier: override.priceMultiplier,
      priceUpdatedAt: override.updatedAt.slice(0, 10),
    };
  });
}

export async function saveStorePriceOverride(
  productId: string,
  value: StorePriceOverride,
) {
  const normalized = normalizeOverride(value);
  if (!productId || !normalized) return;
  const current = await getStorePriceOverrides();
  current[productId] = normalized;
  const trimmed = Object.fromEntries(
    Object.entries(current)
      .sort((left, right) => Date.parse(right[1].updatedAt) - Date.parse(left[1].updatedAt))
      .slice(0, 1_000),
  );
  await kvPutText(STORE_PRICE_OVERRIDES_KEY, JSON.stringify(trimmed));
}
