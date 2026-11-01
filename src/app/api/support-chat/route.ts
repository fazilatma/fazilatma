import { NextResponse } from "next/server";
import {
  createJsonSupportChatMessage,
  getJsonSupportContent,
} from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    support: await getJsonSupportContent(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = await createJsonSupportChatMessage({
      name: typeof body.name === "string" ? body.name : "",
      phone: typeof body.phone === "string" ? body.phone : "",
      email: typeof body.email === "string" ? body.email : "",
      content: String(body.content || ""),
    });
    return NextResponse.json({
      success: true,
      message,
      reply:
        "پیام شما برای پشتیبانی ثبت شد. همکاران ما در اولین زمان ممکن از همین مسیر یا اطلاعات تماس ثبت‌شده پاسخ می‌دهند.",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown support chat error";
    return NextResponse.json(
      {
        success: false,
        message: "ثبت پیام پشتیبانی ناموفق بود.",
        detail,
      },
      { status: 400 },
    );
  }
}
