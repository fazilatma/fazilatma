import { NextResponse } from "next/server";
import {
  getOptiBidData,
  writeOptiBidData,
  type JsonStoreProduct,
} from "@/lib/json-store";
import {
  findMatchingStoreProductIndex,
  importedDraftToStoreProduct,
  normalizeProductImportCategories,
  productImportCategoryKey,
  productMatchesImportCategories,
  scanStoreProductsFromUrl,
  storeProductIdentityKey,
  type ImportedStoreProductDraft,
} from "@/lib/store-product-import";

export const dynamic = "force-dynamic";

type ImportAction = "preview" | "import";

type ImportBody = {
  url?: string;
  limit?: number;
  action?: ImportAction;
  strategy?: "merge" | "add-only";
  scanMode?: "page" | "full-site";
  fullSite?: boolean;
  priceMultiplier?: number;
  categoryFilters?: string[];
  selectedProductKeys?: string[];
};

function productSelectionKey(product: JsonStoreProduct) {
  return `${product.id}|${product.externalSourceUrl || product.slug}|${product.title}`;
}

function publicProduct(product: JsonStoreProduct, index: number) {
  return {
    index,
    selectionKey: productSelectionKey(product),
    id: product.id,
    slug: product.slug,
    title: product.title,
    brand: product.brand,
    category: product.category,
    price: product.price,
    originalPrice: product.originalPrice,
    stock: product.stock,
    externalSourceUrl: product.externalSourceUrl,
    imageUrl: product.imageUrl,
    marketReferenceNote: product.marketReferenceNote,
    importCategory: productImportCategoryKey({
      title: product.title,
      brand: product.brand,
      category: product.category,
      specs: product.specs || {},
    }),
  };
}

function normalizePriceMultiplier(value: unknown) {
  const number = Number(value || 1);
  if (!Number.isFinite(number) || number <= 0) return 1;
  return Math.max(0.1, Math.min(10, number));
}

function roundToman(value: number) {
  return Math.max(0, Math.round(Number(value || 0) / 10_000) * 10_000);
}

function applyPriceMultiplier(
  draft: ImportedStoreProductDraft,
  priceMultiplier: number,
): ImportedStoreProductDraft {
  if (priceMultiplier === 1) return draft;
  return {
    ...draft,
    price: roundToman(draft.price * priceMultiplier),
    originalPrice: draft.originalPrice
      ? roundToman(draft.originalPrice * priceMultiplier)
      : undefined,
  };
}

function mergeProducts(existing: JsonStoreProduct, imported: JsonStoreProduct) {
  const importedIsNewer =
    String(imported.priceUpdatedAt || "") >= String(existing.priceUpdatedAt || "");
  return {
    ...existing,
    title: existing.title || imported.title,
    brand: existing.brand || imported.brand,
    category: existing.category || imported.category,
    summary: imported.summary || existing.summary,
    description:
      imported.description.length > existing.description.length
        ? imported.description
        : existing.description,
    price: importedIsNewer ? imported.price : existing.price,
    originalPrice: importedIsNewer ? imported.originalPrice : existing.originalPrice,
    stock: Math.max(existing.stock || 0, imported.stock || 0),
    specs: { ...existing.specs, ...imported.specs },
    badges: Array.from(
      new Set([
        ...(existing.badges || []).filter((badge) => badge !== "قیمت به‌روز"),
        ...(imported.badges || []).filter((badge) => badge !== "قیمت به‌روز"),
        "قیمت ثبت‌شده",
      ]),
    ).slice(0, 6),
    shippingNote: imported.shippingNote || existing.shippingNote,
    priceUpdatedAt: importedIsNewer ? imported.priceUpdatedAt : existing.priceUpdatedAt,
    marketReferenceNote: importedIsNewer
      ? imported.marketReferenceNote
      : existing.marketReferenceNote,
    externalSourceUrl: imported.externalSourceUrl || existing.externalSourceUrl,
    imageUrl: imported.imageUrl || existing.imageUrl,
    isActive: true,
  } satisfies JsonStoreProduct;
}

function activeStoreProductCount(products: JsonStoreProduct[]) {
  return products.filter((product) => product.isActive !== false && product.stock > 0).length;
}

