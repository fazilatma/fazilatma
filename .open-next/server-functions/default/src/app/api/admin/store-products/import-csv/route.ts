import { NextResponse } from "next/server";
import { getOptiBidData, writeOptiBidData, type JsonStoreProduct } from "@/lib/json-store";
import { parseEasyScraperCsv } from "@/lib/store-product-csv-import";
import {
  findMatchingStoreProductIndex,
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

function countMatches(value: string, pattern: RegExp) {
  return value.match(pattern)?.length || 0;
}

function mojibakeSignal(value: string) {
  const cp1256Sequences = countMatches(value, /(?:ط§|ط¨|طھ|ط±|ط¯|ط³|ط¹|ط¬|ط²|ط©|طŒ|ط،|ط؛|ظ„|ظ…|ظ†|ظ‡|ظ¾|ظƒ|ظک|غŒ|ع†|ع©|آ«|آ»)/g);
  const westernSequences = countMatches(value, /[ØÙÛÃÂ]/g);
  const denseArabic = countMatches(value, /[طظغع][؀-ۿ]/g);
  return cp1256Sequences * 5 + westernSequences * 4 + denseArabic;
}

function csvDecodeScore(value: string) {
  const sample = value.slice(0, 120_000);
  let persian = 0;
  let replacement = 0;
  let nulls = 0;
  let controls = 0;
  let readableAscii = 0;
  for (const char of sample) {
    const code = char.codePointAt(0) || 0;
    if (code >= 0x0600 && code <= 0x06ff) persian += 1;
    if (code === 0xfffd) replacement += 1;
    if (code === 0) nulls += 1;
    if ((code >= 1 && code <= 8) || code === 0x0b || code === 0x0c || (code >= 0x0e && code <= 0x1f)) controls += 1;
    if ((code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122)) readableAscii += 1;
  }
  const separators = [...sample].filter((char) => char === "," || char === ";" || char === "\t" || char === "\n").length;
  const mojibake = mojibakeSignal(sample);
  return persian * 12 + separators * 0.4 + readableAscii * 0.03 - replacement * 180 - nulls * 140 - controls * 60 - mojibake * 95;
}

function decodeBytes(bytes: Uint8Array, encoding: string) {
  try {
    return stripTextBom(new TextDecoder(encoding).decode(bytes));
  } catch {
    return "";
  }
}

async function decodeCsvUpload(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const candidates: { encoding: string; text: string; score: number }[] = [];

  const hasUtf16LeBom = bytes[0] === 0xff && bytes[1] === 0xfe;
  const hasUtf16BeBom = bytes[0] === 0xfe && bytes[1] === 0xff;
  const nullByteRatio = bytes.length > 0 ? bytes.filter((byte) => byte === 0).length / bytes.length : 0;
  const labels = ["utf-8", "windows-1256"];
  if (hasUtf16LeBom || hasUtf16BeBom || nullByteRatio > 0.05) {
    labels.push("utf-16le", "utf-16be");
  }
  for (const encoding of labels) {
    const text = decodeBytes(bytes, encoding);
    if (text) candidates.push({ encoding, text, score: csvDecodeScore(text) });
  }

  const utf8Candidate = candidates.find((candidate) => candidate.encoding === "utf-8");
  const best =
    !hasUtf16LeBom &&
    !hasUtf16BeBom &&
    nullByteRatio <= 0.05 &&
    utf8Candidate &&
    !utf8Candidate.text.includes("�")
      ? utf8Candidate
      : candidates.sort((a, b) => b.score - a.score)[0] || {
          encoding: "utf-8",
          text: stripTextBom(await file.text()),
          score: 0,
        };

  const warning =
    best.encoding !== "utf-8"
      ? `کدگذاری فایل CSV به‌صورت خودکار ${best.encoding} تشخیص داده شد و متن برای درون‌ریزی به UTF-8 تبدیل شد.`
      : "";

  return { text: best.text, encoding: best.encoding, warning };
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
    badges: Array.from(new Set([...(existing.badges || []), ...(imported.badges || []), "قیمت به‌روز"])).slice(0, 6),
    shippingNote: imported.shippingNote || existing.shippingNote,
    priceUpdatedAt: importedIsNewer ? imported.priceUpdatedAt : existing.priceUpdatedAt,
    marketReferenceNote: importedIsNewer ? imported.marketReferenceNote : existing.marketReferenceNote,
    externalSourceUrl: imported.externalSourceUrl || existing.externalSourceUrl,
    isActive: true,
  } satisfies JsonStoreProduct;
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

async function formDataText(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  if (value instanceof File) return decodeCsvUpload(value);
  return { text: stripTextBom(String(value || fallback)), encoding: "text", warning: "" };
}

export async function POST(request: Request) {
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
        const matchIndex = findMatchingStoreProductIndex(data.storeProducts, product);
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
      const matchIndex = findMatchingStoreProductIndex(data.storeProducts, product);
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
    await writeOptiBidData(data);

    return NextResponse.json({
      success: true,
      mode: "import",
      sourceHost: sourceLabel,
      csvEncoding: csvInput.encoding,
      products: changedProducts,
      selectedCount: selectedProducts.length,
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
