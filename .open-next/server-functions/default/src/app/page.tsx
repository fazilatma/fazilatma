import Link from "next/link";
import AmazingDealsSection, {
  type AmazingDealItem,
} from "@/components/AmazingDealsSection";
import AmazingOfferNotification from "@/components/AmazingOfferNotification";
import SellerStars from "@/components/SellerStars";
import StorefrontHome from "@/components/StorefrontHome";
import BuyerModeButton from "@/components/BuyerModeButton";
import HomeCategoryMenu from "@/components/HomeCategoryMenu";
import HorizontalScroller from "@/components/HorizontalScroller";
import HomepageImageSlider, {
  type HomepageImageSliderSlide,
} from "@/components/HomepageImageSlider";
import PersonalizedRequestRows, {
  type PersonalizedRequestItem,
} from "@/components/PersonalizedRequestRows";
import { ProductHeroImage } from "@/components/ProductImages";
import RequestSpecsModalButton from "@/components/RequestSpecsModalButton";
import SellerModeButton from "@/components/SellerModeButton";
import UserAvatar from "@/components/UserAvatar";
import type { ProductImageAttachment } from "@/lib/product-image-shared";
import {
  defaultCatalogCategories,
  type CatalogCategory,
} from "@/lib/catalog-categories";
import type { ProductValuationFactors } from "@/lib/request-valuation";
import {
  getJsonBuyerRankings,
  getJsonHomepageStats,
  getJsonPriceGrowthSignals,
  getJsonRequests,
  getJsonSellerRankings,
  getOptiBidData,
  type JsonStoreProduct,
  type SiteMode,
} from "@/lib/json-store";

export const dynamic = "force-dynamic";

type HomeCategory = CatalogCategory & { count: number };

function moneyValue(value?: string | number) {
  return Number(String(value || "").replace(/\D/g, "")) || 0;
}

function boundedOpportunity(value: number) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

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

type HomeRequestCard = {
  id: number;
  buyerId: number;
  title: string;
  description: string;
  budget: string;
  budgetValue: number;
  category: string;
  timeAgo: string;
  offers: number;
  quantity: number;
  productImages?: ProductImageAttachment[];
  valuationFactors?: Partial<ProductValuationFactors>;
  buyer?: { id: number; fullName: string; avatarName?: string };
  latestSeller?: { id: number; fullName: string; avatarName?: string };
  growthScore: number;
  opportunityScore: number;
  growthSignal?: Awaited<ReturnType<typeof getJsonPriceGrowthSignals>>[number];
};

