import { NextResponse } from "next/server";
import { getStorageInfo } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Health check نباید دیتاست بزرگ اصلی را بخواند و migrate کند؛ این مسیر باید
    // حتی زیر بار فهرست/جزئیات کالا سبک و قابل اتکا بماند.
    const storage = await getStorageInfo();
    return NextResponse.json({
      ok: true,
      service: "OptiBid",
      storage: storage.mode,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { ok: false, service: "OptiBid", storage: "unknown" },
      { status: 500 },
    );
  }
}
