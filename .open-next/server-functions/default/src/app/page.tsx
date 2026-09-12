import Link from "next/link";
import SellerStars from "@/components/SellerStars";
import BuyerModeButton from "@/components/BuyerModeButton";
import { ProductHeroImage } from "@/components/ProductImages";
import RequestSpecsModalButton from "@/components/RequestSpecsModalButton";
import SellerModeButton from "@/components/SellerModeButton";
import UserAvatar from "@/components/UserAvatar";
import type { ProductImageAttachment } from "@/lib/product-image-shared";
import type { ProductValuationFactors } from "@/lib/request-valuation";
import {
  getJsonBuyerRankings,
  getJsonHomepageStats,
  getJsonRequests,
  getJsonSellerRankings,
  getOptiBidData,
} from "@/lib/json-store";

export const dynamic = "force-dynamic";

// Sample categories data
const sampleCategories = [
  { id: 1, nameFa: "کالای دیجیتال", icon: "📱", count: 0 },
  { id: 2, nameFa: "مد و پوشاک", icon: "👕", count: 0 },
  { id: 3, nameFa: "خانه و آشپزخانه", icon: "🏠", count: 0 },
  { id: 4, nameFa: "زیبایی و سلامت", icon: "💄", count: 0 },
  { id: 5, nameFa: "کتاب و لوازم تحریر", icon: "📚", count: 0 },
  { id: 6, nameFa: "ورزش و سفر", icon: "⚽", count: 0 },
  { id: 7, nameFa: "اسباب‌بازی و کودک", icon: "🧸", count: 0 },
  { id: 8, nameFa: "خودرو و موتور", icon: "🚗", count: 0 },
];

