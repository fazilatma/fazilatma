import { NextResponse } from "next/server";
import { enableJsonSellerMode } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = Number(body.userId);
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "برای ورود به حالت فروشنده ابتدا وارد حساب شوید.",
        },
        { status: 400 },
      );
    }

    const user = await enableJsonSellerMode({
      userId,
      category: typeof body.category === "string" ? body.category : undefined,
    });
    const requestId = Number(body.requestId || 0);
    return NextResponse.json({
      success: true,
      user,
      nextUrl: requestId ? `/requests/${requestId}/offer` : "/seller/dashboard",
      message:
        "حالت فروشنده برای حساب شما فعال شد. اکنون می‌توانید قیمت و مشخصات کالای پیشنهادی را ثبت کنید.",
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unknown seller mode error";
    return NextResponse.json(
      {
        success: false,
        message: detail.includes("not active")
          ? "حساب شما فعال نیست و امکان ورود به حالت فروشنده وجود ندارد."
          : "فعال‌سازی حالت فروشنده ناموفق بود.",
        detail,
      },
      { status: 400 },
    );
  }
}
