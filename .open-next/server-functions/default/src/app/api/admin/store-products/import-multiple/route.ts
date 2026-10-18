import { NextResponse } from "next/server";
import {
  getOptiBidData,
  writeOptiBidData,
  type JsonStoreProduct,
} from "@/lib/json-store";
import { mergeStorePriceHistory } from "@/lib/store-price-history";
import {
  applyStorePriceFormula,
  normalizeStorePriceMultiplier,
  storedProductMarketPrice,
} from "@/lib/store-pricing";
import { parseSourceLinks } from "@/lib/source-link-parser";
import {
  importedDraftToStoreProduct,
  productMatchesComputerPartFilters,
  productMatchesImportCategories,
  storeProductIdentityKey,
  scanStoreProductsFromUrl,
} from "@/lib/store-product-import";

export const dynamic = "force-dynamic";

function normalizeMultiplier(value: unknown) {
  return normalizeStorePriceMultiplier(value, 1);
}

function applyMultiplier(product: JsonStoreProduct, multiplier: number) {
  return applyStorePriceFormula(product, storedProductMarketPrice(product), multiplier);
}

function modelTokens(title: string) {
  const normalized = String(title || "")
    .toLowerCase()
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\b(rtx|gtx|rx)\s*-?\s*(\d{3,4})\b/g, "$1$2")
    .replace(/\b(?:core\s*)?(i[3579])\s*-?\s*(\d{4,5}[a-z]{0,2})\b/g, "$1-$2")
    .replace(/\b(ryzen\s*[3579])\s*-?\s*(\d{4}[a-z0-9]*)\b/g, (_, family, model) => `${family.replace(/\s+/g, "")}-${model}`)
    .replace(/[^a-z0-9آ-ی-]+/g, " ");
  const tokens = normalized
    .split(/\s+/)
    .filter((token) => /\d/.test(token) && token.length >= 4)
    .filter((token) => !/^(?:\d+(?:gb|tb|mhz|hz|w|bit|nm|core|cores|thread|threads)|ddr\d|pcie\d*|usb\d*|lga\d+|am\d+|fm\d+|str\d+|socket\d*|gen\d+|\d+(?:th|nd|rd)|\d+)$/.test(token));
  const expanded = new Set(tokens);
  for (const token of tokens) {
    const processorModel = token.match(/^(?:i[3579]|ryzen[3579])-(.+)$/)?.[1];
    if (processorModel && processorModel.length >= 5) expanded.add(processorModel);
  }
  return expanded;
}

type ProductMatchIndex = {
  urls: Map<string, number>;
  identities: Map<string, number>;
  models: Map<string, number>;
};

function addProductToMatchIndex(index: ProductMatchIndex, product: JsonStoreProduct, productIndex: number) {
  if (product.externalSourceUrl && !index.urls.has(product.externalSourceUrl)) {
    index.urls.set(product.externalSourceUrl, productIndex);
  }
  const identity = storeProductIdentityKey(product);
  if (!index.identities.has(identity)) index.identities.set(identity, productIndex);
  for (const model of modelTokens(product.title)) {
    if (!index.models.has(model)) index.models.set(model, productIndex);
  }
}

function createProductMatchIndex(products: JsonStoreProduct[]) {
  const index: ProductMatchIndex = {
    urls: new Map(),
    identities: new Map(),
    models: new Map(),
  };
  products.forEach((product, productIndex) => addProductToMatchIndex(index, product, productIndex));
  return index;
}

function findMultiSourceMatch(
  products: JsonStoreProduct[],
  candidate: JsonStoreProduct,
  matchIndex?: ProductMatchIndex,
) {
  const index = matchIndex || createProductMatchIndex(products);
  if (candidate.externalSourceUrl) {
    const exactUrl = index.urls.get(candidate.externalSourceUrl);
    if (exactUrl !== undefined) return exactUrl;
  }
  const exactIdentity = index.identities.get(storeProductIdentityKey(candidate));
  if (exactIdentity !== undefined) return exactIdentity;

  let earliestMatch = Number.POSITIVE_INFINITY;
  for (const model of modelTokens(candidate.title)) {
    const productIndex = index.models.get(model);
    if (productIndex !== undefined && productIndex < earliestMatch) earliestMatch = productIndex;
  }
  return Number.isFinite(earliestMatch) ? earliestMatch : -1;
}

function validSaleOriginalPrice(price: number, originalPrice: number | undefined) {
  const original = Number(originalPrice || 0);
  // اختلاف قیمت دو فروشگاه «تخفیف» نیست. فقط قیمت قبل از تخفیف همان کارت
  // و فقط در بازهٔ منطقی پذیرفته می‌شود تا برچسب‌های ۷۰ تا ۹۰ درصدی جعلی نشوند.
  return original > price && original <= price * 1.8 ? original : undefined;
}

