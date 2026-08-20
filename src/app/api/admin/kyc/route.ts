import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getJsonKycUsers, updateJsonKycStatus } from "@/lib/json-store";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  return (await cookies()).get("optibid_admin")?.value === "1";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, message: "دسترسی ادمین لازم است." }, { status: 401 });
  }
  try {
    return NextResponse.json({ success: true, users: await getJsonKycUsers() });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown KYC list error";
    return NextResponse.json({ success: false, message: "دریافت فهرست احراز هویت ناموفق بود.", detail }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, message: "دسترسی ادمین لازم است." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const userId = Number(body.userId);
    const status = body.status === "approved" ? "approved" : body.status === "rejected" ? "rejected" : null;
    const reason = String(body.reason || "");
    if (!userId || !status) {
      return NextResponse.json({ success: false, message: "شناسه کاربر و وضعیت معتبر الزامی است." }, { status: 400 });
    }
    const user = await updateJsonKycStatus({ userId, status, reason });
    return NextResponse.json({
      success: true,
      user: { id: user.id, fullName: user.fullName, username: user.username, kycStatus: user.kycStatus },
      message:
        status === "approved"
          ? "مدارک تایید شد و حساب کاربر فعال گردید."
          : "مدارک رد شد و علت برای کاربر ثبت گردید.",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown KYC update error";
    const missingReason = detail.includes("Rejection reason");
    return NextResponse.json(
      { success: false, message: missingReason ? "برای رد مدارک، درج علت الزامی است." : "تعیین وضعیت احراز هویت ناموفق بود.", detail },
      { status: 400 }
    );
  }
}
