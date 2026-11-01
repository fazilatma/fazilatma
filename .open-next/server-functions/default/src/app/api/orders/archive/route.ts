import { NextResponse } from "next/server";
import { archiveJsonOrder } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const role = body.role === "seller" ? "seller" : "buyer";
    const order = await archiveJsonOrder({
      userId: Number(body.userId),
      orderId: String(body.orderId || ""),
      role,
    });
    return NextResponse.json({ success: true, order, message: "سفارش به بایگانی منتقل شد." });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown archive error";
    return NextResponse.json({ success: false, message: "فقط سفارش‌های تکمیل‌شده یا لغوشده قابل بایگانی هستند.", detail }, { status: 400 });
  }
}
