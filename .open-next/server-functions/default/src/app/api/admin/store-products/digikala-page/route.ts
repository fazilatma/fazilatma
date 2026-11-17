import { NextResponse } from "next/server";
import { fetchDigikalaCategoryPageDrafts } from "@/lib/store-product-import";

export const dynamic = "force-dynamic";

const allowedSlugs = new Set([
  "processor",
  "graphics-card",
  "ram",
  "motherboard",
  "internal-ssd",
  "internal-hard-drive",
  "psu",
  "computer-chassis",
  "cooling-system",
]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = String(searchParams.get("slug") || "").toLowerCase();
    const page = Math.max(1, Math.floor(Number(searchParams.get("page") || 1)));
    if (!allowedSlugs.has(slug)) {
      return NextResponse.json({ success: false, message: "زیرگروه دیجی‌کالا معتبر نیست." }, { status: 400 });
    }
    const result = await fetchDigikalaCategoryPageDrafts(slug, page);
    return NextResponse.json({ success: true, slug, page, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "خواندن این صفحه از دیجی‌کالا ناموفق بود.",
        detail: error instanceof Error ? error.message : "خطای نامشخص",
      },
      { status: 502 },
    );
  }
}
