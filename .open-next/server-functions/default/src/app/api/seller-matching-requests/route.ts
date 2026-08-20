import { NextResponse } from "next/server";
import { getJsonMatchingRequestsForSeller } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = Number(searchParams.get("sellerId"));

    if (!sellerId) {
      return NextResponse.json({ success: false, message: "شناسه فروشنده معتبر نیست." }, { status: 400 });
    }

    const requests = await getJsonMatchingRequestsForSeller(sellerId, 5);
    return NextResponse.json({
      success: true,
      maxAlerts: 5,
      requests,
      message:
        requests.length > 0
          ? `${requests.length} درخواست مرتبط برای این فروشنده آماده است.`
          : "درخواست جدیدی در حوزه‌های انتخاب‌شده شما وجود ندارد.",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown matching error";
    return NextResponse.json({ success: false, message: "دریافت درخواست‌های مرتبط ناموفق بود.", detail }, { status: 500 });
  }
}
