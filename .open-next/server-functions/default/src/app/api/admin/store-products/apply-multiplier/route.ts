import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOptiBidData, writeOptiBidData } from "@/lib/json-store";
import {
  applyStorePriceFormula,
  normalizeStorePriceMultiplier,
  storedProductMarketPrice,
  storedProductPriceMultiplier,
} from "@/lib/store-pricing";
import { saveStorePriceOverride } from "@/lib/store-price-overrides";

export const dynamic = "force-dynamic";

/** حداکثر تعداد کالایی که در هر درخواست ضریب می‌گیرد (سقف عملیات KV در Worker). */
const MAX_PER_REQUEST = 120;

async function isAdminRequest() {
  return (await cookies()).get("optibid_admin")?.value === "1";
}

type Body = {
  multiplier?: number;
  /** «all» یا «source» (فقط کالاهای همان لینک مرجع). */
  scope?: "all" | "source";
  sourceUrl?: string;
  /** ضریب سراسری فروشگاه هم روی همین عدد تنظیم شود. */
  updateGlobal?: boolean;
};

function matchesSource(product: { externalSourceUrl?: string; sourceLink?: string }, sourceUrl: string) {
  const target = sourceUrl.trim();
  if (!target) return false;
  const candidates = [product.externalSourceUrl, product.sourceLink]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  return candidates.some((value) => value === target || value.startsWith(target) || target.startsWith(value));
}

/**
 * اعمال ضریب روی قیمت کالاها: قیمت فروشگاه = قیمت مرجع ذخیره‌شده × ضریب.
 *
 * برای کالاهایی که قیمت مرجع ذخیره‌شده ندارند، مرجع از قیمت فعلی و ضریب قبلی
 * بازسازی می‌شود تا ضریب جدید دقیقاً همان کالا را دوباره قیمت‌گذاری کند و هیچ
 * کالایی با قیمت صفر یا ساختگی رها نشود.
 */
export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, message: "دسترسی مدیریت لازم است." }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Body;
    const requested = Number(body.multiplier || 0);
    if (!Number.isFinite(requested) || requested < 0.1 || requested > 10) {
      return NextResponse.json(
        { success: false, message: "ضریب باید عددی بین ۰٫۱ و ۱۰ باشد." },
        { status: 400 },
      );
    }
    const multiplier = normalizeStorePriceMultiplier(requested, 1);
    const scope = body.scope === "source" ? "source" : "all";
    const sourceUrl = String(body.sourceUrl || "").trim();
    if (scope === "source" && !sourceUrl) {
      return NextResponse.json(
        { success: false, message: "برای اعمال روی یک لینک، آدرس آن لینک لازم است." },
        { status: 400 },
      );
    }

    const data = await getOptiBidData();
    const fallbackMultiplier = normalizeStorePriceMultiplier(data.settings.storePriceMultiplier, 1);
    const changed: Array<{ id: string; title: string; from: number; to: number }> = [];
    let skipped = 0;

    for (let index = 0; index < data.storeProducts.length; index += 1) {
      if (changed.length >= MAX_PER_REQUEST) break;
      const product = data.storeProducts[index];
      if (scope === "source" && !matchesSource(product, sourceUrl)) continue;
      const marketPrice = storedProductMarketPrice(product);
      if (!(marketPrice > 0)) {
        skipped += 1;
        continue;
      }
      const previousPrice = Math.round(Number(product.price || 0));
      const next = applyStorePriceFormula(product, marketPrice, multiplier);
      if (previousPrice === next.price && Number(product.priceMultiplier) === multiplier) continue;
      data.storeProducts[index] = {
        ...next,
        priceMultiplier: multiplier,
        priceUpdatedAt: product.priceUpdatedAt || new Date().toISOString().slice(0, 10),
      };
      changed.push({
        id: next.id,
        title: next.title,
        from: previousPrice,
        to: Math.round(Number(next.price || 0)),
      });
    }

    if (body.updateGlobal) {
      data.settings.storePriceMultiplier = multiplier;
    }

    if (changed.length || body.updateGlobal) {
      await writeOptiBidData(data);
      for (const item of changed) {
        const product = data.storeProducts.find((candidate) => candidate.id === item.id);
        if (!product) continue;
        await saveStorePriceOverride(product.id, {
          price: Math.round(Number(product.price || 0)),
          marketPrice: Math.round(storedProductMarketPrice(product)),
          priceMultiplier: multiplier,
          updatedAt: new Date().toISOString(),
          available: product.priceAvailable !== false,
        }).catch(() => undefined);
      }
    }

    const remaining = data.storeProducts.filter((product) => {
      if (scope === "source" && !matchesSource(product, sourceUrl)) return false;
      return storedProductPriceMultiplier(product, fallbackMultiplier) !== multiplier;
    }).length;

    return NextResponse.json({
      success: true,
      multiplier,
      updated: changed.length,
      remaining,
      skipped,
      updateGlobal: Boolean(body.updateGlobal),
      details: changed.slice(0, 30),
      message: changed.length
        ? `ضریب ${multiplier.toLocaleString("fa-IR")} روی ${changed.length.toLocaleString("fa-IR")} کالا اعمال شد${
            remaining > 0 ? `؛ ${remaining.toLocaleString("fa-IR")} کالا در دستهٔ بعدی` : ""
          }.`
        : "کالایی برای تغییر ضریب پیدا نشد.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "اعمال ضریب ناموفق بود.",
        detail: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 },
    );
  }
}
