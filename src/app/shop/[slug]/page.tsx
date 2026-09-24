import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StoreAddToCartButton from "@/components/StoreAddToCartButton";
import StoreProductCard, { LaptopVisual } from "@/components/StoreProductCard";
import {
  getJsonStoreProductBySlug,
  getJsonStoreProducts,
  type JsonStoreProduct,
} from "@/lib/json-store";
import { laptopCategoryItems } from "@/lib/laptop-storefront";
import {
  breadcrumbJsonLd,
  buildSeoMetadata,
  jsonLd,
  productJsonLd,
  storeSeoKeywords,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

const money = (value: number | string) =>
  `${Number(value || 0).toLocaleString("fa-IR")} تومان`;

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
  const product = await getJsonStoreProductBySlug(slug);
  if (!product) return { title: "محصول پیدا نشد | OptiBid" };
  return buildSeoMetadata({
    title: `${product.title} | خرید لپ‌تاپ`,
    description: `${product.summary} قیمت ${money(product.price)}، مشخصات فنی کامل، وضعیت موجودی، مهلت تست و پیشنهادهای مشابه در فروشگاه OptiBid.`,
    path: `/shop/${product.slug}`,
    keywords: [
      product.title,
      product.brand,
      product.category,
      ...product.badges,
      ...Object.values(product.specs || {}).slice(0, 4),
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
  const product = await getJsonStoreProductBySlug(slug);
  if (!product) notFound();
  const allProducts = await getJsonStoreProducts();
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
  const breadcrumbStructuredData = breadcrumbJsonLd([
    { name: "خانه", url: "/" },
    { name: "فروشگاه لپ‌تاپ", url: "/shop" },
    { name: product.title, url: `/shop/${product.slug}` },
  ]);

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f8fa] pb-16">
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

        <ProductCategoryStrip />

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div dir="ltr" className="grid gap-8 p-6 lg:grid-cols-[390px_minmax(0,1fr)] lg:p-8">
            <aside dir="rtl" className="order-2 space-y-4 lg:order-1">
              <LaptopVisual product={product} />
              <ProductQuickSpecs product={product} />
              <PriceTrendCard product={product} />
            </aside>

            <div dir="rtl" className="order-1 lg:order-2">
              <div className="mb-3 flex flex-wrap gap-2">
                {product.badges.map((badge) => (
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
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-700">
                  موجود در انبار فروشگاه
                </span>
              </div>

              <div className="mt-7 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                {product.originalPrice && product.originalPrice > product.price && (
                  <p className="text-sm text-slate-400 line-through">{money(product.originalPrice)}</p>
                )}
                <p className="text-3xl font-black text-rose-600">{money(product.price)}</p>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  {product.warranty} · {product.shippingNote}
                </p>
                {product.marketReferenceNote && (
                  <p className="mt-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold leading-6 text-emerald-700">
                    قیمت بر اساس بررسی بازار به‌روزرسانی شده است: {product.marketReferenceNote}
                  </p>
                )}
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
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">مشخصات فنی</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="rounded-2xl bg-slate-50 p-4 text-sm">
                  <span className="text-slate-500">{key}</span>
                  <b className="mt-1 block text-slate-900">{value}</b>
                </div>
              ))}
            </div>
            <h2 className="mt-8 text-xl font-black text-slate-900">توضیحات کالا</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-8 text-slate-600">
              {product.description}
            </p>
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
function ProductCategoryStrip() {
  return (
    <section className="mb-6 rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3 px-2">
        <div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
            دسته‌بندی کالاها
          </span>
          <h2 className="mt-2 text-lg font-black text-slate-900">
            مسیر سریع خرید مثل ترب
          </h2>
        </div>
        <Link href="/shop" className="text-xs font-black text-rose-600">
          همه محصولات ←
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {laptopCategoryItems.slice(0, 14).map((item) => (
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
  const specs = Object.entries(product.specs || {}).slice(0, 6);
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

function priceTrendValues(product: JsonStoreProduct) {
  const current = Number(product.price || 0);
  const original = Number(product.originalPrice || 0) || Math.round(current * 1.08);
  return [
    Math.round(original * 1.02),
    original,
    Math.round((original + current) / 2),
    Math.round(current * 1.03),
    current,
  ];
}

function PriceTrendCard({ product }: { product: JsonStoreProduct }) {
  const values = priceTrendValues(product);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const points = values
    .map((value, index) => {
      const x = 18 + index * 71;
      const y = 102 - ((value - min) / range) * 72;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-black text-slate-900">منحنی قیمت</h2>
        <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-black text-rose-600">
          ۳۰ روز اخیر
        </span>
      </div>
      <svg viewBox="0 0 320 120" className="h-36 w-full" role="img" aria-label="منحنی قیمت کالا">
        <defs>
          <linearGradient id="priceLine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#00a8e8" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>
        <path d="M18 104H304" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        <path d="M18 68H304" stroke="#eef2f7" strokeWidth="2" strokeLinecap="round" />
        <path d="M18 32H304" stroke="#eef2f7" strokeWidth="2" strokeLinecap="round" />
        <polyline points={points} fill="none" stroke="url(#priceLine)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((value, index) => {
          const x = 18 + index * 71;
          const y = 102 - ((value - min) / range) * 72;
          return <circle key={index} cx={x} cy={y} r="5" fill="#003b5c" />;
        })}
      </svg>
      <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
        <div className="rounded-2xl bg-slate-50 p-3">
          کمترین: <b className="text-emerald-700">{money(min)}</b>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          فعلی: <b className="text-rose-600">{money(product.price)}</b>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-slate-400">
        این نمودار بر اساس قیمت فعلی و قیمت قبلی ثبت‌شده در فروشگاه نمایش داده شده و برای مقایسه سریع روند قیمت است.
      </p>
    </div>
  );
}