function mergeLowestPrice(existing: JsonStoreProduct, candidate: JsonStoreProduct) {
  const existingMarketPrice = storedProductMarketPrice(existing);
  const candidateMarketPrice = storedProductMarketPrice(candidate);
  const candidateIsCheaper = candidateMarketPrice > 0 && (
    existingMarketPrice <= 0 || candidateMarketPrice < existingMarketPrice
  );
  const chosen = candidateIsCheaper ? candidate : existing;
  const marketPrice = Math.min(
    ...[existingMarketPrice, candidateMarketPrice].filter((value) => Number.isFinite(value) && value > 0),
  );
  const merged = {
    ...existing,
    title: candidate.title.length > existing.title.length ? candidate.title : existing.title,
    brand: existing.brand && existing.brand !== "OptiBid" && existing.brand !== "Torob" && existing.brand !== "Digikala"
      ? existing.brand
      : candidate.brand,
    category: candidate.category !== "نامشخص" ? candidate.category : existing.category,
    summary: candidate.summary.length > existing.summary.length ? candidate.summary : existing.summary,
    description: candidate.description.length > existing.description.length ? candidate.description : existing.description,
    price: chosen.price,
    marketPrice,
    priceMultiplier: chosen.priceMultiplier,
    originalPrice: validSaleOriginalPrice(chosen.price, chosen.originalPrice),
    stock: Math.max(existing.stock || 0, candidate.stock || 0),
    specs: { ...existing.specs, ...candidate.specs },
    badges: Array.from(new Set([...(existing.badges || []), ...(candidate.badges || [])])).slice(0, 6),
    warranty: existing.warranty || candidate.warranty,
    shippingNote: existing.shippingNote || candidate.shippingNote,
    priceUpdatedAt: chosen.priceUpdatedAt,
    marketReferenceNote: chosen.marketReferenceNote,
    externalSourceUrl: chosen.externalSourceUrl,
    imageUrl: existing.imageUrl || candidate.imageUrl,
    priceHistory: mergeStorePriceHistory(existing.priceHistory, candidate.priceHistory),
    isActive: true,
  } satisfies JsonStoreProduct;
  return applyStorePriceFormula(
    merged,
    marketPrice,
    normalizeMultiplier(candidate.priceMultiplier || existing.priceMultiplier),
  );
}

function applyCurrentAggregatedPrice(existing: JsonStoreProduct, candidate: JsonStoreProduct) {
  const merged = mergeLowestPrice(existing, candidate);
  return {
    ...merged,
    price: candidate.price,
    marketPrice: candidate.marketPrice,
    priceMultiplier: candidate.priceMultiplier,
    originalPrice: validSaleOriginalPrice(candidate.price, candidate.originalPrice),
    priceUpdatedAt: candidate.priceUpdatedAt,
    marketReferenceNote: candidate.marketReferenceNote,
    externalSourceUrl: candidate.externalSourceUrl,
    priceHistory: mergeStorePriceHistory(existing.priceHistory, candidate.priceHistory),
  } satisfies JsonStoreProduct;
}

