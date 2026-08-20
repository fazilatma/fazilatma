import { NextResponse } from "next/server";
import { shipJsonOrder } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order = await shipJsonOrder({
      sellerId: Number(body.sellerId),
      orderId: String(body.orderId || ""),
      trackingCode: String(body.trackingCode || ""),
    });
    return NextResponse.json({ success: true, order, message: "ارسال کالا ثبت و به خریدار اطلاع داده شد." });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown shipment error";
    return NextResponse.json({ success: false, message: "تایید ارسال ناموفق بود. کد رهگیری و وضعیت سفارش را بررسی کنید.", detail }, { status: 400 });
  }
}
