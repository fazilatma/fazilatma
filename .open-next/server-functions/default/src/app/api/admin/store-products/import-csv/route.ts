import { NextResponse } from "next/server";
import { decodeCsvBytes } from "@/lib/store-product-csv-encoding";
import { getOptiBidData, writeOptiBidData, type JsonStoreProduct } from "@/lib/json-store";
import { parseEasyScraperCsv } from "@/lib/store-product-csv-import";
import { mergeStorePriceHistory } from "@/lib/store-price-history";
import {
  importedDraftToStoreProduct,
  normalizeProductImportCategories,
  productImportCategoryKey,
  productMatchesImportCategories,
  storeProductIdentityKey,
  type ImportedStoreProductDraft,
} from "@/lib/store-product-import";

export const dynamic = "force-dynamic";

type ImportAction = "preview" | "import";

function normalizePriceMultiplier(value: unknown) {
  const number = Number(value || 1);
  if (!Number.isFinite(number) || number <= 0) return 1;
  return Math.max(0.1, Math.min(10, number));
}

function roundToman(value: number) {
  return Math.max(0, Math.round(Number(value || 0) / 10_000) * 10_000);
}

function applyPriceMultiplier(draft: ImportedStoreProductDraft, multiplier: number) {
  if (multiplier === 1) return draft;
  return {
    ...draft,
    price: roundToman(draft.price * multiplier),
    originalPrice: draft.originalPrice ? roundToman(draft.originalPrice * multiplier) : undefined,
  };
}

function productSelectionKey(product: JsonStoreProduct) {
  return `${product.id}|${product.externalSourceUrl || product.slug}|${product.title}`;
}

// CSV imports often contain many related models from the same brand. Fuzzy title
// matching can incorrectly merge dozens of distinct rows; CSV matching must be strict.
function findMatchingCsvStoreProductIndex(products: JsonStoreProduct[], imported: JsonStoreProduct) {
  if (imported.externalSourceUrl) {
    // A different source URL is a distinct catalog entry, even when its title is similar.
    return products.findIndex((product) => product.externalSourceUrl === imported.externalSourceUrl);
  }
  const idMatch = products.findIndex((product) => product.id === imported.id);
  if (idMatch >= 0) return idMatch;
  const identity = storeProductIdentityKey(imported);
  return products.findIndex((product) => storeProductIdentityKey(product) === identity);
}

function createCsvProductMatchIndex(products: JsonStoreProduct[]) {
  const byUrl = new Map<string, number>();
  const byId = new Map<string, number>();
  const byIdentity = new Map<string, number>();
  const remember = (product: JsonStoreProduct, index: number) => {
    if (product.externalSourceUrl) byUrl.set(product.externalSourceUrl, index);
    if (product.id) byId.set(product.id, index);
    byIdentity.set(storeProductIdentityKey(product), index);
  };
  products.forEach(remember);

  return {
    find(product: JsonStoreProduct) {
      if (product.externalSourceUrl) return byUrl.get(product.externalSourceUrl) ?? -1;
      return byId.get(product.id) ?? byIdentity.get(storeProductIdentityKey(product)) ?? -1;
    },
    remember,
  };
}

function parseJsonStringArray(value: FormDataEntryValue | null) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function stripTextBom(value: string) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

