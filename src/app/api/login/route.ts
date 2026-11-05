import { NextResponse } from "next/server";
import { authenticateJsonUser } from "@/lib/json-store";

export const dynamic = "force-dynamic";

/**
 * ارقام فارسی/عربی را به لاتین تبدیل می‌کند تا رمز ادمین با کیبورد فارسی
 * (۱۲۳۴) هم پذیرفته شود.
 */
function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function setUserSession(
  response: NextResponse,
  user: { id: number; role: string },
  remember = true,
) {
  response.cookies.set("optibid_user", `${user.role}:${user.id}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8,
  });
  return response;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier || "").trim();
    const password = String(body.password || "");

    // حساب مدیر سامانه، مستقل از داده‌های کاربران.
    const normalizedPassword = normalizeDigits(password).trim();
    if (identifier.toLowerCase() === "admin" && normalizedPassword === "1234") {
      const response = NextResponse.json({
        success: true,
        user: { id: 0, fullName: "مدیر OptiBid", role: "admin" },
        redirectTo: "/admin/dashboard",
      });
      response.cookies.set("optibid_admin", "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
      setUserSession(
        response,
        { id: 0, role: "admin" },
        Boolean(body.rememberMe),
      );
      return response;
    }

    const user = await authenticateJsonUser({ identifier, password });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "نام کاربری، شماره موبایل، ایمیل یا رمز عبور صحیح نیست.",
        },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, fullName: user.fullName, role: user.role },
    });
    setUserSession(
      response,
      { id: user.id, role: user.role },
      Boolean(body.rememberMe),
    );
    return response;
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unknown login error";
    if (detail === "KYC_PENDING") {
      return NextResponse.json(
        {
          success: false,
          code: "KYC_PENDING",
          message:
            "حساب شما در انتظار بررسی مدارک توسط ادمین است و هنوز فعال نشده است.",
        },
        { status: 403 },
      );
    }
    if (detail.startsWith("KYC_REJECTED:")) {
      return NextResponse.json(
        {
          success: false,
          code: "KYC_REJECTED",
          message: `مدارک شما تایید نشد. ${detail.slice("KYC_REJECTED:".length)}`,
        },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { success: false, message: "ورود ناموفق بود.", detail },
      { status: 500 },
    );
  }
}
