import { NextResponse } from "next/server";
import { resetJsonPassword } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body.token || "");
    const password = String(body.password || "");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "توکن بازیابی ارسال نشده است." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "رمز جدید باید حداقل ۸ کاراکتر باشد." },
        { status: 400 }
      );
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return NextResponse.json(
        { success: false, message: "رمز جدید باید حداقل یک حرف و یک عدد داشته باشد." },
        { status: 400 }
      );
    }

    await resetJsonPassword(token, password);
    return NextResponse.json({
      success: true,
      message: "رمز عبور با موفقیت تغییر کرد. اکنون می‌توانید وارد حساب شوید.",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown reset password error";
    const invalid = detail.includes("invalid or expired");
    return NextResponse.json(
      {
        success: false,
        message: invalid
          ? "لینک بازیابی نامعتبر یا منقضی شده است. دوباره درخواست بازیابی بدهید."
          : "تغییر رمز عبور ناموفق بود.",
        detail,
      },
      { status: invalid ? 410 : 500 }
    );
  }
}
