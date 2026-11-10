import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOptiBidData, writeOptiBidData } from "@/lib/json-store";
import { auditStoreProductPrices, repriceStoreProduct } from "@/lib/store-price-audit";
import { saveStorePriceOverride } from "@/lib/store-price-overrides";
import { normalizeStorePriceMultiplier } from "@/lib/store-pricing";

export const dynamic = "force-dynamic";

async function isAdminRequest() {
  return (await cookies()).get("optibid_admin")?.value === "1";
}

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, message: "دسترسی مدیریت لازم است." }, { status: 403 });
  }
  const data = await getOptiBidData();
  const fallbackMultiplier = normalizeStorePriceMultiplier(data.settings.storePriceMultiplier, 1);
  const { rows, summary } = auditStoreProductPrices(data.storeProducts, fallbackMultiplier);
  return NextResponse.json({ success: true, summary, rows });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, message: "دسترسی مدیریت لازم است." }, { status: 403 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const requestedIds = Array.isArray(body?.productIds) ? body.productIds.map(String) : [];
    const fixAll = requestedIds.length === 0;
    const data = await getOptiBidData();
    const fallbackMultiplier = normalizeStorePriceMultiplier(data.settings.storePriceMultiplier, 1);

    const fixed: Array<{ id: string; slug: string; title: string; from: number; to: number }> = [];
    for (let index = 0; index < data.storeProducts.length; index += 1) {
      const product = data.storeProducts[index];
      if (!fixAll && !requestedIds.includes(product.id)) continue;
      const next = repriceStoreProduct(product, fallbackMultiplier);
      if (!next) continue;
      fixed.push({
        id: product.id,
        slug: product.slug,
        title: product.title,
        from: Math.round(Number(product.price || 0)),
        to: Math.round(Number(next.price || 0)),
      });
      data.storeProducts[index] = next;
    }

    if (fixed.length) {
      await writeOptiBidData(data);
      // لایهٔ قیمت تأییدشده (KV) هم با همین اعداد همگام می‌شود تا کارت، صفحهٔ
      // محصول و سبد خرید عدد یکسانی ببینند.
      await Promise.all(
        fixed.map((item) => {
          const product = data.storeProducts.find((candidate) => candidate.id === item.id);
          if (!product) return Promise.resolve();
          return saveStorePriceOverride(product.id, {
            price: product.price,
            marketPrice: Math.round(Number(product.marketPrice || 0)),
            priceMultiplier: normalizeStorePriceMultiplier(product.priceMultiplier, fallbackMultiplier),
            updatedAt: new Date().toISOString(),
            available: true,
          }).catch(() => undefined);
        }),
      );
    }

    const { summary } = auditStoreProductPrices(data.storeProducts, fallbackMultiplier);
    return NextResponse.json({
      success: true,
      fixed: fixed.length,
      details: fixed.slice(0, 50),
      summary,
      message: fixed.length
        ? `قیمت ${fixed.length.toLocaleString("fa-IR")} محصول با فرمول «قیمت مرجع × ضریب» بازنویسی شد.`
        : "مغایرتی برای اصلاح پیدا نشد.",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown price audit error";
    return NextResponse.json(
      { success: false, message: "اصلاح مغایرت قیمت‌ها ناموفق بود.", detail },
      { status: 400 },
    );
  }
}
