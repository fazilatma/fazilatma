import { NextResponse } from "next/server";
import { getOptiBidData, updateJsonSellerMetrics } from "@/lib/json-store";
import { calculateSellerScore, createDefaultSellerMetrics } from "@/lib/seller-rating";

export const dynamic = "force-dynamic";

type PerformanceEvent =
  | "order_completed"
  | "seller_cancellation"
  | "shipment_created"
  | "buyer_review"
  | "unresolved_case"
  | "seller_fault_return"
  | "dispute_against_seller"
  | "first_message_response"
  | "verification_updated";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sellerId = Number(body.sellerId);
    const event = body.event as PerformanceEvent;

    if (!sellerId || !event) {
      return NextResponse.json({ success: false, message: "sellerId و event الزامی هستند." }, { status: 400 });
    }

    const data = await getOptiBidData();
    const seller = data.users.find((user) => user.id === sellerId && user.role === "seller");
    if (!seller) {
      return NextResponse.json({ success: false, message: "فروشنده یافت نشد." }, { status: 404 });
    }

    const m = seller.sellerMetrics || createDefaultSellerMetrics();
    const increment = (key: keyof typeof m, by = 1) => ({ [key]: (m[key] as number) + by });
    let updates: Record<string, number | boolean> = {};

    switch (event) {
      case "order_completed":
        updates = {
          ...increment("completedOrders90d"),
          completedOrdersLifetime: m.completedOrdersLifetime + 1,
          activeInLast30Days: true,
        };
        break;
      case "seller_cancellation":
        updates = {
          ...increment("sellerCancellations90d"),
          stockMismatchCancellations90d: m.stockMismatchCancellations90d + (body.stockMismatch ? 1 : 0),
        };
        break;
      case "shipment_created": {
        const response = {
          shippedOrders90d: m.shippedOrders90d + 1,
          onTimeShipments90d: m.onTimeShipments90d + (body.onTime ? 1 : 0),
          trackedShipments90d: m.trackedShipments90d + (body.trackingProvided ? 1 : 0),
          validTrackedShipments90d: m.validTrackedShipments90d + (body.trackingValid ? 1 : 0),
        };
        updates = response;
        break;
      }
      case "buyer_review": {
        const rating = Math.max(1, Math.min(5, Number(body.rating) || 5));
        const totalReviews = m.reviewsCount90d + 1;
        updates = {
          reviewsCount90d: totalReviews,
          ratingAverage90d: (m.ratingAverage90d * m.reviewsCount90d + rating) / totalReviews,
        };
        break;
      }
      case "unresolved_case":
        updates = { ...increment("unresolvedCases90d"), ...increment("orderDefects90d") };
        break;
      case "seller_fault_return":
        updates = { ...increment("sellerFaultReturns90d"), ...increment("orderDefects90d") };
        break;
      case "dispute_against_seller":
        updates = { ...increment("disputesResolvedAgainstSeller90d"), ...increment("orderDefects90d") };
        break;
      case "first_message_response": {
        const hours = Math.max(0, Number(body.responseHours) || 0);
        const totalMessages = m.firstMessagesReceived90d + 1;
        updates = {
          firstMessagesReceived90d: totalMessages,
          firstMessagesAnsweredWithin24h: m.firstMessagesAnsweredWithin24h + (hours <= 24 ? 1 : 0),
          averageFirstResponseHours:
            (m.averageFirstResponseHours * m.firstMessagesReceived90d + hours) / totalMessages,
        };
        break;
      }
      case "verification_updated":
        updates = {
          identityVerified: Boolean(body.identityVerified),
          bankAccountVerified: Boolean(body.bankAccountVerified),
          businessDocumentsVerified: Boolean(body.businessDocumentsVerified),
          profileCompletenessPercent: Math.max(0, Math.min(100, Number(body.profileCompletenessPercent) || 0)),
        };
        break;
      default:
        return NextResponse.json({ success: false, message: "نوع رویداد پشتیبانی نمی‌شود." }, { status: 400 });
    }

    const updatedSeller = await updateJsonSellerMetrics(sellerId, updates);
    return NextResponse.json({
      success: true,
      event,
      score: calculateSellerScore(updatedSeller.sellerMetrics!),
      message: "رویداد عملکرد ثبت و امتیاز فروشنده بروزرسانی شد.",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown performance event error";
    return NextResponse.json({ success: false, message: "ثبت رویداد عملکرد ناموفق بود.", detail }, { status: 500 });
  }
}
