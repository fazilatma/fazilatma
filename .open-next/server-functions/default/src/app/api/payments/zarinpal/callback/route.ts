import { NextResponse } from "next/server";
import {
  completeJsonZarinpalPayment,
  failJsonZarinpalPayment,
  getJsonZarinpalPaymentAttempt,
  getJsonZarinpalPrerequisites,
} from "@/lib/json-store";
import { verifyZarinpalPayment } from "@/lib/zarinpal";

export const dynamic = "force-dynamic";

function resultHtml(input: {
  ok: boolean;
  title: string;
  message: string;
  orderId?: string;
  refId?: string;
}) {
  return `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${input.title}</title><style>body{margin:0;background:#eef4f8;font-family:Tahoma,Arial,sans-serif;color:#0f172a}.wrap{min-height:100vh;display:grid;place-items:center;padding:24px}.card{max-width:560px;width:100%;background:#fff;border:1px solid #dbe4ee;border-radius:28px;box-shadow:0 24px 70px rgba(15,23,42,.18);padding:32px;text-align:center}.icon{width:76px;height:76px;border-radius:999px;margin:0 auto 18px;display:grid;place-items:center;font-size:34px;background:${input.ok ? "#dcfce7;color:#15803d" : "#fee2e2;color:#b91c1c"}}h1{margin:0 0 12px;font-size:24px;color:#003b5c}p{line-height:2;color:#475569}.meta{margin:18px 0;padding:14px;border-radius:18px;background:#f8fafc;text-align:right;font-size:13px}.meta div{display:flex;justify-content:space-between;gap:12px;margin:6px 0}.btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:22px}a{display:inline-block;border-radius:14px;padding:12px 18px;text-decoration:none;font-weight:800}.primary{background:#003b5c;color:#fff}.secondary{background:#e0f2fe;color:#0369a1}</style></head><body><main class="wrap"><section class="card"><div class="icon">${input.ok ? "✓" : "!"}</div><h1>${input.title}</h1><p>${input.message}</p>${input.orderId || input.refId ? `<div class="meta">${input.orderId ? `<div><span>شماره سفارش</span><b dir="ltr">${input.orderId}</b></div>` : ""}${input.refId ? `<div><span>کد رهگیری زرین‌پال</span><b dir="ltr">${input.refId}</b></div>` : ""}</div>` : ""}<div class="btns"><a class="primary" href="/buyer/dashboard">بازگشت به داشبورد خریدار</a><a class="secondary" href="/">صفحه اصلی</a></div></section></main></body></html>`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authority =
    url.searchParams.get("Authority") ||
    url.searchParams.get("authority") ||
    "";
  const status =
    url.searchParams.get("Status") || url.searchParams.get("status") || "";

  if (!authority) {
    return new NextResponse(
      resultHtml({
        ok: false,
        title: "پرداخت نامعتبر",
        message: "شناسه Authority از زرین‌پال دریافت نشد.",
      }),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  try {
    if (status.toUpperCase() !== "OK") {
      const payment = await failJsonZarinpalPayment({
        authority,
        status: "cancelled",
        message:
          "کاربر پرداخت را در درگاه زرین‌پال لغو کرد یا پرداخت تایید نشد.",
      });
      return new NextResponse(
        resultHtml({
          ok: false,
          title: "پرداخت زرین‌پال لغو شد",
          message:
            "پرداخت تکمیل نشد و سفارش همچنان در وضعیت آماده پرداخت باقی ماند.",
          orderId: payment.orderId,
        }),
        { headers: { "Content-Type": "text/html; charset=utf-8" } },
      );
    }

    const prerequisites = await getJsonZarinpalPrerequisites();
    const attempt = await getJsonZarinpalPaymentAttempt(authority);

    const verified = await verifyZarinpalPayment({
      merchantId: prerequisites.zarinpalMerchantId,
      amount: attempt.amount,
      authority,
      sandbox: attempt.mode === "sandbox",
    });

    const result = await completeJsonZarinpalPayment({
      authority,
      refId: verified.refId,
      cardPan: verified.cardPan,
      fee: verified.fee,
      code: verified.code,
      message: verified.message,
    });

    return new NextResponse(
      resultHtml({
        ok: true,
        title: "پرداخت زرین‌پال با موفقیت تایید شد",
        message:
          "وجه سفارش وارد حساب امانی OptiBid شد. فروشنده اکنون می‌تواند کالا را ارسال کند.",
        orderId: result.order.id,
        refId: verified.refId,
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  } catch (error) {
    const detail =
      error instanceof Error
        ? error.message
        : "Unknown zarinpal callback error";
    await failJsonZarinpalPayment({
      authority,
      status: "failed",
      message: detail,
    }).catch(() => undefined);
    return new NextResponse(
      resultHtml({
        ok: false,
        title: "اعتبارسنجی پرداخت ناموفق بود",
        message: detail.includes("ZARINPAL_VERIFY_FAILED")
          ? `زرین‌پال پرداخت را تایید نکرد. ${detail.split(":").slice(2).join(":")}`
          : "پرداخت قابل تایید نبود. لطفاً از داشبورد خریدار دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.",
      }),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}
