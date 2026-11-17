import { NextResponse } from "next/server";
import { createJsonStoreOrder } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order = await createJsonStoreOrder({
      buyerId: Number(body.buyerId),
      items: Array.isArray(body.items)
        ? body.items.map((item: any) => ({
            productId: String(item.productId || ""),
            quantity: Number(item.quantity || 1),
          }))
        : [],
      receiverName: String(body.receiverName || ""),
      receiverPhone: String(body.receiverPhone || ""),
      shippingAddress: String(body.shippingAddress || ""),
      note: String(body.note || ""),
    });
    return NextResponse.json({
      success: true,
      order,
      message: "سفارش فروشگاهی شما ثبت شد و برای ادامه پرداخت/هماهنگی آماده است.",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown store order error";
    const message = detail.includes("buyer")
      ? "برای ثبت سفارش ابتدا با حساب خریدار وارد شوید."
      : detail.includes("stock")
        ? "موجودی یکی از کالاها کافی نیست."
        : detail.includes("Product")
          ? "یکی از کالاهای سبد خرید معتبر نیست."
          : "ثبت سفارش فروشگاهی ناموفق بود.";
    return NextResponse.json({ success: false, message, detail }, { status: 400 });
  }
}