export default async function HomePage() {
  let displayRequests: HomeRequestCard[] = [];
  let bestSellingRequests: HomeRequestCard[] = [];
  let growthPredictionRequests: HomeRequestCard[] = [];
  let mostRequestedRequests: HomeRequestCard[] = [];
  let amazingDealsRequests: AmazingDealItem[] = [];
  let personalizedRequests: PersonalizedRequestItem[] = [];
  let homepageImageSlides: HomepageImageSliderSlide[] = [];
  let siteMode: SiteMode = "store";
  let storeProducts: JsonStoreProduct[] = [];
  let amazingSettings = {
    enabled: true,
    durationHours: 6,
    discountCode: "OPTIBID",
    notificationEnabled: true,
    notificationTitle: "فرصت ویژه درخواست خرید",
    notificationText:
      "درخواست‌های خرید با بودجه جذاب و کمبود پیشنهاد فروشنده را سریع‌تر بررسی کنید.",
  };
  let homeSettings = {
    heroTitle: "پلتفرم درخواست خرید و تامین کالا",
    heroSubtitle:
      "درخواست خرید خود را ثبت کنید، از تامین‌کنندگان معتبر پیشنهاد قیمت دریافت کنید و برای معامله مستقیم با فروشنده هماهنگ شوید",
    showStats: true,
    showCategories: false,
    categoriesTitle: "دسته‌بندی کالاها",
    categoryFontFamily: "Vazir",
    categoryFontSize: "18",
    imageSliderEnabled: true,
    imageSliderTitle: "اسلایدر ویژه درخواست‌های خرید",
    imageSliderSubtitle:
      "جایگاه تبلیغات، نردبان درخواست و کمپین‌های ویژه لپ‌تاپ و کامپیوتر دست‌دوم",
    imageSliderDurationSeconds: 5,
    showOpportunityRequests: true,
    opportunityTitle: "درخواست‌های داغ فروشندگان",
    opportunitySubtitle:
      "درخواست‌هایی با بودجه جذاب، تعداد بالاتر یا کمبود پیشنهاد فروشنده",
    showBestSelling: true,
    bestSellingTitle: "پررقابت‌ترین درخواست‌ها",
    bestSellingSubtitle: "آگهی‌هایی که بیشترین رقابت فروشنده‌ها را گرفته‌اند",
    showGrowthSignals: true,
    growthSignalsTitle: "سیگنال واقعی رشد قیمت",
    growthSignalsSubtitle:
      "بر اساس رشد تقاضا، فشار عرضه/پیشنهاد، روند قیمت، RSI، MACD و داده بیرونی در صورت دسترسی",
    showMostRequested: true,
    mostRequestedTitle: "بیشترین درخواست‌شده",
    mostRequestedSubtitle: "درخواست‌هایی با تعداد بیشتر یا تقاضای بالاتر",
    showPersonalizedRows: true,
    personalizedTitle: "بر اساس جستجوهای اخیر شما",
    personalizedSubtitle: "کلیدواژه‌های اخیر",
    relatedTitle: "پیشنهادهای نزدیک به علاقه شما",
    relatedSubtitle: "آگهی‌های هم‌دسته با جستجوهای قبلی شما",
    showLatestRequests: true,
    latestRequestsTitle: "آخرین درخواست‌های خرید",
    latestRequestsSubtitle: "پیشنهاد قیمت خود را ثبت کنید",
    showTopSellers: true,
    topSellersTitle: "تامین‌کنندگان برتر",
    topSellersSubtitle: "بهترین و خوش‌حساب‌ترین تامین‌کنندگان پلتفرم",
    showTopBuyers: true,
    topBuyersTitle: "خریداران برتر پلتفرم",
    topBuyersSubtitle: "شرکت‌ها و خریداران عمده خوش‌حساب",
    showFinalCta: true,
    finalCtaTitle: "آماده شروع هستید؟",
    finalCtaSubtitle:
      "به عنوان خریدار درخواست دهید یا به عنوان تامین‌کننده پیشنهاد قیمت بفرستید",
  };
  let displayCategories: HomeCategory[] = defaultCatalogCategories.map(
    (category) => ({ ...category, count: 0 }),
  );
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
    const [
      stats,
      jsonRequests,
      sellerRankings,
      buyerRankings,
      data,
      priceGrowthSignals,
    ] = await Promise.all([
      getJsonHomepageStats(),
      getJsonRequests(),
      getJsonSellerRankings(),
      getJsonBuyerRankings(),
      getOptiBidData(),
      getJsonPriceGrowthSignals(12),
    ]);

    realStats = stats;
    siteMode = data.settings.siteMode === "request" ? "request" : "store";
    storeProducts = (data.storeProducts || []).filter(
      (product) => product.isActive && product.stock > 0,
    );
    amazingSettings = {
      enabled: data.settings.amazingDealsEnabled,
      durationHours: data.settings.amazingDealsDurationHours,
      discountCode: data.settings.amazingDealsDiscountCode,
      notificationEnabled: data.settings.amazingDealsNotificationEnabled,
      notificationTitle: data.settings.amazingDealsNotificationTitle,
      notificationText: data.settings.amazingDealsNotificationText,
    };
    homeSettings = {
      heroTitle: data.settings.homepageHeroTitle,
      heroSubtitle: data.settings.homepageHeroSubtitle,
      showStats: data.settings.homepageShowStats,
      showCategories: data.settings.homepageShowCategorySection,
      categoriesTitle: data.settings.homepageCategoriesTitle,
      categoryFontFamily: data.settings.homepageCategoryFontFamily,
      categoryFontSize: data.settings.homepageCategoryFontSize,
      imageSliderEnabled: data.settings.homepageImageSliderEnabled,
      imageSliderTitle: data.settings.homepageImageSliderTitle,
      imageSliderSubtitle: data.settings.homepageImageSliderSubtitle,
      imageSliderDurationSeconds: data.settings.homepageImageSliderDurationSeconds,
      showOpportunityRequests: data.settings.homepageShowOpportunityRequests,
      opportunityTitle: data.settings.homepageOpportunityTitle,
      opportunitySubtitle: data.settings.homepageOpportunitySubtitle,
      showBestSelling: data.settings.homepageShowBestSelling,
      bestSellingTitle: data.settings.homepageBestSellingTitle,
      bestSellingSubtitle: data.settings.homepageBestSellingSubtitle,
      showGrowthSignals: data.settings.homepageShowGrowthSignals,
      growthSignalsTitle: data.settings.homepageGrowthSignalsTitle,
      growthSignalsSubtitle: data.settings.homepageGrowthSignalsSubtitle,
      showMostRequested: data.settings.homepageShowMostRequested,
      mostRequestedTitle: data.settings.homepageMostRequestedTitle,
      mostRequestedSubtitle: data.settings.homepageMostRequestedSubtitle,
      showPersonalizedRows: data.settings.homepageShowPersonalizedRows,
      personalizedTitle: data.settings.homepagePersonalizedTitle,
      personalizedSubtitle: data.settings.homepagePersonalizedSubtitle,
      relatedTitle: data.settings.homepageRelatedTitle,
      relatedSubtitle: data.settings.homepageRelatedSubtitle,
      showLatestRequests: data.settings.homepageShowLatestRequests,
      latestRequestsTitle: data.settings.homepageLatestRequestsTitle,
      latestRequestsSubtitle: data.settings.homepageLatestRequestsSubtitle,
      showTopSellers: data.settings.homepageShowTopSellers,
      topSellersTitle: data.settings.homepageTopSellersTitle,
      topSellersSubtitle: data.settings.homepageTopSellersSubtitle,
      showTopBuyers: data.settings.homepageShowTopBuyers,
      topBuyersTitle: data.settings.homepageTopBuyersTitle,
      topBuyersSubtitle: data.settings.homepageTopBuyersSubtitle,
      showFinalCta: data.settings.homepageShowFinalCta,
      finalCtaTitle: data.settings.homepageFinalCtaTitle,
      finalCtaSubtitle: data.settings.homepageFinalCtaSubtitle,
    };
    homepageImageSlides = data.settings.homepageImageSliderSlides || [];
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
    const growthSignalByProduct = new Map(
      priceGrowthSignals.map((signal) => [signal.product, signal]),
    );

    const mappedRequests: HomeRequestCard[] = jsonRequests.map((request) => {
      const latestOffer = offersByRequest.get(request.id)?.[0];
      const budgetValue = Number(request.budget || 0);
      const budgetUnit = budgetValue / Math.max(1, Number(request.quantity || 1));
      const marketReference = moneyValue(
        request.valuationFactors?.sameNewProductPrice,
      );
      const growthSignal = growthSignalByProduct.get(request.title);
      const marketPremiumScore =
        marketReference && budgetUnit > marketReference
          ? ((budgetUnit - marketReference) / marketReference) * 45
          : 0;
      const quantityScore = Math.min(25, Number(request.quantity || 1) * 4);
      const scarcityScore = latestOffer ? 6 : 22;
      const budgetScore = Math.min(25, budgetValue / 250_000_000);
      const signalScore = growthSignal ? Math.max(0, Math.min(20, growthSignal.score / 5)) : 0;
      const opportunityScore = boundedOpportunity(
        marketPremiumScore + quantityScore + scarcityScore + budgetScore + signalScore,
      );
      return {
        id: request.id,
        buyerId: request.buyerId,
        title: request.title,
        description: request.description,
        budget: budgetValue.toLocaleString("fa-IR") + " تومان",
        budgetValue,
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
        growthScore: growthSignal?.score ?? 0,
        opportunityScore,
        growthSignal,
      };
    });

    displayRequests = mappedRequests.slice(0, 4);
    bestSellingRequests = [...mappedRequests]
      .sort((a, b) => b.offers - a.offers || b.budgetValue - a.budgetValue)
      .slice(0, 10);
    growthPredictionRequests = [...mappedRequests]
      .filter((item) => item.growthSignal)
      .sort((a, b) => b.growthScore - a.growthScore)
      .slice(0, 10);
    mostRequestedRequests = [...mappedRequests]
      .sort((a, b) => b.quantity - a.quantity || b.offers - a.offers)
      .slice(0, 10);
    amazingDealsRequests = [...mappedRequests]
      .filter((request) => request.opportunityScore > 0)
      .sort(
        (a, b) =>
          b.opportunityScore - a.opportunityScore ||
          b.budgetValue - a.budgetValue,
      )
      .slice(0, 12)
      .map((request) => ({
        id: request.id,
        title: request.title,
        category: request.category,
        budget: request.budget,
        opportunityScore: request.opportunityScore,
        quantity: request.quantity,
        offers: request.offers,
        productImages: request.productImages,
      }));
    personalizedRequests = mappedRequests.map((request) => ({
      id: request.id,
      title: request.title,
      description: request.description,
      category: request.category,
      budget: request.budget,
      quantity: request.quantity,
      offers: request.offers,
      productImages: request.productImages,
    }));

    const categoryCountMap = new Map<string, number>();
    for (const request of jsonRequests) {
      categoryCountMap.set(
        request.category,
        (categoryCountMap.get(request.category) || 0) + 1,
      );
    }

    displayCategories = (data.catalogCategories || defaultCatalogCategories)
      .filter((category) => category.isActive !== false)
      .map((category) => ({
        ...category,
        count: categoryCountMap.get(category.name) || 0,
      }));
  } catch (error) {
    console.error("JSON home data error:", error);
  }

  if (siteMode === "store") {
    return <StorefrontHome products={storeProducts} />;
  }

  return (
    <div dir="rtl" className="min-h-screen">
      <AmazingOfferNotification
        deal={amazingDealsRequests[0]}
        settings={{
          enabled:
            amazingSettings.notificationEnabled && homeSettings.showOpportunityRequests,
          title: amazingSettings.notificationTitle,
          text: amazingSettings.notificationText,
          discountCode: amazingSettings.discountCode,
        }}
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-l from-green-600 to-green-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {homeSettings.heroTitle}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100">
              {homeSettings.heroSubtitle}
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
          {homeSettings.showStats && (
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
          )}
        </div>
      </section>

      {homeSettings.imageSliderEnabled && (
        <HomepageImageSlider
          title={homeSettings.imageSliderTitle}
          subtitle={homeSettings.imageSliderSubtitle}
          durationSeconds={homeSettings.imageSliderDurationSeconds}
          slides={homepageImageSlides}
        />
      )}

      {/* Categories Section */}
      {homeSettings.showCategories && (
        <section className="bg-white py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h2
                className="font-black text-gray-900"
                style={{
                  fontFamily: homeSettings.categoryFontFamily,
                  fontSize: `${Math.max(22, Number(homeSettings.categoryFontSize) + 10)}px`,
                }}
              >
                {homeSettings.categoriesTitle}
              </h2>
            </div>

            <HomeCategoryMenu
              categories={displayCategories}
              fontFamily={homeSettings.categoryFontFamily}
              fontSize={homeSettings.categoryFontSize}
            />
          </div>
        </section>
      )}

      <AmazingDealsSection
        items={amazingDealsRequests}
        settings={{
          enabled: amazingSettings.enabled && homeSettings.showOpportunityRequests,
          durationHours: amazingSettings.durationHours,
          discountCode: amazingSettings.discountCode,
          title: homeSettings.opportunityTitle,
          subtitle: homeSettings.opportunitySubtitle,
        }}
      />

      {(homeSettings.showBestSelling ||
        homeSettings.showGrowthSignals ||
        homeSettings.showMostRequested) && (
        <section className="bg-gray-50 py-10">
          <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
            {homeSettings.showBestSelling && (
              <RequestSliderSection
                title={homeSettings.bestSellingTitle}
                subtitle={homeSettings.bestSellingSubtitle}
                items={bestSellingRequests}
                accent="bg-rose-600"
              />
            )}
            {homeSettings.showGrowthSignals && (
              <RequestSliderSection
                title={homeSettings.growthSignalsTitle}
                subtitle={homeSettings.growthSignalsSubtitle}
                items={growthPredictionRequests}
                accent="bg-[#003b5c]"
                showGrowthSignals
              />
            )}
            {homeSettings.showMostRequested && (
              <RequestSliderSection
                title={homeSettings.mostRequestedTitle}
                subtitle={homeSettings.mostRequestedSubtitle}
                items={mostRequestedRequests}
                accent="bg-[#0b9c56]"
              />
            )}
          </div>
        </section>
      )}

      {homeSettings.showPersonalizedRows && (
        <PersonalizedRequestRows
          requests={personalizedRequests}
          titles={{
            personalizedTitle: homeSettings.personalizedTitle,
            personalizedSubtitle: homeSettings.personalizedSubtitle,
            relatedTitle: homeSettings.relatedTitle,
            relatedSubtitle: homeSettings.relatedSubtitle,
          }}
        />
      )}

      {/* Latest Purchase Requests */}
      {homeSettings.showLatestRequests && (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">{homeSettings.latestRequestsTitle}</h2>
              <p className="text-gray-600 mt-2">{homeSettings.latestRequestsSubtitle}</p>
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
                      className="mx-auto h-28 w-28 rounded-xl"
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
                        sellerLabel="ورود به عنوان فروشنده"
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
      )}

      {/* Top Sellers */}
      {homeSettings.showTopSellers && (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">{homeSettings.topSellersTitle}</h2>
              <p className="text-gray-600 mt-2">
                {homeSettings.topSellersSubtitle}
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
      )}

      {/* Top Buyers */}
      {homeSettings.showTopBuyers && (
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">{homeSettings.topBuyersTitle}</h2>
              <p className="text-gray-600 mt-2">
                {homeSettings.topBuyersSubtitle}
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
      )}

      {/* CTA Section */}
      {homeSettings.showFinalCta && (
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {homeSettings.finalCtaTitle}
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            {homeSettings.finalCtaSubtitle}
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
      )}
    </div>
  );
}

