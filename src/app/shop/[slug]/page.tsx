import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import StoreAddToCartButton from "@/components/StoreAddToCartButton";
import StoreProductCard, { LaptopVisual } from "@/components/StoreProductCard";
import StorePriceHistoryChart from "@/components/StorePriceHistoryChart";
import StoreVerifiedPriceSync from "@/components/StoreVerifiedPriceSync";
import {
  getOptiBidData,
  type JsonStoreProduct,
} from "@/lib/json-store";
import { laptopCategoryItems } from "@/lib/laptop-storefront";
import { isStorefrontEligibleComputerPart } from "@/lib/store-computer-part-kind";
import { isComputerPartsCatalogProduct } from "@/lib/store-catalog-sections";
import { publicStoreProductBadges, publicStoreProductSpecs } from "@/lib/store-product-public";
import {
  applyStorePriceOverrides,
  getStorePriceOverridesByIds,
  saveStorePriceOverride,
} from "@/lib/store-price-overrides";
import {
  applyLiveStoreProductSnapshot,
  getLiveStoreProductPriceSnapshot,
} from "@/lib/store-product-live";
import {
  breadcrumbJsonLd,
  buildSeoMetadata,
  jsonLd,
  productJsonLd,
  storeSeoKeywords,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

// generateMetadata و خود صفحه در یک درخواست، دیتاست بزرگ KV را فقط یک‌بار می‌خوانند.
const getStorePageData = cache(getOptiBidData);

const money = (value: number | string) =>
  `${Number(value || 0).toLocaleString("fa-IR")} تومان`;

function normalizedProductTitle(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[^a-z0-9آ-ی]+/g, "")
    .trim();
}

const computerPartCategoryItems = [
  { title: "پردازنده", badge: "CPU", href: "/shop?category=computer-parts&part=cpu" },
  { title: "کارت گرافیک", badge: "GPU", href: "/shop?category=computer-parts&part=gpu" },
  { title: "حافظه رم", badge: "RAM", href: "/shop?category=computer-parts&part=ram" },
  { title: "حافظه SSD و هارد", badge: "SSD", href: "/shop?category=computer-parts&part=ssd" },
  { title: "مادربرد", badge: "MB", href: "/shop?category=computer-parts&part=motherboard" },
  { title: "پاور", badge: "PSU", href: "/shop?category=computer-parts&part=power" },
  { title: "کیس", badge: "CASE", href: "/shop?category=computer-parts&part=case" },
  { title: "خنک‌کننده", badge: "COOL", href: "/shop?category=computer-parts&part=cooler" },
];

function productSearchText(product: JsonStoreProduct) {
  return `${product.title} ${product.brand} ${product.category} ${product.summary} ${product.description} ${product.badges.join(" ")} ${Object.values(product.specs || {}).join(" ")}`.toLowerCase();
}

function relatedScore(product: JsonStoreProduct, candidate: JsonStoreProduct) {
  const productText = productSearchText(product);
  const candidateText = productSearchText(candidate);
  let score = 0;
  if (candidate.brand === product.brand) score += 90;
  if (candidate.category === product.category) score += 55;
  for (const badge of product.badges || []) {
    if (candidate.badges?.includes(badge)) score += 18;
  }
  for (const key of ["پردازنده", "رم", "حافظه", "گرافیک", "نمایشگر"]) {
    const value = product.specs?.[key];
    if (value && candidate.specs?.[key] === value) score += 14;
  }
  for (const keyword of [
    "اداری",
    "دانشجویی",
    "مهندسی",
    "گیمینگ",
    "استوک",
    "سبک",
    "rtx",
    "ssd",
    "core i7",
    "core i5",
  ]) {
    if (productText.includes(keyword) && candidateText.includes(keyword)) score += 10;
  }
  const priceGap = Math.abs(candidate.price - product.price);
  score += Math.max(0, 30 - priceGap / 2_000_000);
  score += Math.min(20, candidate.reviewsCount / 4);
  score += candidate.rating * 2;
  return score;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getStorePageData();
  const product = data.storeProducts.find((item) => item.slug === slug) || null;
  if (!product) return { title: "محصول پیدا نشد | OptiBid" };
  const computerPartProduct = isComputerPartsCatalogProduct(product);
  return buildSeoMetadata({
    title: `${product.title} | ${computerPartProduct ? "خرید قطعات کامپیوتر" : "خرید لپ‌تاپ"}`,
    description: `${product.summary} قیمت ${money(product.price)}، مشخصات فنی کامل، وضعیت موجودی، مهلت تست و پیشنهادهای مشابه در فروشگاه OptiBid.`,
    path: `/shop/${product.slug}`,
    keywords: [
      product.title,
      product.brand,
      product.category,
      ...publicStoreProductBadges(product.badges),
      ...publicStoreProductSpecs(product.specs || {}).map(([, value]) => value).slice(0, 4),
      ...storeSeoKeywords,
    ],
  });
}

