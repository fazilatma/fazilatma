import type { Metadata } from "next";
import Link from "next/link";
import { laptopGuideItems } from "@/lib/laptop-storefront";
import { buildSeoMetadata, itemListJsonLd, jsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildSeoMetadata({
  title: "راهنمای خرید لپ‌تاپ اداری، دانشجویی، مهندسی و گیمینگ | OptiBid",
  description:
    "راهنمای انتخاب و خرید لپ‌تاپ بر اساس کاربری: اداری، دانشجویی، مهندسی، طراحی، گیمینگ و تدوین همراه با پیشنهاد مدل‌های مناسب در OptiBid.",
  path: "/shop/guides",
  type: "article",
});

export default function LaptopGuidesPage() {
  const guidesStructuredData = itemListJsonLd({
    name: "راهنماهای خرید لپ‌تاپ OptiBid",
    description: "راهنمای انتخاب لپ‌تاپ بر اساس کاربری و بودجه.",
    url: "/shop/guides",
    items: laptopGuideItems.map((guide) => ({
      name: guide.title,
      url: guide.href,
    })),
  });

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f8fa] pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(guidesStructuredData) }}
      />
      <section className="bg-white py-12 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
            راهنمای خرید لپ‌تاپ
          </span>
          <h1 className="mt-4 text-3xl font-black text-slate-900 md:text-4xl">
            قبل از خرید، نوع نیازت را انتخاب کن
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            هر راهنما یک صفحه اختصاصی دارد و مدل‌های مناسب همان کاربرد را نمایش می‌دهد.
          </p>
        </div>
      </section>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {laptopGuideItems.map((guide) => (
            <Link
              key={guide.slug}
              href={guide.href}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-rose-200 hover:shadow-lg"
            >
              <h2 className="text-xl font-black text-slate-900">{guide.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{guide.text}</p>
              <span className="mt-5 inline-flex rounded-2xl bg-rose-50 px-4 py-2 text-sm font-black text-rose-600">
                مشاهده صفحه راهنما
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
