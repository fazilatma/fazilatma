import { NextResponse } from "next/server";
import { getJsonMatchingRequestsForSeller } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = Number(searchParams.get("sellerId"));
    const limit = Math.max(
      1,
      Math.min(10, Number(searchParams.get("limit") || 10) || 10),
    );

    if (!sellerId) {
      return NextResponse.json(
        { success: false, message: "شناسه فروشنده معتبر نیست." },
        { status: 400 },
      );
    }

    const requests = await getJsonMatchingRequestsForSeller(sellerId, limit);
    return NextResponse.json({
      success: true,
      maxAlerts: limit,
      requests,
      message:
        requests.length > 0
          ? `${requests.length} درخواست مرتبط بر اساس حوزه کاری شما آماده است.`
          : "درخواست جدیدی در حوزه‌های انتخاب‌شده شما وجود ندارد.",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown matching error";
    return NextResponse.json(
      {
        success: false,
        message: "دریافت درخواست‌های مرتبط ناموفق بود.",
        detail,
      },
      { status: 500 },
    );
  }
}
