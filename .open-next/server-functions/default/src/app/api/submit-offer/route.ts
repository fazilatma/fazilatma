import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createJsonSellerOffer } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sellerId = Number(body.sellerId);
    const requestId = Number(body.requestId);
    const deliveryDays = Number(body.deliveryDays);

    if (!sellerId || !requestId || !body.amount || !deliveryDays) {
      return NextResponse.json(
        { success: false, message: "قیمت پیشنهادی و زمان تحویل الزامی هستند." },
        { status: 400 }
      );
    }

    const offer = await createJsonSellerOffer({
      sellerId,
      requestId,
      amount: String(body.amount),
      deliveryDays,
      message: String(body.message || ""),
    });

    revalidatePath("/");
    revalidatePath("/requests");
    revalidatePath("/buyer/dashboard");
    revalidatePath("/seller/dashboard");

    return NextResponse.json({ success: true, offer, message: "پیشنهاد قیمت با موفقیت ثبت شد." });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown offer error";
    const alreadyOffered = detail.includes("Offer already exists");
    return NextResponse.json(
      {
        success: false,
        message: alreadyOffered ? "شما قبلاً برای این درخواست پیشنهاد ثبت کرده‌اید." : "ثبت پیشنهاد قیمت ناموفق بود.",
        detail,
      },
      { status: alreadyOffered ? 409 : 500 }
    );
  }
}
