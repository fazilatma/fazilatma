import Link from "next/link";
import SellerStars from "@/components/SellerStars";
import { getJsonSellerRankings } from "@/lib/json-store";
import {
  SELLER_BENCHMARKS,
  SELLER_RATING_CRITERIA,
  ratingLevelClass,
} from "@/lib/seller-rating";

export const dynamic = "force-dynamic";

export default async function SellersPage() {
  const rankings = await getJsonSellerRankings();

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#003b5c]">
              رتبه‌بندی شفاف OptiBid
            </p>
            <h1 className="text-3xl font-bold text-[#003b5c]">فروشندگان و تامین‌کنندگان</h1>
            <p className="mt-2 text-gray-600">
              امتیاز هر فروشنده بر پایه کیفیت معامله، تحویل، پاسخ‌گویی، اعتماد و سابقه واقعی محاسبه می‌شود.
            </p>
          </div>
          <Link
            href="/become-seller"
            className="rounded-xl bg-[#003b5c] px-6 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-[#002d46]"
          >
            شروع فروشندگی
          </Link>
        </div>

        <details className="mb-8 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm" open>
          <summary className="cursor-pointer list-none text-lg font-bold text-gray-900">
            معیارهای امتیازدهی فروشنده چگونه محاسبه می‌شوند؟
          </summary>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            ارزیابی اصلی بر مبنای عملکرد ۹۰ روز اخیر انجام می‌شود. سفارش‌های دارای پرداخت واقعی، تحویل و تعاملات ثبت‌شده در سیستم ملاک هستند. امتیاز اولیه فروشندگان تازه‌وارد با برچسب «در حال ارزیابی» نمایش داده می‌شود و تا رسیدن به داده کافی، وارد رتبه‌بندی عمومی نمی‌شوند.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {SELLER_RATING_CRITERIA.map((item) => (
              <div key={item.key} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm font-bold text-[#003b5c]">{item.title}</p>
                <p className="mt-1 text-2xl font-bold text-[#00a8e8]">{item.weight}%</p>
                <p className="mt-2 text-xs leading-5 text-gray-500">{item.details}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-900 md:grid-cols-2">
            <p>هدف داخلی کیفیت: نقص سفارش کمتر از {SELLER_BENCHMARKS.orderDefectRate.healthy}% و لغو فروشنده کمتر از {SELLER_BENCHMARKS.cancellationRate.healthy}%.</p>
            <p>هدف خدمات: پاسخ اولیه ۲۴ ساعته حداقل {SELLER_BENCHMARKS.responseRate24h.healthy}%، ارسال به‌موقع حداقل {SELLER_BENCHMARKS.onTimeShippingRate.healthy}% و رهگیری معتبر حداقل {SELLER_BENCHMARKS.validTrackingRate.healthy}%.</p>
          </div>
        </details>

        {rankings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mb-4 text-5xl">🏪</div>
            <h2 className="text-xl font-bold text-gray-800">هنوز فروشنده‌ای ثبت نشده است</h2>
            <p className="mt-2 text-sm text-gray-500">پس از ثبت‌نام فروشنده، پروفایل او با وضعیت «در حال ارزیابی» در این صفحه ظاهر می‌شود.</p>
            <Link href="/register" className="mt-6 inline-block rounded-xl bg-[#00a8e8] px-6 py-3 font-bold text-white transition hover:bg-blue-500">
              ثبت‌نام فروشنده
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {rankings.map(({ seller, rating }, index) => {
              const metrics = seller.sellerMetrics;
              return (
                <Link
                  key={seller.id}
                  href={`/sellers/${seller.id}`}
                  className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#00a8e8] hover:shadow-lg"
                >
                  <div className="absolute left-5 top-5 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                    رتبه {rating.rankingEligible ? `#${index + 1}` : "آزمایشی"}
                  </div>
                  <div className="mb-5 flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#003b5c] text-2xl font-bold text-white">
                      {seller.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1 pl-20">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-xl font-bold text-gray-900">{seller.fullName}</h2>
                        <SellerStars score={rating.finalScore} size="sm" />
                        {metrics?.identityVerified && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">تایید هویت</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{seller.categories?.join("، ") || "حوزه فعالیت هنوز انتخاب نشده"}</p>
                    </div>
                  </div>

                  <div className="mb-5 rounded-2xl border border-blue-100 bg-gradient-to-l from-blue-50 to-white p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="font-bold text-gray-700">امتیاز اعتماد فروشنده</span>
                      <SellerStars score={rating.finalScore} size="md" />
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full rounded-full bg-gradient-to-l from-[#003b5c] to-[#00a8e8]" style={{ width: `${rating.finalScore}%` }} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className={`rounded-full border px-2 py-1 font-bold ${ratingLevelClass(rating.level)}`}>{rating.label}</span>
                      <span className="text-gray-500">اعتبار داده: {rating.confidence}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="font-bold text-[#003b5c]">{metrics?.completedOrders90d || 0}</div>
                      <div className="mt-1 text-gray-500">معامله ۹۰ روزه</div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="font-bold text-[#003b5c]">{rating.rates.bayesianRating.toLocaleString("fa-IR")}</div>
                      <div className="mt-1 text-gray-500">امتیاز تعدیل‌شده</div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="font-bold text-[#003b5c]">{rating.rates.responseRate24h.toLocaleString("fa-IR")}%</div>
                      <div className="mt-1 text-gray-500">پاسخ ۲۴ساعته</div>
                    </div>
                  </div>

                  {rating.minimumDataMessage && (
                    <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600">{rating.minimumDataMessage}</p>
                  )}
                  {rating.reasons.length > 0 && (
                    <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs leading-6 text-red-700">هشدار عملکرد: {rating.reasons.join("، ")}</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
