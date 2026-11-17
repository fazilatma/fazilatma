import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * وضعیت نشست فعلی برای عیب‌یابی.
 * فقط وجود کوکی و نقش را برمی‌گرداند؛ هیچ مقدار حساسی افشا نمی‌شود.
 */
export async function GET() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("optibid_user")?.value || "";
  const isAdmin = cookieStore.get("optibid_admin")?.value === "1";
  const role = userCookie ? userCookie.split(":")[0] || null : null;

  return NextResponse.json(
    {
      success: true,
      hasSession: Boolean(userCookie) || isAdmin,
      role: isAdmin ? "admin" : role,
      cookieNames: cookieStore.getAll().map((cookie) => cookie.name),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
