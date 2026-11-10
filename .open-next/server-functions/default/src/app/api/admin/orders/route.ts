import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  adminUpdateJsonMarketOrder,
  adminUpdateJsonStoreOrder,
  type AdminMarketOrderAction,
  type AdminStoreOrderAction,
} from "@/lib/json-store";
import { getAdminOrdersOverview } from "@/lib/admin-orders";

export const dynamic = "force-dynamic";

const MARKET_ACTIONS: AdminMarketOrderAction[] = ["mark_paid", "ship", "complete", "cancel", "note"];
const STORE_ACTIONS: AdminStoreOrderAction[] = [
  "confirm_payment",
  "processing",
  "ship",
  "complete",
  "cancel",
  "note",
];

async function isAdminRequest() {
  const cookieStore = await cookies();
  return cookieStore.get("optibid_admin")?.value === "1";
}

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, message: "دسترسی مدیریت لازم است." }, { status: 403 });
  }
  const overview = await getAdminOrdersOverview();
  return NextResponse.json({ success: true, ...overview });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, message: "دسترسی مدیریت لازم است." }, { status: 403 });
  }
  try {
    const body = await request.json();
    const kind = body.kind === "store" ? "store" : "market";
    const orderId = String(body.orderId || "").trim();
    const action = String(body.action || "").trim();
    const trackingCode = typeof body.trackingCode === "string" ? body.trackingCode : "";
    const note = typeof body.note === "string" ? body.note : "";

    if (!orderId) {
      return NextResponse.json({ success: false, message: "شناسهٔ سفارش الزامی است." }, { status: 400 });
    }

    if (kind === "store") {
      if (!STORE_ACTIONS.includes(action as AdminStoreOrderAction)) {
        return NextResponse.json({ success: false, message: "عملیات نامعتبر است." }, { status: 400 });
      }
      const order = await adminUpdateJsonStoreOrder({
        orderId,
        action: action as AdminStoreOrderAction,
        trackingCode,
        note,
      });
      const refunded = Number((order as { refundedAmount?: number })?.refundedAmount || 0);
      const walletBalance = Number((order as { walletBalance?: number })?.walletBalance || 0);
      const message =
        action === "cancel" && refunded > 0
          ? `سفارش لغو شد و ${refunded.toLocaleString("fa-IR")} تومان به کیف پول خریدار بازگشت (موجودی خریدار: ${walletBalance.toLocaleString("fa-IR")} تومان).`
          : action === "cancel"
            ? "سفارش لغو شد؛ مبلغی برای بازپرداخت وجود نداشت (سفارش پرداخت نشده بود)."
            : "وضعیت سفارش فروشگاهی به‌روزرسانی شد.";
      return NextResponse.json({ success: true, order, refunded, walletBalance, message });
    }

    if (!MARKET_ACTIONS.includes(action as AdminMarketOrderAction)) {
      return NextResponse.json({ success: false, message: "عملیات نامعتبر است." }, { status: 400 });
    }
    const order = await adminUpdateJsonMarketOrder({
      orderId,
      action: action as AdminMarketOrderAction,
      trackingCode,
      note,
    });
    const marketRefunded = Number((order as { refundedAmount?: number })?.refundedAmount || 0);
    return NextResponse.json({
      success: true,
      order,
      refunded: marketRefunded,
      message:
        action === "cancel" && marketRefunded > 0
          ? `سفارش بازار لغو شد و ${marketRefunded.toLocaleString("fa-IR")} تومان به کیف پول خریدار بازگشت.`
          : "سفارش بازار به‌روزرسانی شد.",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown admin order error";
    return NextResponse.json(
      { success: false, message: detail || "عملیات روی سفارش ناموفق بود.", detail },
      { status: 400 },
    );
  }
}
