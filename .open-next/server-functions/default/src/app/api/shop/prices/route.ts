import { NextResponse } from "next/server";
import { getStorePriceOverridesByIds } from "@/lib/store-price-overrides";

export const dynamic = "force-dynamic";

function requestedProductIds(request: Request) {
  const raw = new URL(request.url).searchParams.get("ids") || "";
  return Array.from(new Set(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter((value) => /^[a-zA-Z0-9._:-]{1,100}$/.test(value)),
  )).slice(0, 30);
}

export async function GET(request: Request) {
  const ids = requestedProductIds(request);
  if (!ids.length) {
    return NextResponse.json(
      { success: false, message: "شناسهٔ کالا ارسال نشده است." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const overrides = await getStorePriceOverridesByIds(ids);
  const prices = Object.fromEntries(
    ids.flatMap((productId) => {
      const value = overrides[productId];
      return value
        ? [[productId, {
            price: value.price,
            updatedAt: value.updatedAt,
            available: value.available !== false,
          }]]
        : [];
    }),
  );
  return NextResponse.json(
    { success: true, prices },
    { headers: { "Cache-Control": "no-store" } },
  );
}
