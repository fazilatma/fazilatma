import { NextResponse } from "next/server";
import { getJsonCatalogCategories } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await getJsonCatalogCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message: "خواندن دسته‌بندی‌ها ناموفق بود.", detail },
      { status: 500 },
    );
  }
}
