import { NextResponse } from "next/server";
import { sendJsonMessage } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await sendJsonMessage({
      senderId: Number(body.senderId),
      receiverId: Number(body.receiverId),
      orderId: body.orderId ? String(body.orderId) : undefined,
      content: String(body.content || ""),
    });
    return NextResponse.json({ success: true, message: "پیام ارسال شد." });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown message error";
    return NextResponse.json({ success: false, message: "ارسال پیام ناموفق بود.", detail }, { status: 400 });
  }
}
