import type { JsonStoreProduct } from "@/lib/json-store";
import {
  applyStorePriceFormula,
  normalizeStorePriceMultiplier,
  roundStorePrice,
  storedProductMarketPrice,
  storedProductPriceMultiplier,
} from "@/lib/store-pricing";

export type PriceAuditStatus =
  /** قیمت ذخیره‌شده با فرمول «قیمت مرجع × ضریب» نمی‌خواند. */
  | "mismatch"
  /** قیمت مرجع ذخیره نشده و قابل بررسی نیست (باید از مرجع به‌روزرسانی شود). */
  | "missing-reference"
  /** قیمت درست است ولی قدیمی است. */
  | "stale"
  | "ok";

export type PriceAuditRow = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  category: string;
  storedPrice: number;
  referencePrice: number;
  multiplier: number;
  expectedPrice: number;
  difference: number;
  differenceRatio: number;
  originalPrice?: number;
  expectedOriginalPrice?: number;
  priceUpdatedAt?: string;
  daysSinceUpdate: number | null;
  sourceUrl?: string;
  status: PriceAuditStatus;
  isActive: boolean;
  stock: number;
};

export type PriceAuditSummary = {
  total: number;
  mismatch: number;
  missingReference: number;
  stale: number;
  ok: number;
  totalDifference: number;
  /** کالاهایی که قیمتشان با بازار روز تطبیق داده نشده است. */
  unverified: number;
};

// در فروشگاه قیمت‌محور، مرجع قیمتی که دو روز با بازار تطبیق داده نشده باشد
// «کهنه» شمرده می‌شود؛ همین تأخیر باعث فروش زیر قیمت بازار می‌شد.
const STALE_DAYS = 2;

/**
 * تنها منبع حقیقتِ قیمت: «قیمت مرجع بازار × ضریب همان محصول».
 * هر عدد دیگری در دیتابیس اگر با این فرمول نخواند، مغایرت است.
 */
export function resolveProductPrice(product: Partial<JsonStoreProduct>, fallbackMultiplier = 1) {
  const explicitReference = Number(product.marketPrice || 0);
  const hasExplicitReference =
    Number.isFinite(explicitReference) && explicitReference >= 100_000 && explicitReference <= 10_000_000_000;
  const referencePrice = Math.max(0, Math.round(storedProductMarketPrice(product)));
  const multiplier = normalizeStorePriceMultiplier(
    storedProductPriceMultiplier(product, fallbackMultiplier),
    1,
  );
  const expectedPrice = referencePrice > 0 ? roundStorePrice(referencePrice * multiplier) : 0;
  return { referencePrice, multiplier, expectedPrice, hasExplicitReference };
}

export function auditStoreProductPrices(
  products: JsonStoreProduct[],
  fallbackMultiplier = 1,
  now = Date.now(),
): { rows: PriceAuditRow[]; summary: PriceAuditSummary } {
  const rows = products.map((product) => {
    const { referencePrice, multiplier, expectedPrice, hasExplicitReference } = resolveProductPrice(
      product,
      fallbackMultiplier,
    );
    const storedPrice = Math.max(0, Math.round(Number(product.price || 0)));
    const updatedAt = product.priceUpdatedAt || product.priceVerifiedAt;
    const parsedUpdatedAt = updatedAt ? Date.parse(updatedAt) : Number.NaN;
    const daysSinceUpdate = Number.isFinite(parsedUpdatedAt)
      ? Math.max(0, Math.floor((now - parsedUpdatedAt) / 86_400_000))
      : null;

    let status: PriceAuditStatus = "ok";
    if (hasExplicitReference && expectedPrice > 0 && Math.abs(storedPrice - expectedPrice) >= 10_000) {
      status = "mismatch";
    } else if (!hasExplicitReference) {
      status = "missing-reference";
    } else if (daysSinceUpdate === null || daysSinceUpdate > STALE_DAYS) {
      status = "stale";
    }

    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      brand: product.brand,
      category: product.category,
      storedPrice,
      referencePrice,
      multiplier,
      expectedPrice,
      difference: expectedPrice > 0 ? storedPrice - expectedPrice : 0,
      differenceRatio:
        expectedPrice > 0 ? Math.round(((storedPrice - expectedPrice) / expectedPrice) * 1000) / 10 : 0,
      originalPrice: product.originalPrice,
      priceUpdatedAt: updatedAt,
      daysSinceUpdate,
      sourceUrl: product.externalSourceUrl || product.sourceLink,
      status,
      isActive: product.isActive !== false,
      stock: Number(product.stock || 0),
    } satisfies PriceAuditRow;
  });

  const summary: PriceAuditSummary = {
    total: rows.length,
    mismatch: rows.filter((row) => row.status === "mismatch").length,
    missingReference: rows.filter((row) => row.status === "missing-reference").length,
    stale: rows.filter((row) => row.status === "stale").length,
    ok: rows.filter((row) => row.status === "ok").length,
    totalDifference: rows.reduce((sum, row) => sum + Math.abs(row.difference), 0),
    unverified: rows.filter((row) => row.status === "stale" || row.status === "missing-reference" || row.daysSinceUpdate === null)
      .length,
  };

  return { rows, summary };
}

/** قیمت محصول را با فرمول درست بازنویسی می‌کند (اگر قیمت مرجع موجود باشد). */
export function repriceStoreProduct(
  product: JsonStoreProduct,
  fallbackMultiplier = 1,
): JsonStoreProduct | null {
  const { referencePrice, multiplier, expectedPrice } = resolveProductPrice(
    product,
    fallbackMultiplier,
  );
  if (!referencePrice || !expectedPrice) return null;
  if (Math.abs(Number(product.price || 0) - expectedPrice) < 10_000) return null;
  const repriced = applyStorePriceFormula(product, referencePrice, multiplier);
  return {
    ...repriced,
    badges: Array.from(new Set([...(product.badges || []).filter((badge) => badge !== "قیمت اصلاح‌شده"), "قیمت اصلاح‌شده"])).slice(0, 6),
  };
}
