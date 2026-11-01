import { NextResponse } from "next/server";
import { getOptiBidData, getStorageInfo } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getOptiBidData();
    const storage = await getStorageInfo();

    const isCloudflare = storage.mode === "cloudflare-kv";

    return NextResponse.json({
      ok: true,
      storage: isCloudflare ? "Cloudflare KV" : "JSON file",
      mode: storage.mode,
      writableFile: storage.dataFile,
      kvKey: storage.kvKey,
      counts: {
        requests: data.requests.length,
        users: data.users.length,
        orders: data.orders.length,
        transactions: data.transactions.length,
      },
      message: isCloudflare
        ? "ذخیره‌سازی Cloudflare KV برای OptiBid فعال است."
        : "ذخیره‌سازی JSON برای OptiBid آماده ثبت درخواست است.",
      note: isCloudflare
        ? "داده‌ها در KV Namespace مربوط به این Worker نگهداری می‌شوند و بین ری‌استارت‌ها پایدار می‌مانند."
        : "برای ماندگاری بین ری‌استارت‌ها در PaaS، متغیر OPTIBID_DATA_FILE را به مسیر دیسک پایدار متصل‌شده تنظیم کنید.",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown JSON storage error";
    return NextResponse.json(
      {
        ok: false,
        storage: "unknown",
        detail,
      },
      { status: 500 }
    );
  }
}
