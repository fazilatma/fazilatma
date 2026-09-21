import type { Metadata } from "next";
import Link from "next/link";
import { getJsonSupportContent } from "@/lib/json-store";
import { absoluteUrl, buildSeoMetadata, jsonLd, siteName } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildSeoMetadata({
  title: "پشتیبانی OptiBid | تماس، پیگیری سفارش و راهنمای خرید لپ‌تاپ",
  description:
    "صفحه پشتیبانی OptiBid برای تماس، پیگیری سفارش، راهنمای خرید لپ‌تاپ، پرداخت، ارسال و چت آنلاین.",
  path: "/support",
});

export default async function SupportPage() {
  const support = await getJsonSupportContent();
  const contactCards = [
    { title: "تلفن پشتیبانی", value: support.phone, href: `tel:${support.phone.replace(/\s+/g, "")}`, icon: "☎️" },
    { title: "موبایل و واتساپ", value: support.mobile, href: support.whatsapp || `tel:${support.mobile.replace(/\s+/g, "")}`, icon: "💬" },
    { title: "ایمیل پشتیبانی", value: support.email, href: `mailto:${support.email}`, icon: "✉️" },
    { title: "ساعات پاسخ‌گویی", value: support.workingHours, href: "", icon: "⏱️" },
  ];
  const supportStructuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: support.title,
    description: support.subtitle,
    url: absoluteUrl("/support"),
    inLanguage: "fa-IR",
    mainEntity: {
      "@type": "Organization",
      name: siteName,
      url: absoluteUrl("/"),
      telephone: support.phone || support.mobile,
      email: support.email,
      address: support.address,
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          telephone: support.phone || support.mobile,
          email: support.email,
          areaServed: "IR",
          availableLanguage: ["fa-IR"],
          hoursAvailable: support.workingHours,
        },
      ],
    },
  };
  const faqStructuredData = support.faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: support.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }
    : null;

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f8fa] pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(supportStructuredData) }}
      />
      {faqStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(faqStructuredData) }}
        />
      )}
      <section className="bg-gradient-to-l from-[#003b5c] via-[#006494] to-[#00a8e8] px-4 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-black ring-1 ring-white/20">
            مرکز پشتیبانی OptiBid
          </span>
          <h1 className="mt-5 max-w-3xl text-3xl font-black leading-[1.7] md:text-5xl">
            {support.title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-blue-50 md:text-lg">
            {support.subtitle}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="rounded-2xl bg-white px-7 py-4 text-center text-sm font-black text-[#003b5c] shadow-lg"
            >
              برگشت به فروشگاه لپ‌تاپ
            </Link>
            <Link
              href="/cart"
              className="rounded-2xl border border-white/30 px-7 py-4 text-center text-sm font-black text-white"
            >
              پیگیری سبد خرید و سفارش
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {contactCards.map((card) => {
            const body = (
              <div className="h-full rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
                <div className="text-3xl">{card.icon}</div>
                <h2 className="mt-4 font-black text-slate-900">{card.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{card.value || "—"}</p>
              </div>
            );
            return card.href ? (
              <a key={card.title} href={card.href} className="block">
                {body}
              </a>
            ) : (
              <div key={card.title}>{body}</div>
            );
          })}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">آدرس و مسیرهای ارتباطی</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <p className="rounded-2xl bg-slate-50 p-4">
                <b className="text-slate-900">آدرس:</b> {support.address}
              </p>
              {support.telegram && (
                <a
                  href={support.telegram}
                  className="block rounded-2xl bg-blue-50 p-4 font-black text-blue-700"
                >
                  ارتباط از تلگرام پشتیبانی
                </a>
              )}
              {support.whatsapp && (
                <a
                  href={support.whatsapp}
                  className="block rounded-2xl bg-emerald-50 p-4 font-black text-emerald-700"
                >
                  ارتباط از واتساپ پشتیبانی
                </a>
              )}
            </div>
          </aside>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <h2 className="text-xl font-black text-slate-900">سوالات پرتکرار پشتیبانی</h2>
                <p className="mt-2 text-sm text-slate-500">
                  این متن‌ها از پنل ادمین قابل تغییر هستند.
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                پاسخ سریع
              </span>
            </div>
            <div className="space-y-3">
              {support.faqs.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                  هنوز سوالی ثبت نشده است.
                </p>
              ) : (
                support.faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <summary className="cursor-pointer list-none font-black text-slate-900 [&::-webkit-details-marker]:hidden">
                      {faq.question}
                    </summary>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
                  </details>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-blue-100 bg-blue-50 p-6 text-blue-900">
          <h2 className="text-xl font-black">چت آنلاین پشتیبانی</h2>
          <p className="mt-2 text-sm leading-7">
            از دکمه «پشتیبانی آنلاین» پایین صفحه استفاده کنید. پیام شما با کد پیگیری ثبت می‌شود و تیم پشتیبانی از همان مسیر یا اطلاعات تماس درج‌شده پاسخ می‌دهد.
          </p>
        </section>
      </main>
    </div>
  );
}
