import { NextResponse } from "next/server";
import {
  fetchTorobBrowsePageDrafts,
  productMatchesComputerPartFilters,
  productMatchesImportCategories,
  type ProductImportCategoryKey,
} from "@/lib/store-product-import";
import { STORE_SOURCE_PRODUCT_PARTS } from "@/lib/source-link-parser";

export const dynamic = "force-dynamic";

const allowedParts = new Set<string>(STORE_SOURCE_PRODUCT_PARTS);

function categoryFiltersForParts(parts: string[]): ProductImportCategoryKey[] {
  const categories: ProductImportCategoryKey[] = ["components", "storage"];
  if (parts.includes("laptop")) categories.push("laptop");
  if (parts.includes("desktop")) categories.push("desktop");
  return categories;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const url = String(body.url || "").trim();
    const page = Math.max(1, Math.min(500, Math.floor(Number(body.page || 1))));
    const parts = Array.isArray(body.parts)
      ? [...new Set(body.parts.map((part) => String(part).trim().toLowerCase()).filter((part) => allowedParts.has(part)))]
      : [];
    const result = await fetchTorobBrowsePageDrafts(url, page);
    const categories = categoryFiltersForParts(parts);
    const products = result.products.filter((draft) =>
      productMatchesImportCategories(draft, categories) &&
      productMatchesComputerPartFilters(draft, parts),
    );
    return NextResponse.json({
      success: true,
      ...result,
      products,
      filteredCount: result.rawCount - products.length,
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خواندن این صفحه از ترب ناموفق بود.",
        detail: error instanceof Error ? error.message : "Unknown Torob page error",
      },
      { status: 502 },
    );
  }
}
