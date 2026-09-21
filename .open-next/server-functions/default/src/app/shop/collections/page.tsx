import type { Metadata } from "next";
import Link from "next/link";
import { laptopCollectionItems } from "@/lib/laptop-storefront";
import { buildSeoMetadata, itemListJsonLd, jsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildSeoMetadata({
  title: "محصولات پرفروش، در حال رشد و فروش ویژه لپ‌تاپ | OptiBid",
  description:
    "صفحه بخش‌های ویژه فروشگاه لپ‌تاپ OptiBid شامل محصولات در حال رشد، لپ‌تاپ‌های پرفروش و فروش ویژه با قیمت جذاب.",
  path: "/shop/collections",
});

export default function LaptopCollectionsPage() {
  const collectionsStructuredData = itemListJsonLd({
    name: "بخش‌های ویژه فروشگاه لپ‌تاپ OptiBid",
    description: "محصولات در حال رشد، محصولات پرفروش و فروش ویژه لپ‌تاپ.",
    url: "/shop/collections",
    items: laptopCollectionItems.map((collection) => ({
      name: collection.title,
      url: collection.href,
    })),
  });

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f8fa] pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(collectionsStructuredData) }}
      />
      <section className="bg-white py-12 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">
            ویترین‌های فروشگاه لپ‌تاپ
          </span>
          <h1 className="mt-4 text-3xl font-black text-slate-900 md:text-4xl">
            محصولات در حال رشد، پرفروش و فروش ویژه
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            هر بخش یک صفحه اختصاصی دارد تا خریدار سریع‌تر مدل مناسب را پیدا کند.
          </p>
        </div>
      </section>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {laptopCollectionItems.map((collection) => (
            <Link
              key={collection.slug}
              href={collection.href}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-rose-200 hover:shadow-lg"
            >
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">
                {collection.badge}
              </span>
              <h2 className="mt-4 text-xl font-black text-slate-900">
                {collection.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {collection.subtitle}
              </p>
              <span className="mt-5 inline-flex text-sm font-black text-rose-600">
                مشاهده محصولات ←
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