async function decodeCsvUpload(file: File) {
  return decodeCsvBytes(new Uint8Array(await file.arrayBuffer()));
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

function mergeProducts(existing: JsonStoreProduct, imported: JsonStoreProduct) {
  const importedIsNewer = String(imported.priceUpdatedAt || "") >= String(existing.priceUpdatedAt || "");
  return {
    ...existing,
    title: existing.title || imported.title,
    brand: existing.brand || imported.brand,
    category: existing.category || imported.category,
    summary: imported.summary || existing.summary,
    description: imported.description.length > existing.description.length ? imported.description : existing.description,
    price: importedIsNewer ? imported.price : existing.price,
    originalPrice: importedIsNewer ? imported.originalPrice : existing.originalPrice,
    stock: Math.max(existing.stock || 0, imported.stock || 0),
    specs: { ...existing.specs, ...imported.specs },
    badges: Array.from(new Set([
      ...(existing.badges || []).filter((badge) => badge !== "قیمت به‌روز"),
      ...(imported.badges || []).filter((badge) => badge !== "قیمت به‌روز"),
      "قیمت ثبت‌شده",
    ])).slice(0, 6),
    shippingNote: imported.shippingNote || existing.shippingNote,
    priceUpdatedAt: importedIsNewer ? imported.priceUpdatedAt : existing.priceUpdatedAt,
    marketReferenceNote: importedIsNewer ? imported.marketReferenceNote : existing.marketReferenceNote,
    externalSourceUrl: imported.externalSourceUrl || existing.externalSourceUrl,
    imageUrl: imported.imageUrl || existing.imageUrl,
    priceHistory: mergeStorePriceHistory(existing.priceHistory, imported.priceHistory),
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
    const identity = product.externalSourceUrl
      ? `url:${product.externalSourceUrl}`
      : `identity:${storeProductIdentityKey(product)}`;
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

async function formDataText(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  if (value instanceof File) return decodeCsvUpload(value);
  return { text: stripTextBom(String(value || fallback)), encoding: "text", warning: "" };
}

function normalizeRemoteImageUrl(value: unknown) {
  try {
    const url = new URL(String(value || "").trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function normalizeDraftPayload(value: unknown): ImportedStoreProductDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const title = String(record.title || "").trim().slice(0, 180);
  const price = Number(record.price);
  if (!title || !Number.isFinite(price) || price < 100_000 || price > 1_000_000_000) return null;
  const rawSpecs = record.specs && typeof record.specs === "object" && !Array.isArray(record.specs)
    ? record.specs as Record<string, unknown>
    : {};
  const specs = Object.fromEntries(
    Object.entries(rawSpecs).slice(0, 40).map(([key, item]) => [
      String(key).slice(0, 60),
      String(item ?? "").slice(0, 240),
    ]),
  );
  const stock = Number(record.stock ?? 5);
  return {
    title,
    brand: String(record.brand || "Digikala").trim().slice(0, 80),
    category: String(record.category || "نامشخص").trim().slice(0, 100),
    summary: String(record.summary || title).trim().slice(0, 240),
    description: String(record.description || record.summary || title).trim().slice(0, 1200),
    price,
    originalPrice: Number.isFinite(Number(record.originalPrice)) && Number(record.originalPrice) > price
      ? Number(record.originalPrice)
      : undefined,
    imageUrl: normalizeRemoteImageUrl(record.imageUrl),
    stock: Number.isFinite(stock) ? Math.max(0, Math.min(1_000_000, Math.floor(stock))) : 5,
    specs,
    externalSourceUrl: String(record.externalSourceUrl || "").trim().slice(0, 2000),
    sourceHost: String(record.sourceHost || "digikala.com").trim().slice(0, 255),
    currency: "IRT",
  };
}

async function importPreparedCsvBatch(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>;
    const incoming = Array.isArray(payload.products) ? payload.products : [];
    if (!incoming.length) {
      return NextResponse.json({ success: false, message: "این دسته محصولی برای درون‌ریزی ندارد." }, { status: 400 });
    }
    if (incoming.length > 1_000) {
      return NextResponse.json({ success: false, message: "در هر درخواست حداکثر ۱۰۰۰ محصول ارسال کنید." }, { status: 413 });
    }

    const normalizedDrafts = incoming.map(normalizeDraftPayload).filter((item): item is ImportedStoreProductDraft => Boolean(item));
    const strategy = payload.strategy === "add-only" ? "add-only" : "merge";
    const multiplier = normalizePriceMultiplier(payload.priceMultiplier);
    const categoryFilters = normalizeProductImportCategories(
      Array.isArray(payload.categoryFilters) ? payload.categoryFilters.map(String) : [],
    );
    const filteredDrafts = normalizedDrafts.filter((draft) => productMatchesImportCategories(draft, categoryFilters));
    if (!filteredDrafts.length) {
      return NextResponse.json(
        { success: false, message: "در این دسته محصول معتبری با دسته‌بندی‌های انتخاب‌شده پیدا نشد." },
        { status: 400 },
      );
    }

    const sourceLabel = String(payload.sourceLabel || "digikala-easy-scraper").slice(0, 160);
    const importedProducts = filteredDrafts.map((draft) => applyPriceMultiplier(draft, multiplier)).map((draft) => {
      const product = importedDraftToStoreProduct(draft);
      if (multiplier !== 1) {
        product.marketReferenceNote = `${product.marketReferenceNote}؛ اعمال ضریب قیمت ${multiplier.toLocaleString("fa-IR")}`;
        product.badges = Array.from(new Set([...(product.badges || []), `ضریب ${multiplier.toLocaleString("fa-IR")}`])).slice(0, 6);
      }
      return product;
    });

    const data = await getOptiBidData();
    let created = 0;
    let updated = 0;
    let skipped = incoming.length - filteredDrafts.length;
    const existingSlugs = new Set(data.storeProducts.map((item) => item.slug));
    const csvProductIndex = createCsvProductMatchIndex(data.storeProducts);
    for (const product of importedProducts) {
      const matchIndex = csvProductIndex.find(product);
      if (matchIndex >= 0) {
        if (strategy === "merge") {
          data.storeProducts[matchIndex] = mergeProducts(data.storeProducts[matchIndex], product);
          updated += 1;
        } else {
          // Make retries safe: add-only skips products already stored by an earlier request.
          skipped += 1;
        }
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
      csvProductIndex.remember(candidate, data.storeProducts.length - 1);
      created += 1;
    }

    const deduped = dedupeStoreProducts(data.storeProducts);
    data.storeProducts = deduped.products;
    await writeOptiBidData(data);
    const activeCount = activeStoreProductCount(data.storeProducts);
    const warnings = normalizedDrafts.length < incoming.length
      ? [`${(incoming.length - normalizedDrafts.length).toLocaleString("fa-IR")} ردیف نامعتبر در این دسته رد شد.`]
      : [];

    return NextResponse.json({
      success: true,
      mode: "import-batch",
      sourceHost: sourceLabel,
      selectedCount: filteredDrafts.length,
      imageCount: importedProducts.filter((product) => Boolean(product.imageUrl)).length,
      activeStoreProducts: activeCount,
      created,
      updated,
      skipped,
      duplicatesRemoved: deduped.duplicatesRemoved,
      warnings,
      priceMultiplier: multiplier,
      message: `${created.toLocaleString("fa-IR")} محصول اضافه شد، ${updated.toLocaleString("fa-IR")} مورد به‌روزرسانی شد و ${skipped.toLocaleString("fa-IR")} مورد تکراری/نامعتبر نادیده گرفته شد.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "ثبت این دسته از محصولات CSV ناموفق بود.",
        detail: error instanceof Error ? error.message : "Unknown CSV batch import error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (request.headers.get("content-type")?.includes("application/json")) {
    return importPreparedCsvBatch(request);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const csvInput = file instanceof File ? await decodeCsvUpload(file) : await formDataText(formData, "csvText");
    const csvText = csvInput.text;
    if (!csvText.trim()) {
      return NextResponse.json({ success: false, message: "فایل CSV یا متن CSV را ارسال کنید." }, { status: 400 });
    }

    const action: ImportAction = formData.get("action") === "import" ? "import" : "preview";
    const strategy = formData.get("strategy") === "add-only" ? "add-only" : "merge";
    const multiplier = normalizePriceMultiplier(formData.get("priceMultiplier"));
    const categoryFilters = normalizeProductImportCategories(parseJsonStringArray(formData.get("categoryFilters")));
    const sourceLabel = String(formData.get("sourceLabel") || (file instanceof File ? file.name : "easy-scraper"));

    const parsed = parseEasyScraperCsv(csvText, { sourceLabel });
    const filteredDrafts = parsed.products.filter((draft) => productMatchesImportCategories(draft, categoryFilters));
    const warnings = [
      ...(csvInput.warning ? [csvInput.warning] : []),
      ...parsed.warnings,
    ];
    if (categoryFilters.length > 0 && filteredDrafts.length < parsed.products.length) {
      warnings.push(`${(parsed.products.length - filteredDrafts.length).toLocaleString("fa-IR")} محصول CSV به دلیل عدم تطابق با دسته‌های انتخابی نادیده گرفته شد.`);
    }

    const importedProducts = filteredDrafts.map((draft) => applyPriceMultiplier(draft, multiplier)).map((draft) => {
      const product = importedDraftToStoreProduct(draft);
      if (multiplier !== 1) {
        product.marketReferenceNote = `${product.marketReferenceNote}؛ اعمال ضریب قیمت ${multiplier.toLocaleString("fa-IR")}`;
        product.badges = Array.from(new Set([...(product.badges || []), `ضریب ${multiplier.toLocaleString("fa-IR")}`])).slice(0, 6);
      }
      return product;
    });
    const selectedProductKeys = new Set(parseJsonStringArray(formData.get("selectedProductKeys")));
    const shouldFilterBySelection = action === "import" && formData.has("selectedProductKeys");
    const selectedProducts = shouldFilterBySelection
      ? importedProducts.filter((product) => selectedProductKeys.has(productSelectionKey(product)))
      : importedProducts;

    if (action === "import" && shouldFilterBySelection && selectedProducts.length === 0) {
      return NextResponse.json(
        { success: false, message: "هیچ محصولی از پیش‌نمایش CSV انتخاب نشده یا انتخاب‌ها با فایل فعلی تطابق ندارند." },
        { status: 400 },
      );
    }

    if (action === "preview") {
      const data = await getOptiBidData();
      const products = importedProducts.map((product, index) => {
        const matchIndex = findMatchingCsvStoreProductIndex(data.storeProducts, product);
        return {
          ...publicProduct(product, index),
          action: matchIndex >= 0 ? "update" : "create",
          matchedProduct: matchIndex >= 0 ? {
            id: data.storeProducts[matchIndex].id,
            title: data.storeProducts[matchIndex].title,
            price: data.storeProducts[matchIndex].price,
            slug: data.storeProducts[matchIndex].slug,
          } : null,
        };
      });
      return NextResponse.json({
        success: true,
        mode: "preview",
        sourceHost: sourceLabel,
        csvEncoding: csvInput.encoding,
        products,
        warnings,
        priceMultiplier: multiplier,
        message: `${products.length.toLocaleString("fa-IR")} محصول از CSV برای پیش‌نمایش آماده شد.`,
      });
    }

    const data = await getOptiBidData();
    let created = 0;
    let updated = 0;
    const changedProducts: ReturnType<typeof publicProduct>[] = [];
    for (const product of selectedProducts) {
      const matchIndex = findMatchingCsvStoreProductIndex(data.storeProducts, product);
      if (matchIndex >= 0 && strategy === "merge") {
        data.storeProducts[matchIndex] = mergeProducts(data.storeProducts[matchIndex], product);
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
      sourceHost: sourceLabel,
      csvEncoding: csvInput.encoding,
      products: changedProducts,
      selectedCount: selectedProducts.length,
      activeStoreProducts: activeCount,
      created,
      updated,
      duplicatesRemoved: deduped.duplicatesRemoved,
      warnings,
      priceMultiplier: multiplier,
      message: `${created.toLocaleString("fa-IR")} محصول از CSV اضافه شد، ${updated.toLocaleString("fa-IR")} محصول به‌روزرسانی شد و ${deduped.duplicatesRemoved.toLocaleString("fa-IR")} تکراری ادغام شد.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "درون‌ریزی CSV ناموفق بود. فایل خروجی Easy Scraper را بررسی کنید.",
        detail: error instanceof Error ? error.message : "Unknown CSV import error",
      },
      { status: 500 },
    );
  }
}
