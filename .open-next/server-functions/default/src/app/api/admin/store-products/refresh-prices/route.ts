import { NextResponse } from "next/server";
import { getOptiBidData, writeOptiBidData } from "@/lib/json-store";
import { normalizePriceReferences } from "@/lib/store-price-refresh";
import { runStorePriceRefreshBatch } from "@/lib/store-price-refresh-run";

export const dynamic = "force-dynamic";

type Body = {
  references?: string[];
  maxProducts?: number;
  priceMultiplier?: number;
  onlyActive?: boolean;
  productIds?: string[];
  offset?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const references = normalizePriceReferences(body.references);
    if (references.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "حداقل یک مرجع قیمت را انتخاب کنید.",
        },
        { status: 400 },
      );
    }

    const data = await getOptiBidData();
    const result = await runStorePriceRefreshBatch(data, {
      references,
      maxProducts: body.maxProducts,
      priceMultiplier: body.priceMultiplier,
      onlyActive: body.onlyActive,
      productIds: body.productIds,
      offset: body.offset,
    });

    if (result.emptySelection) {
      return NextResponse.json(
        { success: false, message: "محصول انتخاب‌شده در فروشگاه فعال نیست یا پیدا نشد." },
        { status: 404 },
      );
    }

    if (result.changed) {
      await writeOptiBidData(data);
    }

    return NextResponse.json({
      success: true,
      references,
      priceMultiplier: result.priceMultiplier,
      totalProducts: result.totalProducts,
      offset: result.offset,
      nextOffset: result.nextOffset,
      hasMore: result.hasMore,
      totalChecked: result.totalChecked,
      updated: result.updated,
      unchanged: result.unchanged,
      historyRecorded: result.historyRecorded,
      notFound: result.notFound,
      failed: result.failed,
      warnings: result.warnings,
      results: result.results,
      message: result.message,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown price refresh error";
    return NextResponse.json(
      {
        success: false,
        message: "به‌روزرسانی قیمت‌ها ناموفق بود.",
        detail,
      },
      { status: 500 },
    );
  }
}
