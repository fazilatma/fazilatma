import { NextResponse } from "next/server";
import { createJsonWithdrawalRequest } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = Number(body.userId);
    const amount = Number(String(body.amount || "").replace(/\D/g, ""));
    if (!userId || !amount) {
      return NextResponse.json(
        { success: false, message: "شناسه کاربر و مبلغ برداشت الزامی هستند." },
        { status: 400 }
      );
    }

    const withdrawal = await createJsonWithdrawalRequest(userId, amount);
    return NextResponse.json({
      success: true,
      withdrawal,
      message: "درخواست برداشت ثبت شد و در انتظار بررسی ادمین است.",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown withdrawal error";
    const message = detail.includes("Insufficient")
      ? "موجودی کیف پول برای این برداشت کافی نیست."
      : detail.includes("Bank details")
        ? "اطلاعات حساب بانکی کامل نیست؛ ابتدا پروفایل مالی را تکمیل کنید."
        : "ثبت درخواست برداشت ناموفق بود.";
    return NextResponse.json({ success: false, message, detail }, { status: 400 });
  }
}
