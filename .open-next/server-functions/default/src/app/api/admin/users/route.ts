import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getJsonAdminUsers,
  resetJsonAdminUserPassword,
  updateJsonAdminUser,
} from "@/lib/json-store";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  return (await cookies()).get("optibid_admin")?.value === "1";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { success: false, message: "دسترسی ادمین لازم است." },
      { status: 401 },
    );
  }
  try {
    return NextResponse.json({ success: true, ...(await getJsonAdminUsers()) });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unknown admin users error";
    return NextResponse.json(
      { success: false, message: "دریافت فهرست کاربران ناموفق بود.", detail },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { success: false, message: "دسترسی ادمین لازم است." },
      { status: 401 },
    );
  }
  try {
    const body = await request.json();
    const user = await updateJsonAdminUser({
      userId: Number(body.userId),
      fullName: typeof body.fullName === "string" ? body.fullName : undefined,
      username: typeof body.username === "string" ? body.username : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
      kycStatus: ["pending", "approved", "rejected"].includes(body.kycStatus)
        ? body.kycStatus
        : undefined,
      bankDetailsVerified:
        typeof body.bankDetailsVerified === "boolean"
          ? body.bankDetailsVerified
          : undefined,
      city: typeof body.city === "string" ? body.city : undefined,
      defaultAddress:
        typeof body.defaultAddress === "string"
          ? body.defaultAddress
          : undefined,
      categories: Array.isArray(body.categories) ? body.categories : undefined,
    });
    return NextResponse.json({
      success: true,
      user,
      message: "اطلاعات کاربر ذخیره شد.",
    });
  } catch (error) {
    const detail =
      error instanceof Error
        ? error.message
        : "Unknown admin user update error";
    const message = detail.includes("Username already")
      ? "این نام کاربری قبلاً ثبت شده است."
      : detail.includes("Email already")
        ? "این ایمیل قبلاً ثبت شده است."
        : detail.includes("Invalid username")
          ? "نام کاربری باید ۳ تا ۳۰ کاراکتر انگلیسی شامل حروف، عدد، نقطه، خط تیره یا زیرخط باشد."
          : "ذخیره اطلاعات کاربر ناموفق بود.";
    return NextResponse.json(
      { success: false, message, detail },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { success: false, message: "دسترسی ادمین لازم است." },
      { status: 401 },
    );
  }
  try {
    const body = await request.json();
    if (body.action !== "resetPassword") {
      return NextResponse.json(
        { success: false, message: "عملیات معتبر نیست." },
        { status: 400 },
      );
    }
    const result = await resetJsonAdminUserPassword({
      userId: Number(body.userId),
      password: typeof body.password === "string" ? body.password : undefined,
    });
    return NextResponse.json({
      success: true,
      ...result,
      message:
        "رمز عبور کاربر بازنشانی شد. رمز جدید فقط همین حالا نمایش داده می‌شود.",
    });
  } catch (error) {
    const detail =
      error instanceof Error
        ? error.message
        : "Unknown admin user password reset error";
    return NextResponse.json(
      {
        success: false,
        message: detail.includes("too short")
          ? "رمز عبور باید حداقل ۸ کاراکتر باشد."
          : "بازنشانی رمز عبور ناموفق بود.",
        detail,
      },
      { status: 400 },
    );
  }
}
