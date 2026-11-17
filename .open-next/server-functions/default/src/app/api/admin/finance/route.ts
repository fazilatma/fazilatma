import { NextResponse } from "next/server";
import {
  getJsonPlatformFinance,
  updateJsonPlatformFinanceSettings,
} from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      ...(await getJsonPlatformFinance()),
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unknown finance error";
    return NextResponse.json(
      { success: false, message: "دریافت اطلاعات مالی ناموفق بود.", detail },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { commissionRate, ...rest } = body;
    const settings = await updateJsonPlatformFinanceSettings({
      ...rest,
      commissionRate:
        typeof commissionRate === "number" ? commissionRate : undefined,
    });
    return NextResponse.json({
      success: true,
      settings,
      zarinpalPrerequisites: (await getJsonPlatformFinance())
        .zarinpalPrerequisites,
      message: "تنظیمات مالی حساب پلتفرم و زرین‌پال ذخیره شد.",
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unknown finance settings error";
    return NextResponse.json(
      { success: false, message: "ذخیره تنظیمات مالی ناموفق بود.", detail },
      { status: 500 },
    );
  }
}
