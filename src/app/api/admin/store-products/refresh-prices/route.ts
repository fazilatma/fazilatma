import { NextResponse } from "next/server";
import { runStorePriceRefresh } from "@/lib/store-price-refresh-run";

export const dynamic = "force-dynamic";

type Body = {
  references?: string[];
  maxProducts?: number;
  priceMultiplier?: number;
  onlyActive?: boolean;
  productIds?: string[];
  offset?: number;
  /** فقط محصولاتی که از این لینک مرجع وارد شده‌اند به‌روزرسانی شوند. */
  sourceUrl?: string;
};

export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = ((await request.json()) as Body) || {};
  } catch {
    body = {};
  }
  const result = await runStorePriceRefresh(body);
  return NextResponse.json(result.body, { status: result.status });
}
