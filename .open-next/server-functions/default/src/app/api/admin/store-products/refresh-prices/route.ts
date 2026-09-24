import { NextResponse } from "next/server";
import {
  getOptiBidData,
  writeOptiBidData,
  type JsonStoreProduct,
} from "@/lib/json-store";
import {
  applyRefreshedPrice,
  chooseBestPriceCandidate,
  findProductPriceCandidates,
  normalizePriceReferences,
} from "@/lib/store-price-refresh";

export const dynamic = "force-dynamic";

type Body = {
  references?: string[];
  maxProducts?: number;
  priceMultiplier?: number;
  onlyActive?: boolean;
};

function normalizeMultiplier(value: unknown) {
  const number = Number(value || 1);
  if (!Number.isFinite(number) || number <= 0) return 1;
  return Math.max(0.1, Math.min(10, number));
}

function publicResult(product: JsonStoreProduct, status: string, message: string) {
  return {
    productId: product.id,
    slug: product.slug,
    title: product.title,
    price: product.price,
    status,
    message,
  };
}

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

    const multiplier = normalizeMultiplier(body.priceMultiplier);
    const maxProducts = Math.max(1, Math.min(1000, Number(body.maxProducts || 1000)));
    const onlyActive = body.onlyActive !== false;
    const data = await getOptiBidData();
    const targetProducts = data.storeProducts
      .map((product, index) => ({ product, index }))
      .filter(({ product }) => (onlyActive ? product.isActive !== false : true))
      .slice(0, maxProducts);

    let updated = 0;
    let unchanged = 0;
    let notFound = 0;
    let failed = 0;
    const results: Array<Record<string, unknown>> = [];
    const warnings: string[] = [];

    for (const { product, index } of targetProducts) {
      try {
        const { candidates, errors } = await findProductPriceCandidates(product, references);
        if (errors.length) warnings.push(`${product.title}: ${errors.slice(0, 3).join(" | ")}`);
        const best = chooseBestPriceCandidate(candidates);
        if (!best) {
          notFound += 1;
          results.push(publicResult(product, "not-found", "قیمت قابل اعتماد از منابع انتخابی پیدا نشد."));
          continue;
        }

        const nextProduct = applyRefreshedPrice(product, best, multiplier);
        const oldPrice = Number(product.price || 0);
        const newPrice = Number(nextProduct.price || 0);
        const changeRatio = oldPrice ? Math.abs(newPrice - oldPrice) / oldPrice : 1;

        if (changeRatio < 0.005) {
          unchanged += 1;
          results.push({
            ...publicResult(product, "unchanged", "قیمت تغییر معناداری نداشت."),
            oldPrice,
            newPrice,
            source: best.source,
            sourceUrl: best.url,
            candidateTitle: best.title,
          });
          continue;
        }

        data.storeProducts[index] = nextProduct;
        updated += 1;
        results.push({
          productId: product.id,
          slug: product.slug,
          title: product.title,
          oldPrice,
          newPrice,
          source: best.source,
          sourceUrl: best.url,
          candidateTitle: best.title,
          status: "updated",
          message: "قیمت به‌روزرسانی شد.",
        });
      } catch (error) {
        failed += 1;
        results.push(publicResult(product, "failed", error instanceof Error ? error.message : "خطای نامشخص"));
      }
    }

    if (updated > 0) await writeOptiBidData(data);

    return NextResponse.json({
      success: true,
      references,
      priceMultiplier: multiplier,
      totalChecked: targetProducts.length,
      updated,
      unchanged,
      notFound,
      failed,
      warnings: warnings.slice(0, 20),
      results,
      message: `${updated.toLocaleString("fa-IR")} محصول به‌روزرسانی شد، ${unchanged.toLocaleString("fa-IR")} محصول بدون تغییر ماند و برای ${notFound.toLocaleString("fa-IR")} محصول قیمت قابل اعتماد پیدا نشد.`,
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
