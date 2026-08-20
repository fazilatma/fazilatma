import { NextResponse } from "next/server";
import { getOptiBidData, getStorageInfo } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getOptiBidData();
    const storage = await getStorageInfo();

    return NextResponse.json({
      ok: true,
      service: "OptiBid",
      storage: storage.mode,
      requests: data.requests.length,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { ok: false, service: "OptiBid", storage: "unknown" },
      { status: 500 }
    );
  }
}
