import { NextResponse } from "next/server";
import { getJsonPlatformFinance, resolveJsonWithdrawal } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const finance = await getJsonPlatformFinance();
    return NextResponse.json({ success: true, withdrawals: finance.withdrawals });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown withdrawals error";
    return NextResponse.json({ success: false, message: "دریافت درخواست‌های برداشت ناموفق بود.", detail }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.withdrawalId || !["approved", "rejected"].includes(body.status)) {
      return NextResponse.json(
        { success: false, message: "شناسه برداشت و وضعیت معتبر الزامی هستند." },
        { status: 400 }
      );
    }
    const withdrawal = await resolveJsonWithdrawal({
      withdrawalId: String(body.withdrawalId),
      status: body.status,
      adminNote: typeof body.adminNote === "string" ? body.adminNote : "",
    });
    return NextResponse.json({
      success: true,
      withdrawal,
      message:
        withdrawal.status === "approved"
          ? "درخواست برداشت تایید و به‌عنوان تسویه بانکی ثبت شد."
          : "درخواست برداشت رد و مبلغ به کیف پول کاربر بازگردانده شد.",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown withdrawal resolve error";
    return NextResponse.json({ success: false, message: "تعیین تکلیف برداشت ناموفق بود.", detail }, { status: 400 });
  }
}
