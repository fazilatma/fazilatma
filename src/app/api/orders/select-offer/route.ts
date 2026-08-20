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
    });
    return NextResponse.json({ success: true, order, message: "پیشنهاد انتخاب شد و سفارش آماده پرداخت است." });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown offer selection error";
    return NextResponse.json({ success: false, message: "انتخاب پیشنهاد ناموفق بود. آدرس ارسال را بررسی کنید.", detail }, { status: 400 });
  }
}
