import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StoreProductCard from "@/components/StoreProductCard";
import { getJsonStoreProducts } from "@/lib/json-store";
import { getLaptopGuide, laptopGuideItems } from "@/lib/laptop-storefront";
import { articleJsonLd, breadcrumbJsonLd, buildSeoMetadata, itemListJsonLd, jsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

const money = (value: number | string) =>
  `${Number(value || 0).toLocaleString("fa-IR")} تومان`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getLaptopGuide(slug);
  if (!guide) return { title: "راهنمای خرید لپ‌تاپ | OptiBid" };
  return buildSeoMetadata({
    title: `${guide.title} | راهنمای خرید لپ‌تاپ`,
    description: `${guide.text} پیشنهادهای مناسب ${guide.shortTitle}، چک‌لیست انتخاب، قیمت شروع و مدل‌های مرتبط را در فروشگاه OptiBid ببینید.`,
    path: guide.href,
    type: "article",
    keywords: [guide.title, guide.shortTitle, "راهنمای خرید لپ‌تاپ", "خرید لپ‌تاپ"],
  });
}

export default async function LaptopGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getLaptopGuide(slug);
  if (!guide) notFound();

  const products = await getJsonStoreProducts();
  const relatedProducts = products
    .filter((product) => {
      const text = `${product.title} ${product.category} ${product.summary} ${product.description} ${product.badges.join(" ")} ${Object.values(product.specs || {}).join(" ")}`.toLowerCase();
      return guide.keywords.some((keyword) => text.includes(keyword.toLowerCase()));
    })
    .slice(0, 6);
  const minPrice = relatedProducts.reduce(
    (min, product) => Math.min(min, product.price),
    relatedProducts[0]?.price || 0,
  );
  const guideArticleStructuredData = articleJsonLd({
    title: guide.title,
    description: `${guide.text} ${guide.checklist.join("، ")}`,
    url: guide.href,
  });
  const relatedProductsStructuredData = itemListJsonLd({
    name: `پیشنهادهای مناسب ${guide.shortTitle}`,
    description: guide.text,
    url: guide.href,
    items: relatedProducts.map((product) => ({
      name: product.title,
      url: `/shop/${product.slug}`,
    })),
  });
  const breadcrumbStructuredData = breadcrumbJsonLd([
    { name: "خانه", url: "/" },
    { name: "فروشگاه لپ‌تاپ", url: "/shop" },
    { name: "راهنمای خرید", url: "/shop/guides" },
    { name: guide.title, url: guide.href },
  ]);

  const theme = {
    blue: {
      gradient: "from-blue-600 to-[#003b5c]",
      lightText: "text-blue-50",
      card: "bg-blue-50 text-blue-800 border-blue-100",
    },
    emerald: {
      gradient: "from-emerald-600 to-[#003b5c]",
      lightText: "text-emerald-50",
      card: "bg-emerald-50 text-emerald-800 border-emerald-100",
    },
    amber: {
      gradient: "from-amber-500 to-[#003b5c]",
      lightText: "text-amber-50",
      card: "bg-amber-50 text-amber-800 border-amber-100",
    },
    rose: {
      gradient: "from-rose-600 to-[#003b5c]",
      lightText: "text-rose-50",
      card: "bg-rose-50 text-rose-800 border-rose-100",
    },
  }[guide.accent];
  const gradientClass = theme.gradient;
  const lightTextClass = theme.lightText;
  const cardClass = theme.card;

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f8fa] pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(guideArticleStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(relatedProductsStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbStructuredData) }}
      />
      <section className={`bg-gradient-to-l ${gradientClass} px-4 py-14 text-white`}>
        <div className="mx-auto max-w-7xl">
          <nav className="mb-6 text-sm text-white/80">
            <Link href="/" className="hover:text-white">خانه</Link>
            <span className="mx-2">/</span>
            <Link href="/shop" className="hover:text-white">فروشگاه لپ‌تاپ</Link>
            <span className="mx-2">/</span>
            <span>{guide.title}</span>
          </nav>
          <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-black ring-1 ring-white/20">
            راهنمای خرید لپ‌تاپ
          </span>
          <h1 className="mt-5 max-w-3xl text-3xl font-black leading-[1.7] md:text-5xl">
            {guide.title}
          </h1>
          <p className={`mt-4 max-w-3xl text-base leading-8 ${lightTextClass}`}>
            {guide.text} این صفحه به شما کمک می‌کند مدل مناسب را سریع‌تر انتخاب کنید.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link
              href={`/shop?use=${guide.slug}`}
              className="rounded-2xl bg-white px-6 py-3 font-black text-[#003b5c] shadow-lg"
            >
              مشاهده مدل‌های مناسب
            </Link>
            <Link
              href="/cart"
              className="rounded-2xl border border-white/30 px-6 py-3 font-black text-white"
            >
              سبد خرید من
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">چک‌لیست انتخاب</h2>
            <div className="mt-5 space-y-3">
              {guide.checklist.map((item) => (
                <div
                  key={item}
                  className={`rounded-2xl border p-4 text-sm font-bold leading-7 ${cardClass}`}
                >
                  ✓ {item}
                </div>
              ))}
            </div>
            {minPrice > 0 && (
              <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                شروع قیمت مدل‌های مناسب این راهنما از <b>{money(minPrice)}</b> است.
              </p>
            )}
          </aside>

          <section>
            <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  پیشنهادهای مناسب {guide.shortTitle}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  این مدل‌ها بر اساس مشخصات فنی، کاربری و قیمت برای این نیاز مناسب‌تر هستند.
                </p>
              </div>
              <Link href="/shop" className="text-sm font-black text-rose-600">
                بازگشت به همه مدل‌ها ←
              </Link>
            </div>
            {relatedProducts.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                فعلاً مدلی برای این راهنما ثبت نشده است.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {relatedProducts.map((product) => (
                  <StoreProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">راهنماهای دیگر</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {laptopGuideItems
              .filter((item) => item.slug !== guide.slug)
              .map((item) => (
                <Link
                  key={item.slug}
                  href={item.href}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                >
                  {item.title}
                </Link>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}
