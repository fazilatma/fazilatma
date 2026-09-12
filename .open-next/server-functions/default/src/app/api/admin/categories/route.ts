import { NextResponse } from "next/server";
import {
  getJsonCatalogCategories,
  updateJsonCatalogCategories,
} from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await getJsonCatalogCategories({ includeInactive: true });
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message: "خواندن دسته‌بندی‌ها ناموفق بود.", detail },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const categories = await updateJsonCatalogCategories(body.categories);
    return NextResponse.json({
      success: true,
      categories,
      message: "دسته‌بندی‌ها و زیردسته‌ها با موفقیت ذخیره شدند.",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message: "ذخیره دسته‌بندی‌ها ناموفق بود.", detail },
      { status: 400 },
    );
  }
}
