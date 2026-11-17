import { NextResponse } from "next/server";
import { createOrder, getOrders, getOrdersByUser, updateOrderStatus, getAllOrders } from "../../../lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, orderId, status, desc, user, product, offer, size, deliveryType, address, mobile, name } = body;

    if (action === "create") {
      if (!product || !offer) {
        return NextResponse.json({ error: "محصول و آفر الزامی است" }, { status: 400 });
      }
      if (!size) {
        return NextResponse.json({ error: "سایز الزامی است - برای لباس و کفش" }, { status: 400 });
      }
      const order = createOrder({ user, product, offer, size, deliveryType, address, mobile, name });
      return NextResponse.json({ ok: true, order, message: `سفارش ${order.id} ثبت شد - کد رهگیری ${order.trackingCode}` });
    }

    if (action === "updateStatus") {
      if (!orderId || !status) {
        return NextResponse.json({ error: "orderId و status الزامی" }, { status: 400 });
      }
      const order = updateOrderStatus(orderId, status, desc);
      return NextResponse.json({ ok: true, order });
    }

    return NextResponse.json({ error: "action نامعتبر - create | updateStatus" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const all = searchParams.get("all");

    if (all === "1") {
      // برای ادمین
      const orders = getAllOrders();
      return NextResponse.json({ ok: true, orders });
    }

    if (userId) {
      const orders = getOrdersByUser(userId);
      return NextResponse.json({ ok: true, orders });
    }

    const orders = getOrders();
    return NextResponse.json({ ok: true, orders: orders.slice(0, 50) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
