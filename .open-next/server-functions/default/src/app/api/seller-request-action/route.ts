import { NextResponse } from "next/server";
import { rejectJsonSellerRequest } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sellerId = Number(body.sellerId);
    const requestId = Number(body.requestId);

    if (!sellerId || !requestId) {
      return NextResponse.json({ success: false, message: "شناسه فروشنده و درخواست الزامی هستند." }, { status: 400 });
    }

    if (body.action !== "rejected") {
      return NextResponse.json({ success: false, message: "عملیات پشتیبانی نمی‌شود." }, { status: 400 });
    }

    await rejectJsonSellerRequest(sellerId, requestId);
    return NextResponse.json({ success: true, message: "درخواست برای شما رد شد و دیگر نمایش داده نمی‌شود." });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown action error";
    return NextResponse.json({ success: false, message: "ثبت پاسخ فروشنده ناموفق بود.", detail }, { status: 500 });
  }
}
