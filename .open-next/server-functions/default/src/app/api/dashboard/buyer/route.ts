import { NextResponse } from "next/server";
import { getJsonBuyerDashboard } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buyerId = Number(searchParams.get("buyerId"));
    if (!buyerId) return NextResponse.json({ success: false, message: "شناسه خریدار لازم است." }, { status: 400 });
    const dashboard = await getJsonBuyerDashboard(buyerId);
    return NextResponse.json({ success: true, ...dashboard });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown buyer dashboard error";
    return NextResponse.json({ success: false, message: "دریافت داشبورد خریدار ناموفق بود.", detail }, { status: 500 });
  }
}
