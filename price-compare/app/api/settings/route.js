import { NextResponse } from "next/server";
import { getSettings } from "../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = getSettings();
  return NextResponse.json({
    ok: true,
    outsideInsideEnabled: settings.outsideInsideEnabled || false,
    outsideSources: settings.outsideSources || { trendyol: true, amazonAe: true, aliexpress: false },
    customs: settings.customs || { defaultDutyPct: 20, shippingIntl: 500000, insurancePct: 2 }
  });
}