export default async function StoreProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getStorePageData();
  const baseProduct = data.storeProducts.find((item) => item.slug === slug);
  if (!baseProduct || !isStorefrontEligibleComputerPart(baseProduct)) notFound();

  // صفحهٔ جزئیات باید کلید مستقل همین محصول را بخواند؛ نقشهٔ مشترک ممکن است در
  // اثر نوشتن هم‌زمان چند محصول موقتاً قدیمی باشد.
  const productPriceOverrides = await getStorePriceOverridesByIds([baseProduct.id]);
  const storedProduct = applyStorePriceOverrides([baseProduct], productPriceOverrides)[0];
  const titleKey = normalizedProductTitle(baseProduct.title);
  const duplicateSourceUrls = data.storeProducts
    .filter((item) =>
      item.id !== baseProduct.id &&
      normalizedProductTitle(item.title) === titleKey &&
      Boolean(item.externalSourceUrl),
    )
    .map((item) => String(item.externalSourceUrl))
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 3);
  const verifiedAt = Date.parse(String(storedProduct.priceVerifiedAt || ""));
  const recentlyVerified =
    Number.isFinite(verifiedAt) &&
    Date.now() - verifiedAt >= 0 &&
    Date.now() - verifiedAt <= 60 * 1000;
  // یک کش توزیع‌شدهٔ کوتاه مانع فراخوانی هم‌زمان APIهای بازار می‌شود، اما تغییر
  // واقعی قیمت حداکثر یک دقیقه بعد دوباره مقایسه خواهد شد.
  const liveSnapshot = recentlyVerified
    ? null
    : await getLiveStoreProductPriceSnapshot(
        storedProduct,
        data.settings.storePriceMultiplier,
        duplicateSourceUrls,
      );
  // خطای موقت یا timeout یکی از منابع نباید قیمت تأییدشدهٔ قبلی را ناموجود کند.
  // وضعیت ناموجود فقط از override صریح قبلی حفظ می‌شود و قیمت زنده آن را دوباره فعال می‌کند.
  const currentPriceAvailable = liveSnapshot?.price
    ? true
    : storedProduct.priceAvailable !== false;
  const product = {
    ...applyLiveStoreProductSnapshot(storedProduct, liveSnapshot),
    priceAvailable: currentPriceAvailable,
  };
  if (liveSnapshot?.price && liveSnapshot.marketPrice && liveSnapshot.priceMultiplier) {
    await saveStorePriceOverride(product.id, {
      price: liveSnapshot.price,
      marketPrice: liveSnapshot.marketPrice,
      priceMultiplier: liveSnapshot.priceMultiplier,
      updatedAt: liveSnapshot.checkedAt,
      available: true,
    }).catch(() => undefined);
  }
  // صفحهٔ عمومی دیگر کل دیتاست KV را بازنویسی نمی‌کند. قیمت تأییدشده در کلید
  // سبک و مستقل ذخیره می‌شود و کارت/سبد خرید همان کلید را مصرف می‌کنند.
  const verifiedPriceAt = liveSnapshot?.price
    ? liveSnapshot.checkedAt
    : storedProduct.priceVerifiedAt || "";
  const computerPartProduct = isComputerPartsCatalogProduct(product);
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("optibid_admin")?.value === "1";
  const allProducts = applyStorePriceOverrides(data.storeProducts, productPriceOverrides)
    .filter(isStorefrontEligibleComputerPart);
  const priceHistoryAsOf = new Date().toISOString();
  const completeSpecs = publicStoreProductSpecs(product.specs || {}).slice(0, 24);
  const liveComments = liveSnapshot?.comments || [];
  const related = allProducts
    .filter((item) => item.id !== product.id)
    .map((item) => ({ product: item, score: relatedScore(product, item) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.product)
    .slice(0, 8);
  const sameBrandCount = related.filter((item) => item.brand === product.brand).length;
  const sameCategoryCount = related.filter(
    (item) => item.category === product.category,
  ).length;
  const productStructuredData = productJsonLd(product);
  const reverseAuctionSettings = data.settings;
  const requestPriceHref = (() => {
    if (!reverseAuctionSettings.reverseAuctionQuickRequestEnabled) return "/request-purchase";
    const query = new URLSearchParams({
      title: `خرید ${product.title}`,
      category: "کالای دیجیتال",
      description: `درخواست دریافت پیشنهاد رقابتی برای ${product.title}؛ مدل و مشخصات مطابق همین صفحه باشد.`,
      budget: String(product.price),
      sourceProductId: product.id,
      sourceProductSlug: product.slug,
    });
    return `/request-purchase?${query.toString()}`;
  })();
  const breadcrumbStructuredData = breadcrumbJsonLd([
    { name: "خانه", url: "/" },
    {
      name: computerPartProduct ? "فروشگاه قطعات کامپیوتر" : "فروشگاه لپ‌تاپ",
      url: computerPartProduct ? "/shop?category=computer-parts" : "/shop",
    },
    { name: product.title, url: `/shop/${product.slug}` },
  ]);

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f8fa] pb-16">
      {verifiedPriceAt ? (
        <StoreVerifiedPriceSync
          productId={product.id}
          price={product.price}
          verifiedAt={verifiedPriceAt}
          available={product.priceAvailable !== false}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(productStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbStructuredData) }}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-rose-600">خانه</Link>
          <span className="mx-2">/</span>
          <Link href="/shop" className="hover:text-rose-600">فروشگاه</Link>
          <span className="mx-2">/</span>
          <span>{product.title}</span>
        </nav>

        <ProductCategoryStrip computerPartsMode={computerPartProduct} />

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div dir="ltr" className="grid gap-8 p-6 lg:grid-cols-[390px_minmax(0,1fr)] lg:p-8">
            <aside dir="rtl" className="order-2 space-y-4 lg:order-1">
              <LaptopVisual product={product} />
              <ProductQuickSpecs product={product} />
              <StorePriceHistoryChart history={product.priceHistory} asOf={priceHistoryAsOf} productId={product.id} isAdmin={isAdmin} />
            </aside>

            <div dir="rtl" className="order-1 lg:order-2">
              <div className="mb-3 flex flex-wrap gap-2">
                {publicStoreProductBadges(product.badges).map((badge) => (
                  <span key={badge} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                    {badge}
                  </span>
                ))}
              </div>
              <h1 className="text-2xl font-black leading-10 text-slate-900 md:text-3xl">
                {product.title}
              </h1>
              <p className="mt-3 text-sm leading-8 text-slate-600">{product.summary}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-700">
                  ★ {product.rating.toLocaleString("fa-IR")} از ۵
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">
                  {product.reviewsCount.toLocaleString("fa-IR")} دیدگاه کاربران
                </span>
                <span className={`rounded-full px-3 py-1 font-bold ${product.priceAvailable !== false ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {product.priceAvailable !== false ? "موجود در منابع بازار" : "فعلاً ناموجود در منابع بازار"}
                </span>
              </div>

              <div className="mt-7 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                {product.priceAvailable !== false ? (
                  <>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <p className="text-sm text-slate-400 line-through">{money(product.originalPrice)}</p>
                    )}
                    <p className="text-3xl font-black text-rose-600">{money(product.price)}</p>
                    <p className="mt-2 text-xs leading-6 text-slate-500">
                      {product.warranty} · قیمت روز از منابع فعال تأیید شد
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <StoreAddToCartButton
                        product={{
                          id: product.id,
                          title: product.title,
                          slug: product.slug,
                          price: product.price,
                          originalPrice: product.originalPrice,
                          brand: product.brand,
                          warranty: product.warranty,
                        }}
                      />
                      <Link href="/cart" className="rounded-2xl border border-rose-200 bg-white px-5 py-3 text-center text-sm font-black text-rose-600 transition hover:bg-rose-50">
                        مشاهده سبد خرید
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-black text-slate-700">قیمت فعال موجود نیست</p>
                    <p className="mt-2 text-sm leading-7 text-slate-500">
                      در آخرین بررسی، برای این مدل دقیق قیمت فعال و قابل خرید پیدا نشد؛ قیمت قدیمی نمایش داده نمی‌شود و خرید مستقیم موقتاً غیرفعال است.
                    </p>
                    <Link
                      href={requestPriceHref}
                      className="mt-5 block rounded-2xl bg-emerald-600 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-emerald-700"
                    >
                      درخواست قیمت از فروشندگان
                    </Link>
                  </>
                )}
              </div>

              {reverseAuctionSettings.reverseAuctionProductCtaEnabled && (
                <div className="mt-4 rounded-[1.5rem] border border-emerald-200 bg-gradient-to-l from-emerald-50 to-white p-5">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-800">
                    خرید رقابتی
                  </span>
                  <h2 className="mt-3 text-lg font-black text-slate-900">
                    از چند فروشنده برای همین کالا قیمت بگیرید
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    درخواست شما با مدل و بودجه همین محصول ثبت می‌شود و فروشندگان مرتبط می‌توانند قیمت، زمان تحویل و شرایط خود را پیشنهاد دهند.
                  </p>
                  {reverseAuctionSettings.reverseAuctionMinimumOffersEnabled && (
                    <p className="mt-2 text-xs font-bold text-emerald-800">
                      هدف: دریافت حداقل {reverseAuctionSettings.reverseAuctionMinimumOffersCount.toLocaleString("fa-IR")} پیشنهاد برای هر درخواست معتبر
                    </p>
                  )}
                  <Link
                    href={requestPriceHref}
                    className="mt-4 block rounded-2xl bg-emerald-600 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-emerald-700"
                  >
                    دریافت پیشنهاد رقابتی فروشندگان
                  </Link>
                </div>
              )}

              <div className="mt-6 rounded-[1.5rem] border border-blue-100 bg-blue-50/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-black text-slate-900">مشخصات کامل کالا</h2>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-blue-700 shadow-sm">
                    {completeSpecs.length.toLocaleString("fa-IR")} مشخصه
                  </span>
                </div>
                {completeSpecs.length ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {completeSpecs.map(([key, value]) => (
                      <div key={key} className="rounded-2xl border border-white bg-white/90 p-3 text-xs shadow-sm">
                        <span className="block text-slate-500">{key}</span>
                        <b className="mt-1 block leading-6 text-slate-900" dir="auto">{value}</b>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl bg-white p-4 text-sm leading-7 text-slate-500">
                    مشخصات تکمیلی این کالا هنوز از مرجع قابل دریافت نیست.
                  </p>
                )}
                {product.description && product.description !== product.title ? (
                  <details className="mt-4 rounded-2xl bg-white p-4">
                    <summary className="cursor-pointer text-sm font-black text-blue-800">توضیحات و بررسی کامل کالا</summary>
                    <p className="mt-3 whitespace-pre-line text-sm leading-8 text-slate-600">{product.description}</p>
                  </details>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900">نظرات کاربران</h2>
                <p className="mt-1 text-xs text-slate-500">تجربه خریداران و کاربران درباره این کالا</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
                  ★ {product.rating.toLocaleString("fa-IR")} از ۵
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                  {product.reviewsCount.toLocaleString("fa-IR")} نظر
                </span>
              </div>
            </div>
            {liveComments.length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {liveComments.map((comment) => (
                  <article key={comment.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <b className="text-sm text-slate-900">{comment.userName}</b>
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                          {comment.isBuyer ? <span className="font-bold text-emerald-700">خریدار محصول</span> : null}
                          {comment.createdAt ? <span>{comment.createdAt}</span> : null}
                        </div>
                      </div>
                      <span className="whitespace-nowrap rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-700">
                        {"★".repeat(Math.max(1, Math.round(comment.rate || 1)))}
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{comment.body}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm leading-7 text-slate-500">
                هنوز نظر قابل‌نمایشی برای این کالا دریافت نشده است.
              </div>
            )}
          </div>
          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-black text-slate-900">خدمات فروشگاه</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p className="rounded-2xl bg-emerald-50 p-3 text-emerald-800">✓ امکان ثبت سفارش آنلاین</p>
              <p className="rounded-2xl bg-blue-50 p-3 text-blue-800">✓ بررسی مشخصات و سلامت کالا</p>
              <p className="rounded-2xl bg-amber-50 p-3 text-amber-800">✓ پشتیبانی و هماهنگی ارسال</p>
            </div>
          </aside>
        </section>

        {related.length > 0 && (
          <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">
                  پیشنهادهای مشابه
                </span>
                <h2 className="mt-3 text-2xl font-black text-slate-900">
                  محصولات مشابه و جایگزین‌های پیشنهادی
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
                  مدل‌هایی نزدیک به {product.brand} و هم‌رده از نظر کاربری، قیمت، مشخصات فنی و محبوبیت کاربران.
                </p>
              </div>
              <Link href="/shop" className="text-sm font-black text-rose-600">
                مشاهده همه مدل‌ها ←
              </Link>
            </div>

            <div className="mb-5 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                {sameBrandCount.toLocaleString("fa-IR")} مدل از همین برند
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                {sameCategoryCount.toLocaleString("fa-IR")} مدل هم‌دسته
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                مرتب‌شده بر اساس شباهت و محبوبیت
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {related.map((item) => (
                <StoreProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
function ProductCategoryStrip({ computerPartsMode }: { computerPartsMode: boolean }) {
  const items = computerPartsMode
    ? computerPartCategoryItems
    : laptopCategoryItems.slice(0, 14);
  return (
    <section className="mb-6 rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3 px-2">
        <div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
            {computerPartsMode ? "دسته‌بندی قطعات" : "دسته‌بندی کالاها"}
          </span>
          <h2 className="mt-2 text-lg font-black text-slate-900">
            {computerPartsMode ? "مسیر سریع خرید قطعات کامپیوتر" : "مسیر سریع خرید لپ‌تاپ"}
          </h2>
        </div>
        <Link
          href={computerPartsMode ? "/shop?category=computer-parts" : "/shop"}
          className="text-xs font-black text-rose-600"
        >
          {computerPartsMode ? "همه قطعات ←" : "همه لپ‌تاپ‌ها ←"}
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {items.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="min-w-[118px] rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-center transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50"
          >
            {item.badge && (
              <span className="mb-1 inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-[#003b5c] shadow-sm">
                {item.badge}
              </span>
            )}
            <span className="block text-xs font-black text-slate-700">{item.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductQuickSpecs({ product }: { product: JsonStoreProduct }) {
  const specs = publicStoreProductSpecs(product.specs || {}).slice(0, 6);
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-black text-slate-900">مشخصات کالا</h2>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">
          {product.brand}
        </span>
      </div>
      <div className="grid gap-2">
        {specs.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs">
            <span className="text-slate-500">{key}</span>
            <b className="text-left text-slate-800" dir="ltr">{value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
