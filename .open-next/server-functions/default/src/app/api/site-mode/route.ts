import { NextResponse } from "next/server";
import { getJsonSiteMode } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteMode = await getJsonSiteMode();
  return NextResponse.json({
    success: true,
    siteMode,
    label: siteMode === "store" ? "فروشگاه اینترنتی" : "درخواست خرید",
  });
}