function normalizeSourceConfigs(body: Record<string, unknown>) {
  const allowedParts = new Set(["cpu", "gpu", "ram", "ssd", "motherboard", "power", "case", "cooler"]);
  const configured = Array.isArray(body.sources)
    ? body.sources.flatMap((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return [];
        const record = item as Record<string, unknown>;
        const url = parseSourceLinks(record.url, 1)[0];
        if (!url) return [];
        const parts = Array.isArray(record.parts)
          ? [...new Set(record.parts.map((part) => String(part).toLowerCase()).filter((part) => allowedParts.has(part)))]
          : [];
        return [{ url, parts }];
      })
    : [];
  if (configured.length) return configured.slice(0, 8);
  return parseSourceLinks(body.links, 8).map((url) => ({ url, parts: [] as string[] }));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const sourceConfigs = normalizeSourceConfigs(body);
    if (sourceConfigs.length === 0) {
      return NextResponse.json(
        { success: false, message: "حداقل یک لینک معتبر وارد کنید. لینک‌ها را با & یا خط جدید جدا کنید." },
        { status: 400 },
      );
    }

    // منابع تخصصی ترب و دیجی‌کالا به‌صورت چندصفحه‌ای خوانده می‌شوند.
    // سقف برای هر لینک است تا یک دستهٔ بزرگ به ۵۰ نتیجهٔ صفحهٔ اول محدود نشود.
    const requestedLimit = Math.max(1, Math.min(500, Number(body.limit || 500)));
    const multiplier = normalizeMultiplier(body.priceMultiplier);
    const warnings: string[] = [];
    const scannedUrls: string[] = [];
    const aggregated: JsonStoreProduct[] = [];
    const aggregatedMatchIndex = createProductMatchIndex(aggregated);
    let rawProducts = 0;

    // هر منبع در مسیر مستقل اجرا می‌شود؛ بنابراین رد شدن ترب، اسکن دیجی‌کالا
    // را متوقف نمی‌کند. داخل هر منبع، صفحه‌ها همچنان ترتیبی خوانده می‌شوند.
    const sourceScans = await Promise.all(
      sourceConfigs.map(async (sourceConfig) => {
        const host = new URL(sourceConfig.url).hostname;
        const specializedSource = /(?:^|\.)(?:digikala\.com|torob\.com)$/i.test(host.replace(/^www\./, ""));
        try {
          const scan = await scanStoreProductsFromUrl(sourceConfig.url, {
            limit: requestedLimit,
            fullSite: specializedSource,
            maxPages: specializedSource ? 12 : 6,
            categoryFilters: ["components", "storage"],
            partFilters: sourceConfig.parts,
          });
          return { host, parts: sourceConfig.parts, scan, error: "" };
        } catch (error) {
          return {
            host,
            parts: sourceConfig.parts,
            scan: null,
            error: error instanceof Error ? error.message : "خطای نامشخص",
          };
        }
      }),
    );

    for (const source of sourceScans) {
      if (!source.scan) {
        warnings.push(`${source.host}: اجرای ربات این منبع ناموفق بود: ${source.error}`);
        continue;
      }
      warnings.push(...source.scan.warnings.map((warning) => `${source.host}: ${warning}`));
      scannedUrls.push(...source.scan.scannedUrls);
      const drafts = source.scan.products.filter((draft) =>
        productMatchesImportCategories(draft, ["components", "storage"]) &&
        productMatchesComputerPartFilters(draft, source.parts),
      );
      rawProducts += drafts.length;

      for (const draft of drafts) {
        const product = applyMultiplier(importedDraftToStoreProduct(draft), multiplier);
        const matchIndex = findMultiSourceMatch(aggregated, product, aggregatedMatchIndex);
        if (matchIndex >= 0) {
          aggregated[matchIndex] = mergeLowestPrice(aggregated[matchIndex], product);
          addProductToMatchIndex(aggregatedMatchIndex, aggregated[matchIndex], matchIndex);
        } else {
          const productIndex = aggregated.push(product) - 1;
          addProductToMatchIndex(aggregatedMatchIndex, product, productIndex);
        }
      }
    }

    if (aggregated.length === 0) {
      const warningSummary = sourceScans
        .map((source) => warnings.find((warning) => warning.startsWith(`${source.host}:`)))
        .filter((warning): warning is string => Boolean(warning))
        .slice(0, 3)
        .join("؛ ");
      return NextResponse.json(
        {
          success: false,
          message: `از لینک‌های واردشده محصول قطعه‌ایِ قیمت‌دار پیدا نشد.${warningSummary ? ` جزئیات: ${warningSummary}` : ""}`,
          warnings: warnings.slice(0, 20),
          scannedUrls,
        },
        { status: 422 },
      );
    }

    const data = await getOptiBidData();
    data.settings.storePriceMultiplier = multiplier;
    let created = 0;
    let updated = 0;
    const existingSlugs = new Set(data.storeProducts.map((product) => product.slug));
    const storedMatchIndex = createProductMatchIndex(data.storeProducts);
    for (const product of aggregated) {
      const matchIndex = findMultiSourceMatch(data.storeProducts, product, storedMatchIndex);
      if (matchIndex >= 0) {
        data.storeProducts[matchIndex] = applyCurrentAggregatedPrice(data.storeProducts[matchIndex], product);
        addProductToMatchIndex(storedMatchIndex, data.storeProducts[matchIndex], matchIndex);
        updated += 1;
        continue;
      }
      let candidate = product;
      let suffix = 2;
      while (existingSlugs.has(candidate.slug)) {
        candidate = { ...candidate, slug: `${product.slug}-${suffix}` };
        suffix += 1;
      }
      existingSlugs.add(candidate.slug);
      const productIndex = data.storeProducts.push(candidate) - 1;
      addProductToMatchIndex(storedMatchIndex, candidate, productIndex);
      created += 1;
    }
    await writeOptiBidData(data);
    const activeStoreProducts = data.storeProducts.filter((product) => product.isActive !== false && product.stock > 0).length;

    return NextResponse.json({
      success: true,
      linksCount: sourceConfigs.length,
      rawProducts,
      uniqueProducts: aggregated.length,
      duplicatesRemoved: Math.max(0, rawProducts - aggregated.length),
      created,
      updated,
      activeStoreProducts,
      warnings: warnings.slice(0, 20),
      scannedUrls,
      message: `${sourceConfigs.length.toLocaleString("fa-IR")} لینک بررسی شد؛ ${rawProducts.toLocaleString("fa-IR")} ردیف قیمت‌دار خوانده شد، ${aggregated.length.toLocaleString("fa-IR")} محصول یکتا باقی ماند و ${Math.max(0, rawProducts - aggregated.length).toLocaleString("fa-IR")} تکراری حذف شد. ${created.toLocaleString("fa-IR")} محصول اضافه و ${updated.toLocaleString("fa-IR")} محصول به‌روزرسانی شد.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "درون‌ریزی هم‌زمان چند لینک ناموفق بود.",
        detail: error instanceof Error ? error.message : "Unknown multiple import error",
      },
      { status: 500 },
    );
  }
}
