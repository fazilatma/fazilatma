import { NextResponse } from "next/server";
import { updateJsonBuyerProfile } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const buyer = await updateJsonBuyerProfile(Number(body.buyerId), {
      fullName: typeof body.fullName === "string" ? body.fullName : undefined,
      bio: typeof body.bio === "string" ? body.bio : undefined,
      defaultAddress: typeof body.defaultAddress === "string" ? body.defaultAddress : undefined,
      categories: Array.isArray(body.categories) ? body.categories : undefined,
    });
    return NextResponse.json({ success: true, buyer, message: "پروفایل خریدار ذخیره شد." });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown buyer profile error";
    return NextResponse.json({ success: false, message: "ذخیره پروفایل خریدار ناموفق بود.", detail }, { status: 400 });
  }
}
