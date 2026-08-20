import { NextResponse } from "next/server";
import { cancelJsonOrder } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order = await cancelJsonOrder({ buyerId: Number(body.buyerId), orderId: String(body.orderId || "") });
    return NextResponse.json({ success: true, order, message: "سفارش لغو شد و درخواست دوباره برای انتخاب پیشنهاد باز است." });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown cancellation error";
    return NextResponse.json({ success: false, message: "فقط سفارش آماده پرداخت قابل لغو است.", detail }, { status: 400 });
  }
}
