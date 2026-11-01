import { NextResponse } from "next/server";
import { getJsonSellerDashboard } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = Number(searchParams.get("sellerId"));
    if (!sellerId) return NextResponse.json({ success: false, message: "شناسه فروشنده لازم است." }, { status: 400 });
    const dashboard = await getJsonSellerDashboard(sellerId);
    return NextResponse.json({ success: true, ...dashboard });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown seller dashboard error";
    return NextResponse.json({ success: false, message: "دریافت داشبورد فروشنده ناموفق بود.", detail }, { status: 500 });
  }
}
