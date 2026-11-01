import { NextResponse } from "next/server";
import {
  createJsonZarinpalPaymentAttempt,
  payJsonOrder,
  prepareJsonZarinpalPayment,
} from "@/lib/json-store";
import { requestZarinpalPayment } from "@/lib/zarinpal";

export const dynamic = "force-dynamic";

function originFromRequest(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const paymentMethod = body.paymentMethod === "zarinpal" ? "zarinpal" : body.paymentMethod === "wallet" ? "wallet" : "gateway";

    if (paymentMethod === "zarinpal") {
      const prepared = await prepareJsonZarinpalPayment({
        buyerId: Number(body.buyerId),
        orderId: String(body.orderId || ""),
        origin: originFromRequest(request),
      });
      const description = `${prepared.prerequisites.zarinpalDescription} - سفارش ${prepared.order.id}`;
      const zarinpal = await requestZarinpalPayment({
        merchantId: prepared.prerequisites.zarinpalMerchantId,
        amount: prepared.amount,
        callbackUrl: prepared.prerequisites.callbackUrl,
        description,
        sandbox: prepared.prerequisites.zarinpalSandbox,
        metadata: {
          email: prepared.buyer.email,
          orderId: prepared.order.id,
        },
      });
      const payment = await createJsonZarinpalPaymentAttempt({
        orderId: prepared.order.id,
        buyerId: prepared.buyer.id,
        amount: prepared.amount,
        authority: zarinpal.authority,
        callbackUrl: prepared.prerequisites.callbackUrl,
        mode: prepared.prerequisites.zarinpalSandbox ? "sandbox" : "production",
        fee: zarinpal.fee,
        code: zarinpal.code,
        message: zarinpal.message,
      });
      return NextResponse.json({
        success: true,
        payment,
        redirectUrl: zarinpal.redirectUrl,
        message: "درخواست پرداخت زرین‌پال ایجاد شد؛ به درگاه منتقل می‌شوید.",
      });
    }

    const order = await payJsonOrder({
      buyerId: Number(body.buyerId),
      orderId: String(body.orderId || ""),
      paymentMethod,
    });
    return NextResponse.json({
      success: true,
      order,
      message: "پرداخت موفق بود و مبلغ وارد حساب امانی شد.",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown payment error";
    const insufficient = detail.includes("Insufficient wallet");
    const zarinpalNotReady = detail.includes("Zarinpal is not ready");
    const zarinpalFailed = detail.includes("ZARINPAL_REQUEST_FAILED");
    return NextResponse.json(
      {
        success: false,
        message: insufficient
          ? "موجودی کیف پول برای پرداخت کافی نیست."
          : zarinpalNotReady
            ? `درگاه زرین‌پال هنوز آماده نیست. ${detail.replace("Zarinpal is not ready:", "موارد ناقص:")}`
            : zarinpalFailed
              ? `ایجاد پرداخت زرین‌پال ناموفق بود. ${detail.split(":").slice(2).join(":")}`
              : "پرداخت سفارش ناموفق بود.",
        detail,
      },
      { status: 400 },
    );
  }
}
