import { NextResponse } from "next/server";
import { confirmJsonOrderReceived } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order = await confirmJsonOrderReceived({
      buyerId: Number(body.buyerId),
      orderId: String(body.orderId || ""),
    });
    return NextResponse.json({
      success: true,
      order,
      message: `دریافت کالا تایید شد. مبلغ ${Number(order.sellerAmount).toLocaleString("fa-IR")} تومان پس از کسر کمیسیون به کیف پول فروشنده واریز شد.`,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown delivery confirmation error";
    return NextResponse.json({ success: false, message: "تایید دریافت کالا ناموفق بود.", detail }, { status: 400 });
  }
}