function requestSpecBadges(request: {
  quantity?: number;
  description?: string;
  valuationFactors?: Partial<ProductValuationFactors>;
}) {
  const factors = request.valuationFactors || {};
  const badges = [
    factors.cpuCores ? `${Number(factors.cpuCores).toLocaleString("fa-IR")} هسته CPU` : "",
    factors.ramGb ? `RAM ${Number(factors.ramGb).toLocaleString("fa-IR")}GB` : "",
    factors.storageGb ? `${Number(factors.storageGb).toLocaleString("fa-IR")}GB SSD/HDD` : "",
    factors.displaySizeInch ? `${factors.displaySizeInch} اینچ` : "",
    factors.batteryHealthPercent ? `باتری ${Number(factors.batteryHealthPercent).toLocaleString("fa-IR")}٪` : "",
    request.quantity ? `تعداد ${Number(request.quantity).toLocaleString("fa-IR")}` : "",
  ].filter(Boolean);

  if (badges.length > 0) return badges.slice(0, 4);
  return String(request.description || "")
    .replace(/\s+/g, " ")
    .split(/[،,.]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export default async function HomePage() {
  let displayRequests: Array<{
    id: number;
    buyerId: number;
    title: string;
    description: string;
    budget: string;
    category: string;
    timeAgo: string;
    offers: number;
    quantity: number;
    productImages?: ProductImageAttachment[];
    valuationFactors?: Partial<ProductValuationFactors>;
    buyer?: { id: number; fullName: string; avatarName?: string };
    latestSeller?: { id: number; fullName: string; avatarName?: string };
  }> = [];
  let displayCategories = sampleCategories;
  let topSellers: Awaited<ReturnType<typeof getJsonSellerRankings>> = [];
  let topBuyers: Awaited<ReturnType<typeof getJsonBuyerRankings>> = [];
  let realStats = {
    requestsCount: 0,
    sellersCount: 0,
    secureTransactionsCount: 0,
    totalVolume: 0,
    successRate: 0,
  };

  try {
    const [stats, jsonRequests, sellerRankings, buyerRankings, data] =
      await Promise.all([
        getJsonHomepageStats(),
        getJsonRequests(),
        getJsonSellerRankings(),
        getJsonBuyerRankings(),
        getOptiBidData(),
      ]);

    realStats = stats;
    topSellers = sellerRankings
      .filter((item) => item.rating.rankingEligible)
      .slice(0, 4);
    topBuyers = buyerRankings
      .filter((item) => item.rankingEligible)
      .slice(0, 4);
    const publicUsers = new Map(
      data.users.map((user) => [
        user.id,
        { id: user.id, fullName: user.fullName, avatarName: user.avatarName },
      ]),
    );
    const offersByRequest = new Map<number, typeof data.offers>();
    for (const offer of data.offers) {
      const list = offersByRequest.get(offer.requestId) || [];
      list.push(offer);
      offersByRequest.set(offer.requestId, list);
    }

    displayRequests = jsonRequests.slice(0, 4).map((request) => {
      const latestOffer = offersByRequest.get(request.id)?.[0];
      return {
        id: request.id,
        buyerId: request.buyerId,
        title: request.title,
        description: request.description,
        budget: Number(request.budget || 0).toLocaleString("fa-IR") + " تومان",
        category: request.category || "سایر",
        timeAgo: "جدید",
        offers: request.offersCount,
        quantity: request.quantity,
        productImages: request.productImages || [],
        valuationFactors: request.valuationFactors,
        buyer: publicUsers.get(request.buyerId),
        latestSeller: latestOffer
          ? publicUsers.get(latestOffer.sellerId)
          : undefined,
      };
    });

    const categoryCountMap = new Map<string, number>();
    for (const request of jsonRequests) {
      categoryCountMap.set(
        request.category,
        (categoryCountMap.get(request.category) || 0) + 1,
      );
    }

    displayCategories = sampleCategories.map((category) => ({
      ...category,
      count: categoryCountMap.get(category.nameFa) || 0,
    }));
  } catch (error) {
    console.error("JSON home data error:", error);
  }

  return (
    <div dir="rtl" className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-l from-green-600 to-green-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              پلتفرم درخواست خرید و تامین کالا
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100">
              درخواست خرید خود را ثبت کنید، از تامین‌کنندگان معتبر پیشنهاد قیمت
              دریافت کنید و برای معامله مستقیم با فروشنده هماهنگ شوید
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                href="/request-purchase"
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl text-lg font-bold transition shadow-lg"
              >
                📝 ثبت درخواست خرید رایگان
              </Link>
              <Link
                href="/seller/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition shadow-lg"
              >
                💼 ورود به پنل فروشنده
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold">
                {realStats.requestsCount.toLocaleString()}
              </div>
              <div className="text-green-200 mt-2">درخواست خرید فعال</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold">
                {realStats.sellersCount.toLocaleString()}
              </div>
              <div className="text-green-200 mt-2">تامین‌کننده فعال</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold">
                {realStats.secureTransactionsCount.toLocaleString()}
              </div>
              <div className="text-green-200 mt-2">تراکنش امن</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold">
                {realStats.successRate}٪
              </div>
              <div className="text-green-200 mt-2">معاملات موفق</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">
            دسته‌بندی‌های تخصصی
          </h2>
          <p className="text-gray-600 text-center mb-12">
            درخواست خرید خود را در دسته‌بندی مورد نظر ثبت کنید
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {displayCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.id}`}
                className="bg-gray-50 hover:bg-green-50 p-6 rounded-xl text-center card-hover border border-gray-100"
              >
                <div className="text-4xl mb-3">{cat.icon}</div>
                <h3 className="font-bold text-gray-800">{cat.nameFa}</h3>
                <p className="text-sm text-gray-500 mt-2">
                  {cat.count.toLocaleString()} درخواست
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Purchase Requests */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">آخرین درخواست‌های خرید</h2>
              <p className="text-gray-600 mt-2">پیشنهاد قیمت خود را ثبت کنید</p>
            </div>
            <Link
              href="/requests"
              className="text-green-600 hover:text-green-700 font-bold flex items-center gap-2"
            >
              مشاهده همه
              <svg
                className="w-5 h-5 rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {displayRequests.map((request) => {
              const specBadges = requestSpecBadges(request);
              return (
                <article
                  key={request.id}
                  className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-2 p-3 pb-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <UserAvatar
                        user={request.buyer}
                        label={request.buyer?.fullName || "خریدار OptiBid"}
                        className="h-7 w-7"
                        rounded="rounded-full"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[10px] text-gray-500">درخواست‌دهنده</p>
                        <b className="block truncate text-xs text-gray-800">
                          {request.buyer?.fullName || "خریدار OptiBid"}
                        </b>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#00a8e8]">
                      {request.category}
                    </span>
                  </div>

                  <Link href={`/requests/${request.id}`} className="block">
                    <ProductHeroImage
                      images={request.productImages}
                      title={request.title}
                      category={request.category}
                      className="mx-auto h-32 w-32 rounded-xl"
                    />
                  </Link>

                  <div className="p-3">
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] text-gray-400">
                      <span>{request.timeAgo}</span>
                      <span>{request.offers.toLocaleString("fa-IR")} پیشنهاد</span>
                    </div>
                    <Link href={`/requests/${request.id}`}>
                      <h3 className="line-clamp-2 min-h-10 text-base font-bold leading-5 text-gray-900 transition group-hover:text-[#003b5c]">
                        {request.title}
                      </h3>
                    </Link>
                    <p className="mt-1.5 line-clamp-1 text-xs leading-6 text-gray-500">
                      {request.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {specBadges.map((badge) => (
                        <span
                          key={badge}
                          className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-600"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                      <span className="text-sm font-extrabold text-[#0b9c56]">
                        {request.budget}
                      </span>
                      <span className="text-[11px] font-bold text-gray-500">
                        {request.quantity.toLocaleString("fa-IR")} عدد
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <RequestSpecsModalButton
                        title={request.title}
                        description={request.description}
                        factors={request.valuationFactors}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-center text-xs font-bold text-gray-700 transition hover:bg-gray-50"
                        label="ریز مشخصات درخواست خرید"
                      />
                      <SellerModeButton
                        requestId={request.id}
                        requestBuyerId={request.buyerId}
                        requestCategory={request.category}
                        className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                        sellerLabel="ثبت پیشنهاد فروشنده"
                      />
                      <Link
                        href={`/requests/${request.id}`}
                        className="rounded-lg bg-green-600 px-3 py-2 text-center text-xs font-bold text-white transition hover:bg-green-700"
                      >
                        مشاهده آگهی
                      </Link>
                      <BuyerModeButton
                        targetUrl={`/requests/${request.id}`}
                        className="col-span-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-center text-xs font-bold text-green-700 transition hover:bg-green-100"
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Top Sellers */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">تامین‌کنندگان برتر</h2>
              <p className="text-gray-600 mt-2">
                بهترین و خوش‌حساب‌ترین تامین‌کنندگان پلتفرم
              </p>
            </div>
            <Link
              href="/sellers"
              className="text-green-600 hover:text-green-700 font-bold flex items-center gap-2"
            >
              مشاهده همه
              <svg
                className="w-5 h-5 rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {topSellers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
              هنوز فروشنده‌ای حداقل داده لازم برای ورود به رتبه‌بندی برتر را
              ندارد.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {topSellers.map(({ seller, rating }) => (
                <Link
                  key={seller.id}
                  href={`/sellers/${seller.id}`}
                  className="card-hover rounded-2xl border border-gray-100 bg-white p-6 text-center"
                >
                  <div className="mx-auto mb-4 w-fit">
                    <UserAvatar
                      user={seller}
                      className="h-20 w-20"
                      rounded="rounded-2xl"
                    />
                  </div>
                  <h3 className="font-bold text-gray-800">{seller.fullName}</h3>
                  <p className="mb-3 mt-1 line-clamp-1 text-sm text-gray-500">
                    {seller.categories?.join("، ") || "تامین‌کننده OptiBid"}
                  </p>
                  <SellerStars score={rating.finalScore} size="sm" />
                  <p className="mt-2 text-xs text-gray-500">
                    {seller.sellerMetrics?.completedOrdersLifetime || 0} معامله
                    موفق
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Buyers */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">خریداران برتر پلتفرم</h2>
              <p className="text-gray-600 mt-2">
                شرکت‌ها و خریداران عمده خوش‌حساب
              </p>
            </div>
            <Link
              href="/buyers"
              className="text-green-600 hover:text-green-700 font-bold flex items-center gap-2"
            >
              مشاهده همه
              <svg
                className="w-5 h-5 rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {topBuyers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
              هنوز خریداری حداقل ۳ معامله تکمیل‌شده و ۳ نظر فروشنده را برای ورود
              به رتبه‌بندی ندارد.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {topBuyers.map(
                ({ buyer, rating, completedOrders, reviewsCount }) => (
                  <Link
                    key={buyer.id}
                    href={`/buyers/${buyer.id}`}
                    className="card-hover rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center"
                  >
                    <div className="mx-auto mb-4 w-fit">
                      <UserAvatar
                        user={buyer}
                        className="h-20 w-20"
                        rounded="rounded-full"
                      />
                    </div>
                    <h3 className="font-bold text-gray-800">
                      {buyer.fullName}
                    </h3>
                    <p className="mb-3 mt-1 text-sm text-gray-500">
                      خریدار تاییدشده OptiBid
                    </p>
                    <SellerStars score={rating * 20} size="sm" />
                    <p className="mt-2 text-xs text-gray-500">
                      {completedOrders} معامله موفق · {reviewsCount} نظر فروشنده
                    </p>
                  </Link>
                ),
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            آماده شروع هستید؟
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            به عنوان خریدار درخواست دهید یا به عنوان تامین‌کننده پیشنهاد قیمت
            بفرستید
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition"
            >
              ثبت‌نام رایگان
            </Link>
            <Link
              href="/request-purchase"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl text-lg font-bold transition"
            >
              ثبت درخواست خرید
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
