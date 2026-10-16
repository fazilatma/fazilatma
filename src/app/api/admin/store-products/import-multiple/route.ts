import { NextResponse } from "next/server";
import {
  getOptiBidData,
  writeOptiBidData,
  type JsonStoreProduct,
} from "@/lib/json-store";
import { mergeStorePriceHistory } from "@/lib/store-price-history";
import {
  importedDraftToStoreProduct,
  productMatchesImportCategories,
  storeProductIdentityKey,
  scanStoreProductsFromUrl,
} from "@/lib/store-product-import";

export const dynamic = "force-dynamic";

function normalizeLinks(value: unknown) {
  const raw = (Array.isArray(value) ? value.map(String).join("\n") : String(value || ""))
    .replace(/&amp;(?=https?:\/\/)/gi, "&");
  const candidates = raw
    .split(/\r?\n|\s*&\s*(?=https?:\/\/)|[|،]+/i)
    .map((item) => item.trim())
    .filter(Boolean);
  const links: string[] = [];
  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);
      if ((url.protocol === "http:" || url.protocol === "https:") && !links.includes(url.toString())) {
        links.push(url.toString());
      }
    } catch {
      // Invalid fragments are reported through the final count/message.
    }
  }
  return links.slice(0, 8);
}

function normalizeMultiplier(value: unknown) {
  const number = Number(value || 1);
  return Number.isFinite(number) ? Math.max(0.1, Math.min(10, number)) : 1;
}

function applyMultiplier(product: JsonStoreProduct, multiplier: number) {
  if (multiplier === 1) return product;
  const round = (value: number) => Math.max(0, Math.round(value / 10_000) * 10_000);
  return {
    ...product,
    price: round(product.price * multiplier),
    originalPrice: product.originalPrice ? round(product.originalPrice * multiplier) : undefined,
  };
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
  return new Set(
    normalized
      .split(/\s+/)
      .filter((token) => /\d/.test(token) && token.length >= 4)
      .filter((token) => !/^(?:\d+(?:gb|tb|mhz|hz)|ddr\d|pcie\d*|usb\d*|\d+)$/.test(token)),
  );
}

function findMultiSourceMatch(products: JsonStoreProduct[], candidate: JsonStoreProduct) {
  if (candidate.externalSourceUrl) {
    const exactUrl = products.findIndex((product) => product.externalSourceUrl === candidate.externalSourceUrl);
    if (exactUrl >= 0) return exactUrl;
  }
  const identity = storeProductIdentityKey(candidate);
  const exactIdentity = products.findIndex((product) => storeProductIdentityKey(product) === identity);
  if (exactIdentity >= 0) return exactIdentity;

  const candidateModels = modelTokens(candidate.title);
  if (candidateModels.size === 0) return -1;
  return products.findIndex((product) => {
    const existingModels = modelTokens(product.title);
    return [...candidateModels].some((token) => existingModels.has(token));
  });
}

