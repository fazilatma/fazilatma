import { NextResponse } from "next/server";
import {
  crawlStoreProductPage,
  normalizeProductImportCategories,
  productMatchesImportCategories,
  type ImportedStoreProductDraft,
} from "@/lib/store-product-import";

export const dynamic = "force-dynamic";

function draftKey(draft: ImportedStoreProductDraft) {
  return `${draft.externalSourceUrl || ""}|${draft.brand}|${draft.title}`.toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const urls = Array.isArray(body.urls)
      ? body.urls.map(String).map((url) => url.trim()).filter(Boolean).slice(0, 12)
      : [];
    if (!urls.length) {
      return NextResponse.json(
        { success: false, message: "حداقل یک لینک برای این مرحلهٔ استخراج ارسال کنید." },
        { status: 400 },
      );
    }
    const discoverSitemap = body.discoverSitemap === true;
    if (discoverSitemap && urls.length > 1) {
      return NextResponse.json(
        { success: false, message: "کشف sitemap باید فقط برای لینک اصلی اجرا شود." },
        { status: 400 },
      );
    }
    const linkLimit = Math.max(20, Math.min(10_000, Number(body.linkLimit || 500)));
    const categoryFilters = normalizeProductImportCategories(body.categoryFilters);
    const results = await Promise.allSettled(
      urls.map((url) => crawlStoreProductPage(url, { discoverSitemap, linkLimit })),
    );
    const products: ImportedStoreProductDraft[] = [];
    const productUrls = new Set<string>();
    const pageUrls = new Set<string>();
    const scannedUrls: string[] = [];
    const warnings: string[] = [];

    for (let index = 0; index < results.length; index += 1) {
      const result = results[index];
      if (result.status === "rejected") {
        warnings.push(`خواندن ${urls[index]} ناموفق بود: ${result.reason instanceof Error ? result.reason.message : "خطا"}`);
        continue;
      }
      scannedUrls.push(result.value.pageUrl);
      warnings.push(...result.value.warnings);
      result.value.products
        .filter((draft) => categoryFilters.length === 0 || productMatchesImportCategories(draft, categoryFilters))
        .forEach((draft) => products.push(draft));
      result.value.productUrls.forEach((url) => productUrls.add(url));
      result.value.pageUrls.forEach((url) => pageUrls.add(url));
    }

    const uniqueProducts = [...new Map(products.map((draft) => [draftKey(draft), draft])).values()];
    return NextResponse.json(
      {
        success: true,
        products: uniqueProducts,
        productUrls: [...productUrls],
        pageUrls: [...pageUrls],
        scannedUrls,
        warnings: warnings.slice(0, 30),
        message: `${uniqueProducts.length.toLocaleString("fa-IR")} محصول از ${scannedUrls.length.toLocaleString("fa-IR")} صفحه در این مرحله استخراج شد.`,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "مرحلهٔ استخراج گروهی ناموفق بود.",
        detail: error instanceof Error ? error.message : "Unknown crawl batch error",
      },
      { status: 500 },
    );
  }
}
