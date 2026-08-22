import Link from "next/link";
import { notFound } from "next/navigation";
import SellerStars from "@/components/SellerStars";
import { getOptiBidData } from "@/lib/json-store";
import {
  calculateSellerScore,
  ratingLevelClass,
  SELLER_RATING_CRITERIA,
} from "@/lib/seller-rating";

interface SellerPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function SellerProfilePage({ params }: SellerPageProps) {
  const { id } = await params;
  const data = await getOptiBidData();
  const seller = data.users.find(
    (user) => user.id === Number(id) && user.role === "seller"
  );

  if (!seller) notFound();

  const score = calculateSellerScore(seller.sellerMetrics || {
    completedOrders90d: 0,
    completedOrdersLifetime: 0,
    reviewsCount90d: 0,
    ratingAverage90d: 0,
    firstMessagesReceived90d: 0,
    firstMessagesAnsweredWithin24h: 0,
    averageFirstResponseHours: 0,
    shippedOrders90d: 0,
    onTimeShipments90d: 0,
    trackedShipments90d: 0,
    validTrackedShipments90d: 0,
    sellerCancellations90d: 0,
    orderDefects90d: 0,
    unresolvedCases90d: 0,
    sellerFaultReturns90d: 0,
    stockMismatchCancellations90d: 0,
    disputesResolvedAgainstSeller90d: 0,
    identityVerified: false,
    bankAccountVerified: false,
    businessDocumentsVerified: false,
    policyViolationsOpen: 0,
    profileCompletenessPercent: 0,
    activeInLast30Days: false,
  });

  const reviews = data.reviews.filter((review) => review.revieweeId === seller.id && review.reviewerRole === "buyer");
  const reviewerById = new Map(data.users.map((user) => [user.id, user.fullName]));

  const metricRows = [
    { title: "قابلیت اتکا و کیفیت معامله", value: score.metrics.reliability, weight: 30, icon: "🛡️" },
    { title: "ارسال و تحویل", value: score.metrics.fulfilment, weight: 25, icon: "🚚" },
    { title: "رضایت و پاسخ‌گویی", value: score.metrics.buyerExperience, weight: 25, icon: "💬" },
    { title: "اعتماد و انطباق", value: score.metrics.trust, weight: 12, icon: "✅" },
    { title: "سابقه و فعالیت", value: score.metrics.experience, weight: 8, icon: "📈" },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-[#00a8e8]">خانه</Link>
          <span className="mx-2">/</span>
          <Link href="/sellers" className="hover:text-[#00a8e8]">فروشندگان</Link>
          <span className="mx-2">/</span>
          <span>{seller.fullName}</span>
        </div>

        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="bg-gradient-to-l from-[#003b5c] to-[#005e94] px-8 py-10 text-white">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 text-4xl font-bold ring-4 ring-white/20">
                {seller.fullName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold">{seller.fullName}</h1>
                  <SellerStars score={score.finalScore} size="sm" light />
                  {seller.sellerMetrics?.identityVerified && <span className="rounded-full bg-blue-400/20 px-3 py-1 text-xs font-bold">تایید هویت</span>}
                </div>
                <p className="text-blue-100">{seller.categories?.join("، ") || "حوزه فعالیت ثبت نشده"}</p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">{seller.bio || "این فروشنده هنوز توضیحات پروفایل خود را تکمیل نکرده است."}</p>
              </div>
              <Link href="/request-purchase" className="rounded-xl bg-white px-5 py-3 text-center font-bold text-[#003b5c] transition hover:bg-blue-50">ثبت درخواست خرید</Link>
            </div>
          </div>

          <div className="grid gap-6 p-8 lg:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-center">
              <p className="text-sm font-bold text-gray-600">امتیاز اعتماد</p>
              <div className="mt-3"><SellerStars score={score.finalScore} size="lg" /></div>
              <p className="mt-2 text-xs text-gray-500">امتیاز محاسباتی: {score.finalScore.toLocaleString("fa-IR")} از ۱۰۰</p>
              <span className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${ratingLevelClass(score.level)}`}>{score.label}</span>
            </div>
            <div className="lg:col-span-2">
              <h2 className="mb-4 text-lg font-bold text-gray-900">گزارش عملکرد ۹۰ روز اخیر</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-gray-50 p-4 text-center"><p className="text-lg font-bold text-[#003b5c]">{score.rates.bayesianRating.toLocaleString("fa-IR")}</p><p className="mt-1 text-xs text-gray-500">امتیاز تعدیل‌شده</p></div>
                <div className="rounded-xl bg-gray-50 p-4 text-center"><p className="text-lg font-bold text-[#003b5c]">{score.rates.onTimeShippingRate.toLocaleString("fa-IR")}%</p><p className="mt-1 text-xs text-gray-500">ارسال به‌موقع</p></div>
                <div className="rounded-xl bg-gray-50 p-4 text-center"><p className="text-lg font-bold text-[#003b5c]">{score.rates.validTrackingRate.toLocaleString("fa-IR")}%</p><p className="mt-1 text-xs text-gray-500">رهگیری معتبر</p></div>
                <div className="rounded-xl bg-gray-50 p-4 text-center"><p className="text-lg font-bold text-[#003b5c]">{score.rates.responseRate24h.toLocaleString("fa-IR")}%</p><p className="mt-1 text-xs text-gray-500">پاسخ زیر ۲۴ ساعت</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-gray-900">دیدگاه‌ها</h2>
          {reviews.length === 0 ? (
            <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">هنوز دیدگاهی ثبت نشده است.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <article key={review.id} className="rounded-2xl border border-gray-100 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-bold text-gray-900">{reviewerById.get(review.reviewerId) || "خریدار"}</p>
                    <SellerStars score={review.overall * 20} size="sm" />
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-600">{review.comment || "بدون توضیح"}</p>
                  <p className="mt-2 text-xs text-gray-400">سفارش {review.orderId}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-900">جزئیات امتیازدهی شفاف</h2>
            <span className="text-sm text-gray-500">اعتبار داده: {score.confidence}%</span>
          </div>
          <div className="space-y-5">
            {metricRows.map((metric) => (
              <div key={metric.title}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-bold text-gray-700">{metric.icon} {metric.title} <span className="font-normal text-gray-400">({metric.weight}% وزن)</span></span>
                  <span className="font-bold text-[#003b5c]">{metric.value.toLocaleString("fa-IR")} / ۱۰۰</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-gradient-to-l from-[#003b5c] to-[#00a8e8]" style={{ width: `${metric.value}%` }} /></div>
              </div>
            ))}
          </div>
          {score.minimumDataMessage && <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">{score.minimumDataMessage}</p>}
          {score.reasons.length > 0 && <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm leading-7 text-red-700">هشدارهای عملکرد: {score.reasons.join("، ")}</p>}
        </section>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">شاخص‌های کنترلی OptiBid</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {SELLER_RATING_CRITERIA.map((criterion) => <div key={criterion.key} className="rounded-xl bg-gray-50 p-4"><p className="font-bold text-[#003b5c]">{criterion.title} — {criterion.weight}%</p><p className="mt-2 text-xs leading-6 text-gray-500">{criterion.details}</p></div>)}
          </div>
        </section>
      </div>
    </div>
  );
}
