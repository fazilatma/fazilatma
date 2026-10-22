import { kvGetText, kvPutText } from "@/lib/kv-storage";

const STORE_PRICE_OVERRIDES_KEY = "optibid:store-price-overrides";
const STORE_PRICE_OVERRIDE_KEY_PREFIX = "optibid:store-price-override:";
const MAX_BATCH_PRICE_OVERRIDE_IDS = 30;

export type StorePriceOverride = {
  price: number;
  marketPrice: number;
  priceMultiplier: number;
  updatedAt: string;
};

type PriceOverrideMap = Record<string, StorePriceOverride>;

function normalizeProductId(value: unknown) {
  const productId = String(value || "").trim();
  return /^[a-zA-Z0-9._:-]{1,100}$/.test(productId) ? productId : "";
}

function productOverrideKey(productId: string) {
  return `${STORE_PRICE_OVERRIDE_KEY_PREFIX}${productId}`;
}

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

function parseOverride(raw: string | null) {
  if (!raw) return null;
  try {
    return normalizeOverride(JSON.parse(raw));
  } catch {
    return null;
  }
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

/**
 * قیمت‌های تأییدشدهٔ هر محصول جداگانه هم ذخیره می‌شوند. برخلاف نقشهٔ مشترک،
 * بازدید هم‌زمان دو صفحه نمی‌تواند قیمت محصول دیگر را با read-modify-write حذف کند.
 */
export async function getStorePriceOverridesByIds(productIds: string[]): Promise<PriceOverrideMap> {
  const ids = Array.from(new Set(productIds.map(normalizeProductId).filter(Boolean)))
    .slice(0, MAX_BATCH_PRICE_OVERRIDE_IDS);
  if (!ids.length) return {};

  const dedicatedValues = await Promise.all(
    ids.map(async (productId) => {
      try {
        return [productId, parseOverride(await kvGetText(productOverrideKey(productId)))] as const;
      } catch {
        return [productId, null] as const;
      }
    }),
  );
  const result: PriceOverrideMap = {};
  const missingIds: string[] = [];
  for (const [productId, value] of dedicatedValues) {
    if (value) result[productId] = value;
    else missingIds.push(productId);
  }

  // سازگاری با قیمت‌هایی که پیش از اضافه‌شدن کلید مستقل ذخیره شده‌اند.
  if (missingIds.length) {
    const legacy = await getStorePriceOverrides();
    for (const productId of missingIds) {
      if (legacy[productId]) result[productId] = legacy[productId];
    }
  }
  return result;
}

export function applyStorePriceOverrides<T extends {
  id: string;
  price: number;
  marketPrice?: number;
  priceMultiplier?: number;
  priceUpdatedAt?: string;
  priceVerifiedAt?: string;
}>(
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
      priceVerifiedAt: override.updatedAt,
    };
  });
}

export async function saveStorePriceOverride(
  productIdValue: string,
  value: StorePriceOverride,
) {
  const productId = normalizeProductId(productIdValue);
  const normalized = normalizeOverride(value);
  if (!productId || !normalized) return;

  // این نوشتن منبع مطمئن قیمت همان محصول است و به‌دلیل مستقل‌بودن کلید گم نمی‌شود.
  await kvPutText(productOverrideKey(productId), JSON.stringify(normalized));

  // نقشهٔ فشرده برای SSR فهرست حفظ می‌شود؛ کلاینت بعد از بارگذاری آن را با کلید
  // مستقل بالا همگام می‌کند تا ناسازگاری ناشی از هم‌زمانی یا KV eventual consistency نماند.
  try {
    const current = await getStorePriceOverrides();
    current[productId] = normalized;
    const trimmed = Object.fromEntries(
      Object.entries(current)
        .sort((left, right) => Date.parse(right[1].updatedAt) - Date.parse(left[1].updatedAt))
        .slice(0, 1_000),
    );
    await kvPutText(STORE_PRICE_OVERRIDES_KEY, JSON.stringify(trimmed));
  } catch {
    // کلید مستقل با موفقیت ذخیره شده و برای کارت/سبد خرید قابل استفاده است.
  }
}
