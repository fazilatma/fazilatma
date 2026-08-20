import { NextResponse } from "next/server";
import { payJsonOrder } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order = await payJsonOrder({
      buyerId: Number(body.buyerId),
      orderId: String(body.orderId || ""),
      paymentMethod: body.paymentMethod === "wallet" ? "wallet" : "gateway",
    });
    return NextResponse.json({ success: true, order, message: "پرداخت موفق بود و مبلغ وارد حساب امانی شد." });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown payment error";
    const insufficient = detail.includes("Insufficient wallet");
    return NextResponse.json(
      { success: false, message: insufficient ? "موجودی کیف پول برای پرداخت کافی نیست." : "پرداخت سفارش ناموفق بود.", detail },
      { status: 400 }
    );
  }
}