function mergeLowestPrice(existing: JsonStoreProduct, candidate: JsonStoreProduct) {
  const candidateIsCheaper = candidate.price > 0 && (existing.price <= 0 || candidate.price < existing.price);
  const chosen = candidateIsCheaper ? candidate : existing;
  const price = Math.min(
    ...[existing.price, candidate.price].filter((value) => Number.isFinite(value) && value > 0),
  );
  const possibleOriginalPrices = [
    existing.originalPrice,
    candidate.originalPrice,
    existing.price,
    candidate.price,
  ].filter((value): value is number => Number.isFinite(value) && Number(value) > price);
  const originalPrice = possibleOriginalPrices.length ? Math.max(...possibleOriginalPrices) : undefined;
  return {
    ...existing,
    title: candidate.title.length > existing.title.length ? candidate.title : existing.title,
    brand: existing.brand && existing.brand !== "OptiBid" && existing.brand !== "Torob" && existing.brand !== "Digikala"
      ? existing.brand
      : candidate.brand,
    category: candidate.category !== "نامشخص" ? candidate.category : existing.category,
    summary: candidate.summary.length > existing.summary.length ? candidate.summary : existing.summary,
    description: candidate.description.length > existing.description.length ? candidate.description : existing.description,
    price,
    originalPrice,
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
}

function applyCurrentAggregatedPrice(existing: JsonStoreProduct, candidate: JsonStoreProduct) {
  const merged = mergeLowestPrice(existing, candidate);
  return {
    ...merged,
    price: candidate.price,
    originalPrice:
      candidate.originalPrice && candidate.originalPrice > candidate.price
        ? candidate.originalPrice
        : undefined,
    priceUpdatedAt: candidate.priceUpdatedAt,
    marketReferenceNote: candidate.marketReferenceNote,
    externalSourceUrl: candidate.externalSourceUrl,
    priceHistory: mergeStorePriceHistory(existing.priceHistory, candidate.priceHistory),
  } satisfies JsonStoreProduct;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const links = normalizeLinks(body.links);
    if (links.length === 0) {
      return NextResponse.json(
        { success: false, message: "حداقل یک لینک معتبر وارد کنید. لینک‌ها را با & یا خط جدید جدا کنید." },
        { status: 400 },
      );
    }

    const requestedLimit = Math.max(1, Math.min(50, Number(body.limit || 50)));
    const multiplier = normalizeMultiplier(body.priceMultiplier);
    const warnings: string[] = [];
    const scannedUrls: string[] = [];
    const aggregated: JsonStoreProduct[] = [];
    let rawProducts = 0;

    for (const link of links) {
      let host = "";
      try {
        host = new URL(link).hostname;
      } catch {
        continue;
      }
      const specializedSource = /(?:^|\.)(?:digikala\.com|torob\.com)$/i.test(host.replace(/^www\./, ""));
      const scan = await scanStoreProductsFromUrl(link, {
        limit: requestedLimit,
        fullSite: specializedSource,
        maxPages: specializedSource ? 12 : 6,
        categoryFilters: ["components", "storage"],
      });
      warnings.push(...scan.warnings.map((warning) => `${host}: ${warning}`));
      scannedUrls.push(...scan.scannedUrls);
      const drafts = scan.products.filter((draft) =>
        productMatchesImportCategories(draft, ["components", "storage"]),
      );
      rawProducts += drafts.length;

      for (const draft of drafts) {
        const product = applyMultiplier(importedDraftToStoreProduct(draft), multiplier);
        const matchIndex = findMultiSourceMatch(aggregated, product);
        if (matchIndex >= 0) aggregated[matchIndex] = mergeLowestPrice(aggregated[matchIndex], product);
        else aggregated.push(product);
      }
    }

    if (aggregated.length === 0) {
      const warningSummary = warnings.slice(0, 3).join("؛ ");
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
    let created = 0;
    let updated = 0;
    const existingSlugs = new Set(data.storeProducts.map((product) => product.slug));
    for (const product of aggregated) {
      const matchIndex = findMultiSourceMatch(data.storeProducts, product);
      if (matchIndex >= 0) {
        data.storeProducts[matchIndex] = applyCurrentAggregatedPrice(data.storeProducts[matchIndex], product);
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
      data.storeProducts.push(candidate);
      created += 1;
    }
    await writeOptiBidData(data);
    const activeStoreProducts = data.storeProducts.filter((product) => product.isActive !== false && product.stock > 0).length;

    return NextResponse.json({
      success: true,
      linksCount: links.length,
      rawProducts,
      uniqueProducts: aggregated.length,
      duplicatesRemoved: Math.max(0, rawProducts - aggregated.length),
      created,
      updated,
      activeStoreProducts,
      warnings: warnings.slice(0, 20),
      scannedUrls,
      message: `${links.length.toLocaleString("fa-IR")} لینک بررسی شد؛ ${aggregated.length.toLocaleString("fa-IR")} محصول یکتا با کمترین قیمت انتخاب شد. ${created.toLocaleString("fa-IR")} محصول اضافه و ${updated.toLocaleString("fa-IR")} محصول به‌روزرسانی شد.`,
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
