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

const money = (value: number | string) => `${Number(String(value).replace(/\D/g, "") || 0).toLocaleString("fa-IR")} تومان`;
const dateLabel = (value?: string) => value ? new Date(value).toLocaleString("fa-IR", { dateStyle: "medium" }) : "—";

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

  const reviews = data.reviews
    .filter((review) => review.revieweeId === seller.id && review.reviewerRole === "buyer")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const reviewerById = new Map(data.users.map((user) => [user.id, user.fullName]));
  const completedOrders = data.orders
    .filter((order) => order.sellerId === seller.id && order.status === "completed")
    .sort((a, b) => new Date(b.deliveredAt || b.createdAt).getTime() - new Date(a.deliveredAt || a.createdAt).getTime());
  const failedOrders = data.orders.filter((order) => order.sellerId === seller.id && ["cancelled", "returned"].includes(order.status));
  const activeOrders = data.orders.filter((order) => order.sellerId === seller.id && ["paid", "shipped"].includes(order.status));
  const sellerOffers = data.offers.filter((offer) => offer.sellerId === seller.id);
  const acceptedOffers = sellerOffers.filter((offer) => offer.status === "accepted");
  const totalSalesAmount = completedOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const netSellerRevenue = completedOrders.reduce((sum, order) => sum + Number(order.sellerAmount || 0), 0);
  const averageSaleAmount = Math.round(totalSalesAmount / Math.max(1, completedOrders.length));
  const successRate = completedOrders.length + failedOrders.length === 0 ? 0 : Math.round((completedOrders.length / (completedOrders.length + failedOrders.length)) * 100);
  const avatarUrl = seller.avatarName ? `/api/avatar?userId=${seller.id}&v=${encodeURIComponent(seller.avatarName)}` : "";
  const categoryStats = [...completedOrders.reduce((map, order) => {
    const current = map.get(order.category) || { category: order.category || "سایر", count: 0, amount: 0 };
    current.count += 1;
    current.amount += Number(order.totalAmount || 0);
    map.set(current.category, current);
    return map;
  }, new Map<string, { category: string; count: number; amount: number }>()).values()].sort((a, b) => b.amount - a.amount);

  const metricRows = [
    { title: "قابلیت اتکا و کیفیت معامله", value: score.metrics.reliability, weight: 30, icon: "🛡️" },
    { title: "ارسال و تحویل", value: score.metrics.fulfilment, weight: 25, icon: "🚚" },
    { title: "رضایت و پاسخ‌گویی", value: score.metrics.buyerExperience, weight: 25, icon: "💬" },
    { title: "اعتماد و انطباق", value: score.metrics.trust, weight: 12, icon: "✅" },
    { title: "سابقه و فعالیت", value: score.metrics.experience, weight: 8, icon: "📈" },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-[#00a8e8]">خانه</Link>
          <span className="mx-2">/</span>
          <Link href="/sellers" className="hover:text-[#00a8e8]">فروشندگان</Link>
          <span className="mx-2">/</span>
          <span>{seller.fullName}</span>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
          <div className="bg-gradient-to-l from-[#003b5c] via-[#005e94] to-[#00a8e8] px-8 py-10 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] bg-white/15 text-4xl font-bold ring-4 ring-white/20">
                    {avatarUrl ? <img src={avatarUrl} alt={seller.fullName} className="h-full w-full object-cover" /> : seller.fullName.charAt(0)}
                  </div>
                  <div className="absolute -bottom-3 right-2 rounded-2xl bg-white px-3 py-1 shadow-lg">
                    <SellerStars score={score.finalScore} size="sm" showLabel={false} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold">{seller.fullName}</h1>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${ratingLevelClass(score.level)}`}>{score.label}</span>
                    {seller.sellerMetrics?.identityVerified && <span className="rounded-full bg-blue-400/20 px-3 py-1 text-xs font-bold">تایید هویت</span>}
                  </div>
                  <p className="text-blue-100">{seller.categories?.join("، ") || "حوزه فعالیت ثبت نشده"}</p>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">{seller.bio || "این فروشنده هنوز توضیحات پروفایل خود را تکمیل نکرده است."}</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2">
                    <span className="text-sm text-blue-100">امتیاز اعتماد فروشنده</span>
                    <SellerStars score={score.finalScore} size="md" light />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Link href="/request-purchase" className="rounded-xl bg-white px-5 py-3 text-center font-bold text-[#003b5c] transition hover:bg-blue-50">ثبت درخواست خرید</Link>
                <div className="rounded-3xl bg-white/10 p-4 text-center backdrop-blur-sm">
                  <p className="text-sm text-blue-100">نرخ موفقیت فروش</p>
                  <p className="mt-2 text-4xl font-bold">{successRate.toLocaleString("fa-IR")}٪</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-5">
            <StatCard label="فروش موفق" value={completedOrders.length.toLocaleString("fa-IR")} color="green" />
            <StatCard label="فروش ناخالص" value={money(totalSalesAmount)} color="blue" />
            <StatCard label="درآمد خالص فروشنده" value={money(netSellerRevenue)} color="purple" />
            <StatCard label="میانگین فروش" value={money(averageSaleAmount)} color="amber" />
            <StatCard label="دیدگاه خریداران" value={reviews.length.toLocaleString("fa-IR")} color="slate" />
          </div>

          <div className="grid gap-6 border-t p-8 lg:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-center">
              <p className="text-sm font-bold text-gray-600">امتیاز اعتماد</p>
              <div className="mt-3"><SellerStars score={score.finalScore} size="lg" /></div>
              <p className="mt-2 text-xs text-gray-500">امتیاز محاسباتی: {score.finalScore.toLocaleString("fa-IR")} از ۱۰۰</p>
              <span className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${ratingLevelClass(score.level)}`}>{score.label}</span>
            </div>
            <div className="lg:col-span-2">
              <h2 className="mb-4 text-lg font-bold text-gray-900">گزارش عملکرد ۹۰ روز اخیر</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniMetric label="امتیاز تعدیل‌شده" value={score.rates.bayesianRating.toLocaleString("fa-IR")} />
                <MiniMetric label="ارسال به‌موقع" value={`${score.rates.onTimeShippingRate.toLocaleString("fa-IR")}%`} />
                <MiniMetric label="رهگیری معتبر" value={`${score.rates.validTrackingRate.toLocaleString("fa-IR")}%`} />
                <MiniMetric label="پاسخ زیر ۲۴ ساعت" value={`${score.rates.responseRate24h.toLocaleString("fa-IR")}%`} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">فروش‌های موفق فروشنده</h2>
                <p className="mt-1 text-sm text-gray-500">سفارش‌هایی که خریدار دریافت کالا را تایید کرده و وجه آزاد شده است.</p>
              </div>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">{completedOrders.length.toLocaleString("fa-IR")} فروش موفق</span>
            </div>
            {completedOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">هنوز فروش موفقی برای این فروشنده ثبت نشده است.</div>
            ) : (
              <div className="space-y-3">
                {completedOrders.map((order) => (
                  <article key={order.id} className="rounded-2xl border border-gray-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/30">
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                      <div>
                        <div className="mb-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-700">تکمیل‌شده</span>
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">{order.category}</span>
                        </div>
                        <h3 className="font-bold text-[#003b5c]">{order.title}</h3>
                        <p className="mt-1 text-xs text-gray-500">خریدار: {order.buyerName} · تاریخ تکمیل: {dateLabel(order.deliveredAt || order.createdAt)}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold text-[#0b9c56]">{money(order.totalAmount)}</p>
                        <p className="mt-1 text-xs text-gray-500">خالص فروشنده: {money(order.sellerAmount)}</p>
                        <p className="mt-1 font-mono text-xs text-gray-400">{order.id}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">دسته‌های فروش موفق</h2>
              {categoryStats.length === 0 ? (
                <p className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">هنوز داده‌ای وجود ندارد.</p>
              ) : (
                <div className="space-y-3">
                  {categoryStats.map((item) => (
                    <div key={item.category} className="rounded-2xl bg-gray-50 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <b className="text-gray-800">{item.category}</b>
                        <span className="text-gray-500">{item.count.toLocaleString("fa-IR")} فروش</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full rounded-full bg-gradient-to-l from-[#003b5c] to-[#00a8e8]" style={{ width: `${Math.min(100, (item.amount / Math.max(1, totalSalesAmount)) * 100)}%` }} />
                      </div>
                      <p className="mt-2 text-xs font-bold text-[#003b5c]">{money(item.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">شاخص‌های سریع</h2>
              <div className="grid gap-3 text-sm">
                <QuickStat label="پیشنهادهای ثبت‌شده" value={sellerOffers.length.toLocaleString("fa-IR")} />
                <QuickStat label="پیشنهادهای پذیرفته‌شده" value={acceptedOffers.length.toLocaleString("fa-IR")} />
                <QuickStat label="سفارش‌های در جریان" value={activeOrders.length.toLocaleString("fa-IR")} />
                <QuickStat label="فروش ناموفق/لغوشده" value={failedOrders.length.toLocaleString("fa-IR")} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">نظرات کاربران و خریداران</h2>
              <p className="mt-1 text-sm text-gray-500">دیدگاه‌هایی که پس از معامله درباره این فروشنده ثبت شده‌اند.</p>
            </div>
            <SellerStars score={score.finalScore} size="md" />
          </div>
          {reviews.length === 0 ? (
            <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">هنوز دیدگاهی ثبت نشده است.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const reviewer = data.users.find((user) => user.id === review.reviewerId);
                return (
                  <article key={review.id} className="rounded-2xl border border-gray-100 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[#003b5c] text-sm font-bold text-white">
                          {reviewer?.avatarName ? <img src={`/api/avatar?userId=${reviewer.id}&v=${encodeURIComponent(reviewer.avatarName)}`} alt={reviewer.fullName} className="h-full w-full object-cover" /> : (reviewerById.get(review.reviewerId) || "خ").charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{reviewerById.get(review.reviewerId) || "خریدار"}</p>
                          <p className="mt-0.5 text-xs text-gray-400">{dateLabel(review.createdAt)}</p>
                        </div>
                      </div>
                      <SellerStars score={review.overall * 20} size="sm" />
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-600">{review.comment || "بدون توضیح"}</p>
                    <p className="mt-2 text-xs text-gray-400">سفارش {review.orderId}</p>
                  </article>
                );
              })}
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

function StatCard({ label, value, color }: { label: string; value: string; color: "green" | "blue" | "purple" | "amber" | "slate" }) {
  const colors = {
    green: "border-green-500 text-green-700 bg-green-50",
    blue: "border-blue-500 text-blue-700 bg-blue-50",
    purple: "border-purple-500 text-purple-700 bg-purple-50",
    amber: "border-amber-500 text-amber-700 bg-amber-50",
    slate: "border-slate-500 text-slate-700 bg-slate-50",
  }[color];

  return (
    <div className={`rounded-2xl border-b-4 p-5 text-center ${colors}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-gray-600">{label}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-gray-50 p-4 text-center"><p className="text-lg font-bold text-[#003b5c]">{value}</p><p className="mt-1 text-xs text-gray-500">{label}</p></div>;
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2"><span className="text-gray-600">{label}</span><b className="text-[#003b5c]">{value}</b></div>;
}
