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
    const settings = await updateJsonPlatformFinanceSettings({
      commissionRate:
        typeof body.commissionRate === "number"
          ? body.commissionRate
          : undefined,
      adminAccountHolder:
        typeof body.adminAccountHolder === "string"
          ? body.adminAccountHolder
          : undefined,
      adminBankName:
        typeof body.adminBankName === "string" ? body.adminBankName : undefined,
      adminSheba:
        typeof body.adminSheba === "string" ? body.adminSheba : undefined,
      adminCardNumber:
        typeof body.adminCardNumber === "string"
          ? body.adminCardNumber
          : undefined,
      zarinpalEnabled:
        typeof body.zarinpalEnabled === "boolean"
          ? body.zarinpalEnabled
          : undefined,
      zarinpalSandbox:
        typeof body.zarinpalSandbox === "boolean"
          ? body.zarinpalSandbox
          : undefined,
      zarinpalMerchantId:
        typeof body.zarinpalMerchantId === "string"
          ? body.zarinpalMerchantId
          : undefined,
      zarinpalCallbackBaseUrl:
        typeof body.zarinpalCallbackBaseUrl === "string"
          ? body.zarinpalCallbackBaseUrl
          : undefined,
      zarinpalDescription:
        typeof body.zarinpalDescription === "string"
          ? body.zarinpalDescription
          : undefined,
      googleOAuthEnabled:
        typeof body.googleOAuthEnabled === "boolean"
          ? body.googleOAuthEnabled
          : undefined,
      googleOAuthClientId:
        typeof body.googleOAuthClientId === "string"
          ? body.googleOAuthClientId
          : undefined,
      googleOAuthClientSecret:
        typeof body.googleOAuthClientSecret === "string"
          ? body.googleOAuthClientSecret
          : undefined,
      facebookOAuthEnabled:
        typeof body.facebookOAuthEnabled === "boolean"
          ? body.facebookOAuthEnabled
          : undefined,
      facebookOAuthClientId:
        typeof body.facebookOAuthClientId === "string"
          ? body.facebookOAuthClientId
          : undefined,
      facebookOAuthClientSecret:
        typeof body.facebookOAuthClientSecret === "string"
          ? body.facebookOAuthClientSecret
          : undefined,
      socialAuthBaseUrl:
        typeof body.socialAuthBaseUrl === "string"
          ? body.socialAuthBaseUrl
          : undefined,
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