function RequestSliderSection({
  title,
  subtitle,
  items,
  accent,
  showGrowthSignals = false,
}: {
  title: string;
  subtitle: string;
  items: HomeRequestCard[];
  accent: string;
  showGrowthSignals?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-6 w-1.5 rounded-full ${accent}`} />
            <h2 className="text-xl font-black text-gray-900">{title}</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        </div>
        <Link
          href="/requests"
          className="shrink-0 rounded-xl bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100"
        >
          مشاهده همه
        </Link>
      </div>
      <HorizontalScroller contentClassName="flex snap-x gap-3 overflow-x-auto scroll-smooth pb-2">
        {items.map((request) => (
          <SliderRequestCard
            key={`${title}-${request.id}`}
            request={request}
            showGrowthSignals={showGrowthSignals}
          />
        ))}
      </HorizontalScroller>
    </div>
  );
}

function SliderRequestCard({
  request,
  showGrowthSignals = false,
}: {
  request: HomeRequestCard;
  showGrowthSignals?: boolean;
}) {
  const badges = requestSpecBadges(request).slice(0, 2);
  const signal = request.growthSignal;
  return (
    <article className="w-44 shrink-0 snap-start rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/requests/${request.id}`} className="block">
        <ProductHeroImage
          images={request.productImages}
          title={request.title}
          category={request.category}
          className="mx-auto h-24 w-24 rounded-xl"
        />
      </Link>
      <Link href={`/requests/${request.id}`}>
        <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-extrabold leading-5 text-gray-900">
          {request.title}
        </h3>
      </Link>
      <div className="mt-2 flex flex-wrap gap-1">
        {badges.map((badge) => (
          <span
            key={badge}
            className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-500"
          >
            {badge}
          </span>
        ))}
      </div>
      {showGrowthSignals && signal ? (
        <div className="mt-2 rounded-xl bg-blue-50 p-2 text-[10px] leading-5 text-[#003b5c]">
          <div className="flex items-center justify-between gap-2 font-black">
            <span>امتیاز سیگنال</span>
            <span>{signal.score.toLocaleString("fa-IR")} / اعتماد {signal.confidence.toLocaleString("fa-IR")}٪</span>
          </div>
          <p className="mt-1 line-clamp-2 text-gray-600">
            {signal.criteria.slice(0, 3).join(" · ")}
          </p>
        </div>
      ) : null}
      <div className="mt-3 border-t border-gray-100 pt-2">
        <p className="text-sm font-black text-[#0b9c56]">{request.budget}</p>
        <p className="mt-1 text-[11px] text-gray-400">
          {request.offers.toLocaleString("fa-IR")} پیشنهاد · تعداد {request.quantity.toLocaleString("fa-IR")}
        </p>
      </div>
    </article>
  );
}
