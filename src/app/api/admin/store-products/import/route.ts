import { NextResponse } from "next/server";
import {
  getOptiBidData,
  writeOptiBidData,
  type JsonStoreProduct,
} from "@/lib/json-store";
import {
  findMatchingStoreProductIndex,
  importedDraftToStoreProduct,
  scanStoreProductsFromUrl,
} from "@/lib/store-product-import";

export const dynamic = "force-dynamic";

type ImportAction = "preview" | "import";

type ImportBody = {
  url?: string;
  limit?: number;
  action?: ImportAction;
  strategy?: "merge" | "add-only";
};

function publicProduct(product: JsonStoreProduct, index: number) {
  return {
    index,
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
  };
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
    const limit = Math.max(1, Math.min(50, Number(body.limit || 20)));
    const strategy = body.strategy === "add-only" ? "add-only" : "merge";

    const scan = await scanStoreProductsFromUrl(url, { limit });
    const importedProducts = scan.products.map(importedDraftToStoreProduct);

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

    for (const product of importedProducts) {
      const matchIndex = findMatchingStoreProductIndex(data.storeProducts, product);
      if (matchIndex >= 0 && strategy === "merge") {
        const existing = data.storeProducts[matchIndex];
        data.storeProducts[matchIndex] = {
          ...existing,
          title: existing.title || product.title,
          brand: existing.brand || product.brand,
          category: existing.category || product.category,
          summary: product.summary || existing.summary,
          description:
            product.description.length > existing.description.length
              ? product.description
              : existing.description,
          price: product.price,
          originalPrice: product.originalPrice,
          stock: product.stock,
          specs: { ...existing.specs, ...product.specs },
          badges: Array.from(new Set([...(existing.badges || []), "قیمت به‌روز"])).slice(0, 6),
          shippingNote: product.shippingNote,
          priceUpdatedAt: product.priceUpdatedAt,
          marketReferenceNote: product.marketReferenceNote,
          externalSourceUrl: product.externalSourceUrl,
          isActive: true,
        };
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

    await writeOptiBidData(data);

    return NextResponse.json({
      success: true,
      mode: "import",
      sourceUrl: scan.sourceUrl,
      sourceHost: scan.sourceHost,
      scannedUrls: scan.scannedUrls,
      products: changedProducts,
      created,
      updated,
      warnings: scan.warnings,
      message: `${created.toLocaleString("fa-IR")} محصول جدید اضافه شد و ${updated.toLocaleString("fa-IR")} محصول به‌روزرسانی شد.`,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown product import error";
    return NextResponse.json(
      {
        success: false,
        message:
          "درون‌ریزی محصولات ناموفق بود. لینک را بررسی کنید یا لینک مستقیم صفحه محصول/دسته‌بندی را وارد کنید.",
        detail,
      },
      { status: 500 },
    );
  }
}
