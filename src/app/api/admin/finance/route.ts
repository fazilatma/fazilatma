import { NextResponse } from "next/server";
import { getJsonPlatformFinance, updateJsonPlatformFinanceSettings } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ success: true, ...(await getJsonPlatformFinance()) });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown finance error";
    return NextResponse.json({ success: false, message: "دریافت اطلاعات مالی ناموفق بود.", detail }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const settings = await updateJsonPlatformFinanceSettings({
      commissionRate: typeof body.commissionRate === "number" ? body.commissionRate : undefined,
      adminAccountHolder: typeof body.adminAccountHolder === "string" ? body.adminAccountHolder : undefined,
      adminBankName: typeof body.adminBankName === "string" ? body.adminBankName : undefined,
      adminSheba: typeof body.adminSheba === "string" ? body.adminSheba : undefined,
      adminCardNumber: typeof body.adminCardNumber === "string" ? body.adminCardNumber : undefined,
    });
    return NextResponse.json({ success: true, settings, message: "تنظیمات مالی حساب پلتفرم ذخیره شد." });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown finance settings error";
    return NextResponse.json({ success: false, message: "ذخیره تنظیمات مالی ناموفق بود.", detail }, { status: 500 });
  }
}
