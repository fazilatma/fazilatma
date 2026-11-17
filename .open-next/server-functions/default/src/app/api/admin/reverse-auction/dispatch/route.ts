import { NextResponse } from "next/server";
import {
  assignJsonRequestToSellers,
  getJsonReverseAuctionDispatchData,
} from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      ...(await getJsonReverseAuctionDispatchData()),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "دریافت فهرست ارجاع دستی ناموفق بود.",
        detail: error instanceof Error ? error.message : "Unknown dispatch error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requestId = Number(body.requestId);
    const sellerIds = Array.isArray(body.sellerIds) ? body.sellerIds.map(Number) : [];
    if (!requestId || !sellerIds.length) {
      return NextResponse.json(
        { success: false, message: "یک درخواست و حداقل یک فروشنده انتخاب کنید." },
        { status: 400 },
      );
    }
    const result = await assignJsonRequestToSellers(requestId, sellerIds);
    return NextResponse.json({
      success: true,
      ...result,
      message: `درخواست برای ${result.sellerIds.length.toLocaleString("fa-IR")} فروشنده ارجاع شد.`,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown dispatch error";
    return NextResponse.json(
      {
        success: false,
        message: detail.includes("disabled")
          ? "ابتدا گزینه ارجاع دستی را در تنظیمات ماه اول فعال کنید."
          : "ارجاع دستی درخواست ناموفق بود.",
        detail,
      },
      { status: 400 },
    );
  }
}
