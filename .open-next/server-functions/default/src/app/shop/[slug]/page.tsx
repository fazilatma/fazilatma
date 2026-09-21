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

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-8 p-6 lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
            <LaptopVisual product={product} />
            <div>
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
