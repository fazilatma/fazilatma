import { NextResponse } from "next/server";
import { selectJsonOffer } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order = await selectJsonOffer({
      buyerId: Number(body.buyerId),
      offerId: Number(body.offerId),
      useAlternateAddress: Boolean(body.useAlternateAddress),
      shippingAddress: typeof body.shippingAddress === "string" ? body.shippingAddress : "",
      buyerConfirmedProductSpecs: Boolean(body.buyerConfirmedProductSpecs),
    });
    return NextResponse.json({ success: true, order, message: "پیشنهاد انتخاب شد و سفارش آماده پرداخت است." });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown offer selection error";
    const missingConfirmation = detail.includes("Product specs confirmation");
    return NextResponse.json({
      success: false,
      message: missingConfirmation
        ? "قبل از انتخاب پیشنهاد، باید مشخصات کالای اعلام‌شده توسط فروشنده را تایید کنید."
        : "انتخاب پیشنهاد ناموفق بود. آدرس ارسال و مشخصات کالا را بررسی کنید.",
      detail,
    }, { status: 400 });
  }
}
