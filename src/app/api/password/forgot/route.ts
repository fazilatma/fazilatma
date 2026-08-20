import { NextResponse } from "next/server";
import { createJsonPasswordReset } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "یک ایمیل معتبر وارد کنید." },
        { status: 400 }
      );
    }

    const reset = await createJsonPasswordReset(email);
    const mode = process.env.OPTIBID_PASSWORD_RESET_MODE || "demo";
    const origin = new URL(request.url).origin;
    const resetUrl = reset
      ? `${origin}/forgot-password?token=${encodeURIComponent(reset.token)}`
      : null;

    // پاسخ عمومی برای جلوگیری از افشای عضویت ایمیل.
    return NextResponse.json({
      success: true,
      message:
        mode === "demo"
          ? "اگر ایمیل ثبت شده باشد، لینک بازیابی ساخته شده است. در حالت آزمایشی لینک زیر نمایش داده می‌شود."
          : "اگر ایمیل در OptiBid ثبت شده باشد، راهنمای بازیابی برای آن ارسال خواهد شد.",
      demoResetUrl: mode === "demo" ? resetUrl : undefined,
      expiresInMinutes: 30,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown forgot password error";
    return NextResponse.json(
      { success: false, message: "ایجاد درخواست بازیابی رمز ناموفق بود.", detail },
      { status: 500 }
    );
  }
}
