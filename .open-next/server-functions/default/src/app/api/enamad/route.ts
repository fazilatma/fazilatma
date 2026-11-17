import { NextResponse } from "next/server";
import { getEnamadSettings } from "@/lib/enamad-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ success: true, enamad: await getEnamadSettings() });
}
