import Link from "next/link";
import SellerStars from "@/components/SellerStars";
import {
  getJsonBuyerRankings,
  getJsonHomepageStats,
  getJsonRequests,
  getJsonSellerRankings,
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

export default async function HomePage() {
  let displayRequests: Array<{
    id: number;
    title: string;
    description: string;
    budget: string;
    category: string;
    timeAgo: string;
    offers: number;
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
    const [stats, jsonRequests, sellerRankings, buyerRankings] = await Promise.all([
      getJsonHomepageStats(),
      getJsonRequests(),
      getJsonSellerRankings(),
      getJsonBuyerRankings(),
    ]);

    realStats = stats;
    topSellers = sellerRankings.filter((item) => item.rating.rankingEligible).slice(0, 4);
    topBuyers = buyerRankings.filter((item) => item.rankingEligible).slice(0, 4);
    displayRequests = jsonRequests.slice(0, 3).map((request) => ({
      id: request.id,
      title: request.title,
      description: request.description,
      budget: Number(request.budget || 0).toLocaleString("fa-IR") + " تومان",
      category: request.category || "سایر",
      timeAgo: "جدید",
      offers: request.offersCount,
    }));

    const categoryCountMap = new Map<string, number>();
    for (const request of jsonRequests) {
      categoryCountMap.set(
        request.category,
        (categoryCountMap.get(request.category) || 0) + 1
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
              درخواست خرید خود را ثبت کنید، از تامین‌کنندگان معتبر پیشنهاد قیمت دریافت کنید و با پرداخت امن امانی خرید کنید
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
              <div className="text-3xl md:text-4xl font-bold">{realStats.requestsCount.toLocaleString()}</div>
              <div className="text-green-200 mt-2">درخواست خرید فعال</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold">{realStats.sellersCount.toLocaleString()}</div>
              <div className="text-green-200 mt-2">تامین‌کننده فعال</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold">{realStats.secureTransactionsCount.toLocaleString()}</div>
              <div className="text-green-200 mt-2">تراکنش امن</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold">{realStats.successRate}٪</div>
              <div className="text-green-200 mt-2">معاملات موفق</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">دسته‌بندی‌های تخصصی</h2>
          <p className="text-gray-600 text-center mb-12">درخواست خرید خود را در دسته‌بندی مورد نظر ثبت کنید</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {displayCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.id}`}
                className="bg-gray-50 hover:bg-green-50 p-6 rounded-xl text-center card-hover border border-gray-100"
              >
                <div className="text-4xl mb-3">{cat.icon}</div>
                <h3 className="font-bold text-gray-800">{cat.nameFa}</h3>
                <p className="text-sm text-gray-500 mt-2">{cat.count.toLocaleString()} درخواست</p>
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
              <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 md:grid-cols-3 gap-6">
            {displayRequests.map((request) => (
              <Link
                key={request.id}
                href={`/requests/${request.id}`}
                className="bg-white p-6 rounded-xl card-hover border border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                    {request.category}
                  </span>
                  <span className="text-gray-400 text-sm">{request.timeAgo}</span>
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-800">{request.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{request.description}</p>
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="font-bold text-green-600">{request.budget}</span>
                  <span className="text-gray-500 text-sm">{request.offers} پیشنهاد قیمت</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* OptiBid Advantages */}
      <section className="bg-gradient-to-l from-[#003b5c] to-[#005e94] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-blue-100">چرا OptiBid؟</span>
            <h2 className="mt-5 text-3xl font-bold">تصمیم بهتر با داده واقعی، نه ادعای تبلیغاتی</h2>
            <p className="mt-4 leading-8 text-blue-100">قیمت رقابتی فروشندگان، امتیاز واقعی طرفین، پرداخت امانی و اسناد شفاف معامله در یک محیط یکپارچه.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "⚖️", title: "رقابت واقعی قیمت", text: "چند فروشنده برای یک درخواست واقعی پیشنهاد می‌دهند و خریدار مقایسه می‌کند." },
              { icon: "⭐", title: "اعتبار دوطرفه", text: "خریدار و فروشنده فقط پس از معامله تکمیل‌شده به یکدیگر امتیاز می‌دهند." },
              { icon: "🔒", title: "وجه امانی امن", text: "پول تا تایید دریافت کالا نزد OptiBid می‌ماند و سپس تسویه می‌شود." },
              { icon: "🧾", title: "سند و فاکتور شفاف", text: "سفارش، کمیسیون، رهگیری، تراکنش و فاکتور هر معامله قابل پیگیری است." },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm">
                <div className="text-4xl">{item.icon}</div>
                <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-blue-100">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Sellers */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">تامین‌کنندگان برتر</h2>
              <p className="text-gray-600 mt-2">بهترین و خوش‌حساب‌ترین تامین‌کنندگان پلتفرم</p>
            </div>
            <Link
              href="/sellers"
              className="text-green-600 hover:text-green-700 font-bold flex items-center gap-2"
            >
              مشاهده همه
              <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {topSellers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">هنوز فروشنده‌ای حداقل داده لازم برای ورود به رتبه‌بندی برتر را ندارد.</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {topSellers.map(({ seller, rating }) => (
                <Link key={seller.id} href={`/sellers/${seller.id}`} className="card-hover rounded-2xl border border-gray-100 bg-white p-6 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#003b5c] text-3xl font-bold text-white">{seller.fullName.charAt(0)}</div>
                  <h3 className="font-bold text-gray-800">{seller.fullName}</h3>
                  <p className="mb-3 mt-1 line-clamp-1 text-sm text-gray-500">{seller.categories?.join("، ") || "تامین‌کننده OptiBid"}</p>
                  <SellerStars score={rating.finalScore} size="sm" />
                  <p className="mt-2 text-xs text-gray-500">{seller.sellerMetrics?.completedOrdersLifetime || 0} معامله موفق</p>
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
              <p className="text-gray-600 mt-2">شرکت‌ها و خریداران عمده خوش‌حساب</p>
            </div>
            <Link
              href="/buyers"
              className="text-green-600 hover:text-green-700 font-bold flex items-center gap-2"
            >
              مشاهده همه
              <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {topBuyers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">هنوز خریداری حداقل ۳ معامله تکمیل‌شده و ۳ نظر فروشنده را برای ورود به رتبه‌بندی ندارد.</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {topBuyers.map(({ buyer, rating, completedOrders, reviewsCount }) => (
                <Link key={buyer.id} href={`/buyers/${buyer.id}`} className="card-hover rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-[#003b5c]">{buyer.fullName.charAt(0)}</div>
                  <h3 className="font-bold text-gray-800">{buyer.fullName}</h3>
                  <p className="mb-3 mt-1 text-sm text-gray-500">خریدار تاییدشده OptiBid</p>
                  <SellerStars score={rating * 20} size="sm" />
                  <p className="mt-2 text-xs text-gray-500">{completedOrders} معامله موفق · {reviewsCount} نظر فروشنده</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">آماده شروع هستید؟</h2>
          <p className="text-xl text-gray-400 mb-8">به عنوان خریدار درخواست دهید یا به عنوان تامین‌کننده پیشنهاد قیمت بفرستید</p>
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
