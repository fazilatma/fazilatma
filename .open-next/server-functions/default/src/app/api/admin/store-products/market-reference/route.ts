import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOptiBidData, writeOptiBidData } from "@/lib/json-store";
import { applyStorePriceFormula, normalizeStorePriceMultiplier, storedProductPriceMultiplier } from "@/lib/store-pricing";
import { saveStorePriceOverride } from "@/lib/store-price-overrides";
import { lowestPriceFromReferenceUrl } from "@/lib/store-price-refresh";

export const dynamic = "force-dynamic";

async function isAdminRequest() {
  return (await cookies()).get("optibid_admin")?.value === "1";
}

type Body = {
  productId?: string;
  slug?: string;
  query?: string;
  marketPrice?: number;
  referenceUrl?: string;
  multiplier?: number;
};

function matchProduct(products: Awaited<ReturnType<typeof getOptiBidData>>["storeProducts"], body: Body) {
  const id = String(body.productId || "").trim();
  const slug = String(body.slug || "").trim();
  const query = String(body.query || "").trim();
  if (id) {
    const found = products.find((product) => product.id === id);
    if (found) return found;
  }
  if (slug) {
    const found = products.find((product) => product.slug === slug);
    if (found) return found;
  }
  if (query) {
    const lower = query.toLowerCase();
    return (
      products.find((product) => product.id.toLowerCase() === lower || product.slug.toLowerCase() === lower) ||
      products.find((product) => product.title.toLowerCase().includes(lower)) ||
      null
    );
  }
  return null;
}

/**
 * تعیین «قیمت مرجع بازار» یک کالا از دو راه:
 *  ۱) لینک مرجعی که ادمین می‌دهد (ترب/دیجی‌کالا): کمترین قیمت آن صفحه گرفته می‌شود.
 *  ۲) عددی که ادمین خودش وارد می‌کند (وقتی استخراج خودکار ممکن نیست).
 * سپس قیمت فروشگاه = قیمت مرجع × ضریب همان کالا و در همهٔ لایه‌ها (دادهٔ اصلی و
 * لایهٔ قیمت تأییدشده) یکسان ذخیره می‌شود.
 */
export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, message: "دسترسی مدیریت لازم است." }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Body;
    const data = await getOptiBidData();
    const product = matchProduct(data.storeProducts, body);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "کالایی با این شناسه/نام پیدا نشد." },
        { status: 404 },
      );
    }

    let referencePrice = Math.max(0, Math.round(Number(body.marketPrice || 0)));
    let sourceNote = "ورود دستی قیمت مرجع";
    const referenceUrl = String(body.referenceUrl || "").trim();

    if (referenceUrl) {
      if (!/^https?:\/\//i.test(referenceUrl)) {
        return NextResponse.json(
          { success: false, message: "لینک مرجع باید با http یا https شروع شود." },
          { status: 400 },
        );
      }
      const extracted = await lowestPriceFromReferenceUrl(referenceUrl).catch(() => null);
      if (extracted?.price) {
        referencePrice = extracted.price;
        sourceNote = `کمترین قیمت لینک مرجع (${new URL(referenceUrl).hostname})`;
      } else if (!referencePrice) {
        return NextResponse.json(
          {
            success: false,
            message: "از این لینک قیمت معتبری خوانده نشد؛ عدد قیمت مرجع را دستی وارد کنید.",
          },
          { status: 422 },
        );
      }
    }

    if (!referencePrice) {
      return NextResponse.json(
        { success: false, message: "قیمت مرجع بازار را وارد کنید یا یک لینک معتبر بدهید." },
        { status: 400 },
      );
    }

    const fallbackMultiplier = normalizeStorePriceMultiplier(data.settings.storePriceMultiplier, 1);
    const multiplier = normalizeStorePriceMultiplier(
      Number(body.multiplier || 0) || storedProductPriceMultiplier(product, fallbackMultiplier),
      fallbackMultiplier,
    );

    const previousPrice = Math.round(Number(product.price || 0));
    const priced = applyStorePriceFormula(product, referencePrice, multiplier);
    const checkedAt = new Date().toISOString();
    const nextProduct = {
      ...priced,
      marketReferenceNote: `${sourceNote}: ${referencePrice.toLocaleString("fa-IR")} تومان × ضریب ${multiplier}`,
      externalSourceUrl: referenceUrl || product.externalSourceUrl,
      priceVerifiedAt: checkedAt,
      priceLockedAt: checkedAt,
      priceUpdatedAt: checkedAt.slice(0, 10),
      priceHistory: [
        ...(product.priceHistory || []),
        {
          recordedAt: checkedAt,
          price: priced.price,
          source: referenceUrl ? (referenceUrl.includes("torob") ? "torob" : "digikala") : "manual",
          sourceUrl: referenceUrl || undefined,
        },
      ].slice(-60),
    };

    const index = data.storeProducts.findIndex((item) => item.id === product.id);
    data.storeProducts[index] = nextProduct;
    await writeOptiBidData(data);
    await saveStorePriceOverride(nextProduct.id, {
      price: nextProduct.price,
      marketPrice: referencePrice,
      priceMultiplier: multiplier,
      updatedAt: checkedAt,
      available: nextProduct.priceAvailable !== false,
    }).catch(() => undefined);

    return NextResponse.json({
      success: true,
      id: nextProduct.id,
      slug: nextProduct.slug,
      title: nextProduct.title,
      from: previousPrice,
      price: nextProduct.price,
      marketPrice: referencePrice,
      multiplier,
      message: `قیمت «${nextProduct.title}» از ${previousPrice.toLocaleString("fa-IR")} به ${nextProduct.price.toLocaleString("fa-IR")} تومان تغییر کرد (${referencePrice.toLocaleString("fa-IR")} × ${multiplier.toLocaleString("fa-IR")}).`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "ثبت قیمت مرجع ناموفق بود.",
        detail: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 },
    );
  }
}
