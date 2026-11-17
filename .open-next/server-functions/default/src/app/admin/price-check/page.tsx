import Link from "next/link";
import { cookies } from "next/headers";
import { getOptiBidData } from "@/lib/json-store";
import { applyStorePriceOverrides, getStorePriceOverridesByIds } from "@/lib/store-price-overrides";
import { normalizeStorePriceMultiplier, roundStorePrice, storedProductMarketPrice } from "@/lib/store-pricing";
import { getLiveStoreProductPriceSnapshot } from "@/lib/store-product-live";

export const dynamic = "force-dynamic";

const fa = (value: number | string) => Number(value || 0).toLocaleString("fa-IR");
const toman = (value: number) => `${fa(value)} تومان`;
const LOCK_DAYS = 3;

/** روزهای باقی‌مانده از اعتبار «قیمت تثبیت‌شدهٔ ادمین». */
function lockDaysLeft(lockedAt: number) {
  if (!Number.isFinite(lockedAt) || lockedAt <= 0) return 0;
  return Math.max(0, Math.ceil((LOCK_DAYS * 24 * 60 * 60 * 1000 - (Date.now() - lockedAt)) / 86_400_000));
}

/**
 * «چرا این قیمت این است؟» — هر لایه‌ای که در قیمت نهایی اثر دارد را کنار هم
 * نشان می‌دهد: دادهٔ اصلی، لایهٔ قیمت تأییدشده (KV)، تثبیت دستی ادمین و
 * خواندن زندهٔ بازار (با ?live=1).
 */
export default async function PriceCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; live?: string }>;
}) {
  const cookieStore = await cookies();
  if (cookieStore.get("optibid_admin")?.value !== "1") {
    return (
      <main dir="rtl" className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-black text-gray-900">این صفحه فقط برای مدیر سایت است.</p>
        <Link href="/login" className="mt-4 inline-block text-sm font-bold text-purple-700">
          ورود مدیر
        </Link>
      </main>
    );
  }

  const { slug = "", live } = await searchParams;
  const data = await getOptiBidData();
  const product = slug
    ? data.storeProducts.find((item) => item.slug === slug || item.id === slug) || null
    : null;

  if (!product) {
    return (
      <main dir="rtl" className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-xl font-black text-gray-900">بررسی قیمت یک کالا</h1>
        <p className="mt-2 text-sm text-gray-600">
          آدرس را به شکل <code dir="ltr">/admin/price-check?slug=prime-h610m-a-wifi-1mz5j9</code> باز کنید.
        </p>
        <p className="mt-2 text-xs text-gray-500">{fa(data.storeProducts.length)} کالا در فروشگاه ثبت است.</p>
      </main>
    );
  }

  const fallbackMultiplier = normalizeStorePriceMultiplier(data.settings.storePriceMultiplier, 1);
  const overrides = await getStorePriceOverridesByIds([product.id]);
  const override = overrides[product.id] || null;
  const storedMarketPrice = Math.round(storedProductMarketPrice(product));
  const dataMultiplier = normalizeStorePriceMultiplier(product.priceMultiplier ?? fallbackMultiplier, 1);
  const dataPrice = roundStorePrice(storedMarketPrice * dataMultiplier);
  const overrideMultiplier = override ? normalizeStorePriceMultiplier(override.priceMultiplier, 1) : 0;
  const overrideFormulaPrice = override ? roundStorePrice(override.marketPrice * overrideMultiplier) : 0;
  const displayed = applyStorePriceOverrides([product], overrides)[0];
  const lockedAt = Date.parse(String(product.priceLockedAt || ""));
  const lockRemainingDays = lockDaysLeft(lockedAt);

  const liveSnapshot = live === "1"
    ? await getLiveStoreProductPriceSnapshot(product, dataMultiplier, []).catch(() => null)
    : null;

  const rows: Array<[string, string]> = [
    ["عنوان", product.title],
    ["شناسه / آدرس", `${product.id} — /shop/${product.slug}`],
    ["قیمت نمایش‌داده‌شده (همین حالا)", toman(displayed.price)],
    ["قیمت مرجع ذخیره‌شده", storedMarketPrice ? toman(storedMarketPrice) : "ثبت نشده"],
    ["ضریب کالا", String(dataMultiplier)],
    ["قیمت از فرمول (مرجع × ضریب)", toman(dataPrice)],
    ["لایهٔ قیمت تأییدشده (KV)", override ? `${toman(overrideFormulaPrice)} — به‌روزرسانی ${override.updatedAt}` : "ندارد"],
    ["تثبیت دستی ادمین", lockedAt ? `${product.priceLockedAt} (${fa(lockRemainingDays)} روز اعتبار مانده)` : "ندارد"],
    ["ضریب سراسری فروشگاه", String(fallbackMultiplier)],
    ["لینک مرجع کالا", String(product.externalSourceUrl || product.sourceLink || "—")],
  ];

  return (
    <main dir="rtl" className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-black text-gray-900">چرا این قیمت این است؟</h1>
        <div className="flex gap-2">
          <Link
            href={`/admin/price-check?slug=${encodeURIComponent(product.slug)}&live=1`}
            className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-black text-white hover:bg-purple-700"
          >
            خواندن زندهٔ بازار
          </Link>
          <Link
            href={`/shop/${product.slug}`}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-black text-gray-700 hover:bg-gray-50"
          >
            صفحهٔ محصول
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([label, value], index) => (
              <tr key={label} className={index % 2 ? "bg-gray-50/60" : ""}>
                <th className="w-56 px-4 py-2 text-right text-xs font-bold text-gray-500">{label}</th>
                <td className="px-4 py-2 font-bold text-gray-800">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {live === "1" && (
        <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm font-bold text-purple-900">
          {liveSnapshot
            ? `خواندن زنده: کمترین قیمت بازار ${toman(liveSnapshot.marketPrice || 0)} × ضریب ${fa(
                liveSnapshot.priceMultiplier || 0,
              )} = ${toman(liveSnapshot.price || 0)} (${liveSnapshot.checkedAt})`
            : "خواندن زنده قیمت معتبری برنگرداند؛ بنابراین قیمت ذخیره‌شده نمایش داده می‌شود."}
        </div>
      )}

      <p className="mt-4 text-xs leading-6 text-gray-500">
        قانون فروشگاه: قیمت هر کالا = کمترین قیمت هم‌مدل در مراجع بازار × ضریب همان کالا. لایهٔ «تأییدشده»
        همان عدد را نگه می‌دارد و قیمت تثبیت‌شدهٔ ادمین تا ۳ روز توسط خواندن خودکار بازار بازنویسی نمی‌شود.
      </p>
    </main>
  );
}
