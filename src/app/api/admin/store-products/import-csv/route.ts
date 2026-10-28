import { NextResponse } from "next/server";
import { decodeCsvBytes } from "@/lib/store-product-csv-encoding";
import { getOptiBidData, writeOptiBidData, type JsonStoreProduct } from "@/lib/json-store";
import { parseEasyScraperCsv } from "@/lib/store-product-csv-import";
import { mergeStorePriceHistory } from "@/lib/store-price-history";
import {
  applyStorePriceFormula,
  normalizeStorePriceMultiplier,
  storedProductMarketPrice,
} from "@/lib/store-pricing";
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
  return normalizeStorePriceMultiplier(value, 1);
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

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function normalizedProductText(product: Pick<JsonStoreProduct, "title" | "brand" | "category" | "specs">) {
  return `${product.title} ${product.brand} ${product.category} ${Object.values(product.specs || {}).join(" ")}`
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .toLowerCase()
    .replace(/\b(rtx|gtx|rx)\s*-?\s*(\d{3,4})\b/g, "$1$2")
    .replace(/\b(?:core\s*)?(i[3579])\s*-?\s*(\d{4,5}[a-z]{0,2})\b/g, "$1-$2")
    .replace(/\b(ryzen\s*[3579])\s*-?\s*(\d{4}[a-z0-9]*)\b/g, (_, family, model) => `${String(family).replace(/\s+/g, "")}-${model}`)
    .replace(/[^a-z0-9آ-ی.+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function capacityKey(text: string) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(tb|gb|ترابایت|گیگابایت)/i);
  if (!match) return "";
  const unit = /tb|ترابایت/i.test(match[2]) ? "tb" : "gb";
  return `${match[1]}${unit}`;
}

function crossSourceProductKey(product: Pick<JsonStoreProduct, "title" | "brand" | "category" | "specs">) {
  const text = normalizedProductText(product);
  const brand = String(product.brand || "").toLowerCase().replace(/[^a-z0-9آ-ی]+/g, "");
  const usefulBrand = /^(?:optibid|digikala|torob|نامشخص)?$/.test(brand) ? "" : brand;
  const packageType = /\btray\b|بدون جعبه/.test(text) ? "tray" : /\bbox\b|با جعبه/.test(text) ? "box" : "";

  const intelCpu = text.match(/\b(i[3579]-\d{4,5}[a-z]{0,2})\b/)?.[1];
  const ryzenCpu = text.match(/\b(ryzen[3579]-\d{4}[a-z0-9]*)\b/)?.[1];
  if (intelCpu || ryzenCpu) return `cpu:${intelCpu || ryzenCpu}:${packageType}`;

  const gpu = text.match(/\b(rtx\d{3,4}|gtx\d{3,4}|rx\d{3,4})\b/)?.[1];
  if (gpu) {
    const suffix = text.match(new RegExp(`\\b${gpu}\\s*(ti|super|xtx|xt)\\b`))?.[1] || "";
    const family = text.match(/\b(dual|prime|tuf|rog|strix|aorus|ventus|gaming|eagle|windforce|nitro|pulse|mech)\b/)?.[1] || "";
    const capacity = capacityKey(text);
    const revision = /\bv2\b/.test(text) ? "v2" : "";
    const overclocked = /\boc\b|اورکلاک/.test(text) ? "oc" : "";
    return usefulBrand
      ? `gpu:${usefulBrand}:${gpu}${suffix}:${capacity}:${family}:${revision}:${overclocked}`
      : "";
  }

  const tokens = text
    .split(" ")
    .filter((token) => /[a-z]/.test(token) && /\d/.test(token) && token.length >= 4)
    .filter((token) => !/^(?:ddr\d|gddr\d|sata\d*|pcie\d*|usb\d*|lga\d+|am\d+|\d+(?:gb|tb|w|mhz|rpm))$/.test(token));
  const capacity = capacityKey(text);
  if (/\bssd\b|nvme|اس اس دی|هارد|hard disk|hdd/.test(text)) {
    const model = tokens.find((token) => !/^(?:ssd|nvme|hdd)/.test(token)) || tokens[0];
    return model ? `storage:${model}:${capacity}` : "";
  }
  if (/مادربرد|motherboard/.test(text)) {
    const model = tokens.find((token) => /^(?:h|b|z|x|a)\d{3}/.test(token)) || tokens[0];
    return model && usefulBrand ? `motherboard:${usefulBrand}:${model}` : "";
  }
  if (/منبع تغذیه|پاور|power supply|\bpsu\b/.test(text)) {
    const model = tokens[0] || "";
    const watt = text.match(/(\d{3,4})\s*(?:w|وات)/)?.[1] || "";
    return model && usefulBrand ? `power:${usefulBrand}:${model}:${watt}` : "";
  }
  if (/رم کامپیوتر|حافظه رم|ram module|memory module/.test(text)) {
    const model = tokens[0] || "";
    const frequency = text.match(/(\d{3,5})\s*mhz/)?.[1] || "";
    return model && usefulBrand ? `ram:${usefulBrand}:${model}:${capacity}:${frequency}` : "";
  }
  return "";
}

// CSV imports contain many similar models. Cross-source matching therefore uses
// strong model fingerprints instead of broad title similarity.
function findMatchingCsvStoreProductIndex(products: JsonStoreProduct[], imported: JsonStoreProduct) {
  if (imported.externalSourceUrl) {
    const sourceMatch = products.findIndex((product) => product.externalSourceUrl === imported.externalSourceUrl);
    if (sourceMatch >= 0) return sourceMatch;
  }
  const idMatch = products.findIndex((product) => product.id === imported.id);
  if (idMatch >= 0) return idMatch;
  const identity = storeProductIdentityKey(imported);
  const identityMatch = products.findIndex((product) => storeProductIdentityKey(product) === identity);
  if (identityMatch >= 0) return identityMatch;
  const crossKey = crossSourceProductKey(imported);
  return crossKey
    ? products.findIndex((product) => crossSourceProductKey(product) === crossKey)
    : -1;
}

function createCsvProductMatchIndex(products: JsonStoreProduct[]) {
  const byUrl = new Map<string, number>();
  const byId = new Map<string, number>();
  const byIdentity = new Map<string, number>();
  const byCrossSource = new Map<string, number>();
  const remember = (product: JsonStoreProduct, index: number) => {
    if (product.externalSourceUrl) byUrl.set(product.externalSourceUrl, index);
    if (product.id) byId.set(product.id, index);
    byIdentity.set(storeProductIdentityKey(product), index);
    const crossKey = crossSourceProductKey(product);
    if (crossKey && !byCrossSource.has(crossKey)) byCrossSource.set(crossKey, index);
  };
  products.forEach(remember);

  return {
    find(product: JsonStoreProduct) {
      if (product.externalSourceUrl) {
        const urlMatch = byUrl.get(product.externalSourceUrl);
        if (urlMatch !== undefined) return urlMatch;
      }
      const idMatch = byId.get(product.id);
      if (idMatch !== undefined) return idMatch;
      const identityMatch = byIdentity.get(storeProductIdentityKey(product));
      if (identityMatch !== undefined) return identityMatch;
      const crossKey = crossSourceProductKey(product);
      return crossKey ? byCrossSource.get(crossKey) ?? -1 : -1;
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
    imageUrls: product.imageUrls || (product.imageUrl ? [product.imageUrl] : []),
    specs: product.specs || {},
    specsCount: Object.keys(product.specs || {}).length,
    summary: product.summary,
    description: product.description,
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
  const existingMarketPrice = storedProductMarketPrice(existing);
  const importedMarketPrice = storedProductMarketPrice(imported);
  const importedIsCheaper = importedMarketPrice > 0 && (
    existingMarketPrice <= 0 || importedMarketPrice < existingMarketPrice
  );
  const chosen = importedIsCheaper ? imported : existing;
  const marketPrice = Math.min(
    ...[existingMarketPrice, importedMarketPrice].filter((value) => Number.isFinite(value) && value > 0),
  );
  const targetMultiplier = normalizePriceMultiplier(imported.priceMultiplier || existing.priceMultiplier);
  const chosenOriginal = Number(chosen.originalPrice || 0);
  const existingBrandIsGeneric = !existing.brand || /^(?:optibid|digikala|torob|نامشخص)$/i.test(existing.brand);
  const merged = {
    ...existing,
    title: imported.title.length > existing.title.length ? imported.title : existing.title,
    brand: existingBrandIsGeneric && imported.brand ? imported.brand : existing.brand,
    category: imported.category && imported.category !== "نامشخص" ? imported.category : existing.category,
    summary: imported.summary.length > existing.summary.length ? imported.summary : existing.summary,
    description: imported.description.length > existing.description.length ? imported.description : existing.description,
    price: chosen.price,
    marketPrice,
    priceMultiplier: chosen.priceMultiplier,
    originalPrice: chosenOriginal > chosen.price && chosenOriginal <= chosen.price * 1.8
      ? chosenOriginal
      : undefined,
    stock: Math.max(existing.stock || 0, imported.stock || 0),
    specs: { ...existing.specs, ...imported.specs },
    badges: Array.from(new Set([
      ...(existing.badges || []).filter((badge) => badge !== "قیمت به‌روز"),
      ...(imported.badges || []).filter((badge) => badge !== "قیمت به‌روز"),
      "قیمت ثبت‌شده",
    ])).slice(0, 6),
    shippingNote: chosen.shippingNote || existing.shippingNote,
    priceUpdatedAt: chosen.priceUpdatedAt,
    marketReferenceNote: chosen.marketReferenceNote,
    externalSourceUrl: chosen.externalSourceUrl || existing.externalSourceUrl,
    imageUrls: Array.from(new Set([
      ...(existing.imageUrls || (existing.imageUrl ? [existing.imageUrl] : [])),
      ...(imported.imageUrls || (imported.imageUrl ? [imported.imageUrl] : [])),
    ])).slice(0, 8),
    imageUrl: existing.imageUrl || imported.imageUrl || imported.imageUrls?.[0],
    priceHistory: mergeStorePriceHistory(existing.priceHistory, imported.priceHistory),
    isActive: true,
  } satisfies JsonStoreProduct;
  return applyStorePriceFormula(merged, marketPrice, targetMultiplier);
}

function activeStoreProductCount(products: JsonStoreProduct[]) {
  return products.filter((product) => product.isActive !== false && product.stock > 0).length;
}

function dedupeStoreProducts(products: JsonStoreProduct[]) {
  const output: JsonStoreProduct[] = [];
  const indexByIdentity = new Map<string, number>();
  let duplicatesRemoved = 0;
  for (const product of products) {
    const crossKey = crossSourceProductKey(product);
    const identity = crossKey
      ? `cross:${crossKey}`
      : product.externalSourceUrl
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
  if (!title || !Number.isFinite(price) || price < 100_000 || price > 1_500_000_000) return null;
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
    if (incoming.length > 6_000) {
      return NextResponse.json({ success: false, message: "در هر درخواست حداکثر ۶۰۰۰ محصول ارسال کنید." }, { status: 413 });
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
    const importedProducts = filteredDrafts.map((draft) => {
      const product = importedDraftToStoreProduct(applyPriceMultiplier(draft, multiplier));
      product.marketPrice = Math.round(draft.price);
      product.priceMultiplier = multiplier;
      if (multiplier !== 1) {
        product.marketReferenceNote = `${product.marketReferenceNote}؛ اعمال ضریب قیمت ${multiplier.toLocaleString("fa-IR")}`;
        product.badges = Array.from(new Set([...(product.badges || []), `ضریب ${multiplier.toLocaleString("fa-IR")}`])).slice(0, 6);
      }
      return product;
    });

    const data = await getOptiBidData();
    data.settings.storePriceMultiplier = multiplier;
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

    const importedProducts = filteredDrafts.map((draft) => {
      const product = importedDraftToStoreProduct(applyPriceMultiplier(draft, multiplier));
      product.marketPrice = Math.round(draft.price);
      product.priceMultiplier = multiplier;
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
    data.settings.storePriceMultiplier = multiplier;
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
