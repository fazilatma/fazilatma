import { NextResponse } from "next/server";
import { createJsonReview } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const review = await createJsonReview({
      orderId: String(body.orderId || ""),
      reviewerId: Number(body.reviewerId),
      overall: Number(body.overall),
      scores: body.scores && typeof body.scores === "object" ? body.scores : {},
      comment: String(body.comment || ""),
    });
    return NextResponse.json({ success: true, review, message: "نظر و امتیاز شما با موفقیت ثبت شد." });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown review error";
    const duplicate = detail.includes("already submitted");
    const invalidRating = detail.includes("Rating scores");
    return NextResponse.json(
      {
        success: false,
        message: duplicate
          ? "برای این معامله قبلاً نظر ثبت کرده‌اید."
          : invalidRating
            ? "لطفاً قبل از ثبت نظر، همه امتیازهای ستاره‌ای را انتخاب کنید."
            : "ثبت نظرسنجی ناموفق بود.",
        detail,
      },
      { status: duplicate ? 409 : 400 }
    );
  }
}
