import Link from "next/link";
import { notFound } from "next/navigation";
import SellerStars from "@/components/SellerStars";
import { getJsonBuyerRankings, getOptiBidData } from "@/lib/json-store";

export const dynamic = "force-dynamic";

const money = (value: number | string) => `${Number(String(value).replace(/\D/g, "") || 0).toLocaleString("fa-IR")} تومان`;
const dateLabel = (value?: string) => value ? new Date(value).toLocaleString("fa-IR", { dateStyle: "medium" }) : "—";

export default async function BuyerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, rankings] = await Promise.all([getOptiBidData(), getJsonBuyerRankings()]);
  const entry = rankings.find((item) => item.buyer.id === Number(id));
  if (!entry) notFound();

  const buyer = entry.buyer;
  const reviews = data.reviews
    .filter((review) => review.revieweeId === buyer.id && review.reviewerRole === "seller")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const reviewerById = new Map(data.users.map((user) => [user.id, user.fullName]));
  const completedOrders = data.orders
    .filter((order) => order.buyerId === buyer.id && order.status === "completed")
    .sort((a, b) => new Date(b.deliveredAt || b.createdAt).getTime() - new Date(a.deliveredAt || a.createdAt).getTime());
  const failedOrders = data.orders.filter((order) => order.buyerId === buyer.id && ["cancelled", "returned"].includes(order.status));
  const activeRequests = data.requests.filter((request) => request.buyerId === buyer.id && request.status === "open");
  const totalPurchaseAmount = completedOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const averagePurchaseAmount = Math.round(totalPurchaseAmount / Math.max(1, completedOrders.length));
  const categoryStats = [...completedOrders.reduce((map, order) => {
    const current = map.get(order.category) || { category: order.category || "سایر", count: 0, amount: 0 };
    current.count += 1;
    current.amount += Number(order.totalAmount || 0);
    map.set(current.category, current);
    return map;
  }, new Map<string, { category: string; count: number; amount: number }>()).values()].sort((a, b) => b.amount - a.amount);
  const successRate = completedOrders.length + failedOrders.length === 0 ? 0 : Math.round((completedOrders.length / (completedOrders.length + failedOrders.length)) * 100);
  const avatarUrl = buyer.avatarName ? `/api/avatar?userId=${buyer.id}&v=${encodeURIComponent(buyer.avatarName)}` : "";

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/buyers" className="hover:text-[#00a8e8]">خریداران</Link>
          <span className="mx-2">/</span>
          {buyer.fullName}
        </nav>

        <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
          <div className="bg-gradient-to-l from-[#003b5c] via-[#005e94] to-[#00a8e8] p-8 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] bg-white/15 text-4xl font-bold ring-4 ring-white/20">
                    {avatarUrl ? <img src={avatarUrl} alt={buyer.fullName} className="h-full w-full object-cover" /> : buyer.fullName.charAt(0)}
                  </div>
                  <div className="absolute -bottom-3 right-2 rounded-2xl bg-white px-3 py-1 shadow-lg">
                    <SellerStars score={entry.rating * 20} size="sm" showLabel={false} />
                  </div>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold">{buyer.fullName}</h1>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{entry.rankingEligible ? "خریدار معتبر" : "در حال ارزیابی"}</span>
                  </div>
                  <p className="mt-2 text-blue-100">{buyer.city || "موقعیت ثبت نشده"}</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2">
                    <span className="text-sm text-blue-100">امتیاز فروشندگان</span>
                    <SellerStars score={entry.rating * 20} size="md" light />
                  </div>
                </div>
              </div>
              <div className="rounded-3xl bg-white/10 p-4 text-center backdrop-blur-sm">
                <p className="text-sm text-blue-100">نرخ موفقیت خرید</p>
                <p className="mt-2 text-4xl font-bold">{successRate.toLocaleString("fa-IR")}٪</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-5">
            <StatCard label="خرید موفق" value={completedOrders.length.toLocaleString("fa-IR")} color="green" />
            <StatCard label="مبلغ خرید موفق" value={money(totalPurchaseAmount)} color="blue" />
            <StatCard label="میانگین خرید" value={money(averagePurchaseAmount)} color="purple" />
            <StatCard label="درخواست فعال" value={activeRequests.length.toLocaleString("fa-IR")} color="amber" />
            <StatCard label="دیدگاه فروشندگان" value={reviews.length.toLocaleString("fa-IR")} color="slate" />
          </div>

          <div className="border-t p-8">
            <h2 className="mb-3 text-xl font-bold text-gray-900">درباره خریدار</h2>
            <p className="leading-8 text-gray-600">{buyer.bio || "خریدار هنوز توضیحی درباره خود ثبت نکرده است."}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">خریدهای موفق خریدار</h2>
                <p className="mt-1 text-sm text-gray-500">سفارش‌های تکمیل‌شده‌ای که دریافت کالا توسط خریدار تایید شده است.</p>
              </div>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">{completedOrders.length.toLocaleString("fa-IR")} خرید موفق</span>
            </div>
            {completedOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">هنوز خرید موفقی برای این خریدار ثبت نشده است.</div>
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
                        <p className="mt-1 text-xs text-gray-500">فروشنده: {order.sellerName} · تاریخ تکمیل: {dateLabel(order.deliveredAt || order.createdAt)}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold text-[#0b9c56]">{money(order.totalAmount)}</p>
                        <p className="mt-1 font-mono text-xs text-gray-400">{order.id}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-gray-900">دسته‌های خرید موفق</h2>
            {categoryStats.length === 0 ? (
              <p className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">هنوز داده‌ای وجود ندارد.</p>
            ) : (
              <div className="space-y-3">
                {categoryStats.map((item) => (
                  <div key={item.category} className="rounded-2xl bg-gray-50 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <b className="text-gray-800">{item.category}</b>
                      <span className="text-gray-500">{item.count.toLocaleString("fa-IR")} خرید</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full rounded-full bg-gradient-to-l from-[#003b5c] to-[#00a8e8]" style={{ width: `${Math.min(100, (item.amount / Math.max(1, totalPurchaseAmount)) * 100)}%` }} />
                    </div>
                    <p className="mt-2 text-xs font-bold text-[#003b5c]">{money(item.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">نظرات کاربران و فروشندگان</h2>
              <p className="mt-1 text-sm text-gray-500">دیدگاه‌هایی که پس از معامله درباره این خریدار ثبت شده‌اند.</p>
            </div>
            <SellerStars score={entry.rating * 20} size="md" />
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
                          {reviewer?.avatarName ? <img src={`/api/avatar?userId=${reviewer.id}&v=${encodeURIComponent(reviewer.avatarName)}`} alt={reviewer.fullName} className="h-full w-full object-cover" /> : (reviewerById.get(review.reviewerId) || "ف").charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{reviewerById.get(review.reviewerId) || "فروشنده"}</p>
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
