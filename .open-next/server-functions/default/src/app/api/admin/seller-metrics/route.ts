import { NextResponse } from "next/server";
import { updateJsonSellerMetrics } from "@/lib/json-store";
import { calculateSellerScore } from "@/lib/seller-rating";

export const dynamic = "force-dynamic";

const numericKeys = new Set([
  "completedOrders90d",
  "completedOrdersLifetime",
  "reviewsCount90d",
  "ratingAverage90d",
  "firstMessagesReceived90d",
  "firstMessagesAnsweredWithin24h",
  "averageFirstResponseHours",
  "shippedOrders90d",
  "onTimeShipments90d",
  "trackedShipments90d",
  "validTrackedShipments90d",
  "sellerCancellations90d",
  "orderDefects90d",
  "unresolvedCases90d",
  "sellerFaultReturns90d",
  "stockMismatchCancellations90d",
  "disputesResolvedAgainstSeller90d",
  "policyViolationsOpen",
  "profileCompletenessPercent",
]);

const booleanKeys = new Set([
  "identityVerified",
  "bankAccountVerified",
  "businessDocumentsVerified",
  "activeInLast30Days",
]);

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const sellerId = Number(body.sellerId);
    const metrics = body.metrics || {};

    if (!sellerId) {
      return NextResponse.json({ success: false, message: "شناسه فروشنده معتبر نیست." }, { status: 400 });
    }

    const safeUpdates: Record<string, number | boolean> = {};
    for (const [key, value] of Object.entries(metrics)) {
      if (numericKeys.has(key) && typeof value === "number" && Number.isFinite(value)) {
        safeUpdates[key] = Math.max(0, value);
      }
      if (booleanKeys.has(key) && typeof value === "boolean") {
        safeUpdates[key] = value;
      }
    }

    const seller = await updateJsonSellerMetrics(sellerId, safeUpdates);
    const score = calculateSellerScore(seller.sellerMetrics!);

    return NextResponse.json({ success: true, score, seller });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message: "بروزرسانی شاخص فروشنده ناموفق بود.", detail }, { status: 500 });
  }
}
