import { NextResponse } from "next/server";
import { updateJsonSellerProfile } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const sellerId = Number(body.sellerId);

    if (!sellerId) {
      return NextResponse.json({ success: false, message: "شناسه فروشنده معتبر نیست." }, { status: 400 });
    }

    const seller = await updateJsonSellerProfile(sellerId, {
      fullName: typeof body.fullName === "string" ? body.fullName : undefined,
      bio: typeof body.bio === "string" ? body.bio : undefined,
      categories: Array.isArray(body.categories) ? body.categories : undefined,
    });

    return NextResponse.json({ success: true, seller, message: "پروفایل فروشنده ذخیره شد." });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown seller profile error";
    return NextResponse.json({ success: false, message: "ذخیره پروفایل فروشنده ناموفق بود.", detail }, { status: 500 });
  }
}