function dedupeStoreProducts(products: JsonStoreProduct[]) {
  const output: JsonStoreProduct[] = [];
  const indexByIdentity = new Map<string, number>();
  let duplicatesRemoved = 0;

  for (const product of products) {
    const identity = storeProductIdentityKey(product);
    const existingIndex = indexByIdentity.get(identity);
    if (existingIndex === undefined) {
      indexByIdentity.set(identity, output.length);
      output.push(product);
      continue;
    }
    output[existingIndex] = mergeProducts(output[existingIndex], product);
    duplicatesRemoved += 1;
  }

  return { products: output, duplicatesRemoved };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ImportBody;
    const url = String(body.url || "").trim();
    if (!url) {
      return NextResponse.json(
        { success: false, message: "لینک فروشگاه را وارد کنید." },
        { status: 400 },
      );
    }
    const action: ImportAction = body.action === "import" ? "import" : "preview";
    const fullSite = body.fullSite === true || body.scanMode === "full-site";
    const requestedLimit = Math.max(1, Number(body.limit || (fullSite ? 50 : 20)));
    const limit = Math.max(1, Math.min(50, requestedLimit));
    const strategy = body.strategy === "add-only" ? "add-only" : "merge";
    const priceMultiplier = normalizePriceMultiplier(body.priceMultiplier);
    const categoryFilters = normalizeProductImportCategories(body.categoryFilters);

    const scan = await scanStoreProductsFromUrl(url, {
      limit,
      fullSite,
      maxPages: fullSite ? Math.min(90, limit + 40) : Math.min(35, limit + 10),
      categoryFilters,
    });
    if (requestedLimit > limit) {
      scan.warnings.push(
        `برای جلوگیری از خطای محدودیت منابع Cloudflare، این درخواست به ${limit.toLocaleString("fa-IR")} محصول محدود شد. برای واردسازی کامل، مرحله‌ای یا روی سرور اختصاصی اجرا کنید.`,
      );
    }
    const filteredDrafts = scan.products.filter((draft) =>
      productMatchesImportCategories(draft, categoryFilters),
    );
    if (categoryFilters.length > 0 && filteredDrafts.length < scan.products.length) {
      scan.warnings.push(
        `${(scan.products.length - filteredDrafts.length).toLocaleString("fa-IR")} محصول به دلیل عدم تطابق با دسته‌های انتخابی نادیده گرفته شد.`,
      );
    }

    const importedProducts = filteredDrafts
      .map((draft) => applyPriceMultiplier(draft, priceMultiplier))
      .map((draft) => {
        const product = importedDraftToStoreProduct(draft);
        if (priceMultiplier !== 1) {
          product.marketReferenceNote = `${product.marketReferenceNote}؛ اعمال ضریب قیمت ${priceMultiplier.toLocaleString("fa-IR")}`;
          product.badges = Array.from(
            new Set([...(product.badges || []), `ضریب ${priceMultiplier.toLocaleString("fa-IR")}`]),
          ).slice(0, 6);
        }
        return product;
      });
    const selectedKeySet = new Set(
      Array.isArray(body.selectedProductKeys)
        ? body.selectedProductKeys.map(String)
        : [],
    );
    const shouldFilterBySelection = action === "import" && Array.isArray(body.selectedProductKeys);
    const selectedProducts = shouldFilterBySelection
      ? importedProducts.filter((product) => selectedKeySet.has(productSelectionKey(product)))
      : importedProducts;

    if (action === "import" && shouldFilterBySelection && selectedProducts.length === 0) {
      return NextResponse.json(
        { success: false, message: "هیچ محصولی از پیش‌نمایش انتخاب نشده یا انتخاب‌ها با اسکن فعلی تطابق ندارند." },
        { status: 400 },
      );
    }

    if (action === "preview") {
      const data = await getOptiBidData();
      const preview = importedProducts.map((product, index) => {
        const matchIndex = findMatchingStoreProductIndex(data.storeProducts, product);
        return {
          ...publicProduct(product, index),
          action: matchIndex >= 0 ? "update" : "create",
          matchedProduct:
            matchIndex >= 0
              ? {
                  id: data.storeProducts[matchIndex].id,
                  title: data.storeProducts[matchIndex].title,
                  price: data.storeProducts[matchIndex].price,
                  slug: data.storeProducts[matchIndex].slug,
                }
              : null,
        };
      });
      return NextResponse.json({
        success: true,
        mode: "preview",
        scanMode: fullSite ? "full-site" : "page",
        priceMultiplier,
        categoryFilters,
        sourceUrl: scan.sourceUrl,
        sourceHost: scan.sourceHost,
        scannedUrls: scan.scannedUrls,
        products: preview,
        warnings: scan.warnings,
        message: `${preview.length.toLocaleString("fa-IR")} محصول برای پیش‌نمایش پیدا شد.`,
      });
    }

    const data = await getOptiBidData();
    let created = 0;
    let updated = 0;
    const changedProducts: ReturnType<typeof publicProduct>[] = [];

    for (const product of selectedProducts) {
      const matchIndex = findMatchingStoreProductIndex(data.storeProducts, product);
      if (matchIndex >= 0 && strategy === "merge") {
        data.storeProducts[matchIndex] = mergeProducts(
          data.storeProducts[matchIndex],
          product,
        );
        updated += 1;
        changedProducts.push(publicProduct(data.storeProducts[matchIndex], matchIndex));
      } else {
        let candidate = product;
        const existingSlugs = new Set(data.storeProducts.map((item) => item.slug));
        let suffix = 2;
        while (existingSlugs.has(candidate.slug)) {
          candidate = { ...candidate, slug: `${product.slug}-${suffix}` };
          suffix += 1;
        }
        data.storeProducts.push(candidate);
        created += 1;
        changedProducts.push(publicProduct(candidate, data.storeProducts.length - 1));
      }
    }

    const deduped = dedupeStoreProducts(data.storeProducts);
    data.storeProducts = deduped.products;
    const activeCount = activeStoreProductCount(data.storeProducts);
    await writeOptiBidData(data);

    return NextResponse.json({
      success: true,
      mode: "import",
      scanMode: fullSite ? "full-site" : "page",
      priceMultiplier,
      categoryFilters,
      sourceUrl: scan.sourceUrl,
      sourceHost: scan.sourceHost,
      scannedUrls: scan.scannedUrls,
      products: changedProducts,
      selectedCount: selectedProducts.length,
      activeStoreProducts: activeCount,
      created,
      updated,
      duplicatesRemoved: deduped.duplicatesRemoved,
      warnings: scan.warnings,
      message: `${created.toLocaleString("fa-IR")} محصول جدید اضافه شد، ${updated.toLocaleString("fa-IR")} محصول به‌روزرسانی شد و ${deduped.duplicatesRemoved.toLocaleString("fa-IR")} مورد تکراری هوشمند حذف/ادغام شد.`,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown product import error";
    return NextResponse.json(
      {
        success: false,
        message:
          "درون‌ریزی محصولات ناموفق بود. لینک را بررسی کنید یا لینک مستقیم صفحه محصول/دسته‌بندی/sitemap را وارد کنید.",
        detail,
      },
      { status: 500 },
    );
  }
}
