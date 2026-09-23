"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { productImageUrl, type ProductImageAttachment } from "@/lib/product-image-shared";

type StoreHeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  isActive: boolean;
  image?: ProductImageAttachment;
};

const fallbackSlides: StoreHeroSlide[] = [
  {
    id: "store-main",
    title: "خرید آنلاین لپ‌تاپ نو و کارکرده با مقایسه کامل مشخصات",
    subtitle:
      "مدل‌های منتخب لپ‌تاپ اداری، دانشجویی، مهندسی و گیمینگ را با قیمت، گارانتی تست، مشخصات فنی و شرایط ارسال مقایسه کنید.",
    cta: "مشاهده همه لپ‌تاپ‌ها",
    href: "/shop#hero",
    isActive: true,
  },
  {
    id: "business-laptops",
    title: "لپ‌تاپ‌های اداری و شرکتی آماده کار",
    subtitle: "ThinkPad، Latitude و EliteBook برای حسابداری، برنامه‌نویسی، جلسات و کار روزانه.",
    cta: "مشاهده مدل‌های اداری",
    href: "/shop?use=business",
    isActive: true,
  },
  {
    id: "gaming-laptops",
    title: "لپ‌تاپ گیمینگ و مهندسی با گرافیک مجزا",
    subtitle: "مدل‌های RTX برای بازی، طراحی، تدوین، رندر و نرم‌افزارهای سنگین.",
    cta: "مشاهده گیمینگ‌ها",
    href: "/shop?use=gaming",
    isActive: true,
  },
  {
    id: "student-laptops",
    title: "انتخاب اقتصادی برای دانشجو و استفاده روزمره",
    subtitle: "لپ‌تاپ سبک، باتری مناسب، SSD پرسرعت و قیمت منطقی برای خرید مطمئن‌تر.",
    cta: "خرید دانشجویی",
    href: "/shop?use=student",
    isActive: true,
  },
];

export default function StoreHeroSlider({
  slides,
  durationSeconds = 5,
}: {
  slides?: StoreHeroSlide[];
  durationSeconds?: number;
}) {
  const activeSlides = useMemo(() => {
    const normalized = (slides || [])
      .filter((slide) => slide.isActive !== false)
      .slice(0, 4);
    return normalized.length > 0 ? normalized : fallbackSlides;
  }, [slides]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % activeSlides.length),
      Math.max(3, durationSeconds) * 1000,
    );
    return () => window.clearInterval(timer);
  }, [activeSlides.length, durationSeconds]);

  useEffect(() => {
    setIndex(0);
  }, [activeSlides.length]);

  const slide = activeSlides[index] || activeSlides[0];
  const imageUrl = slide.image ? productImageUrl(slide.image) : "";

  const next = () => setIndex((current) => (current + 1) % activeSlides.length);
  const previous = () =>
    setIndex((current) =>
      current === 0 ? activeSlides.length - 1 : current - 1,
    );

  return (
    <div className="relative min-h-[185px] overflow-hidden rounded-[2rem] bg-gradient-to-l from-[#003b5c] via-[#006494] to-[#00a8e8] p-4 text-white shadow-xl md:min-h-[220px] md:p-5 xl:min-h-[235px]">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={slide.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-l from-[#003b5c]/95 via-[#006494]/80 to-[#00a8e8]/75" />
      <div className="absolute -left-16 bottom-8 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />

      {!imageUrl && (
        <div className="absolute bottom-5 left-10 hidden w-48 opacity-30 lg:block">
          <div className="mx-auto h-20 rounded-t-3xl border-[9px] border-white/70 bg-white/10" />
          <div className="mx-auto h-3 rounded-b-3xl bg-white/70" />
        </div>
      )}

      <div className="relative z-10 flex min-h-[145px] flex-col justify-center md:min-h-[170px] xl:min-h-[185px]">
        <span className="mb-2 inline-flex w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-black ring-1 ring-white/20">
          فروشگاه تخصصی لپ‌تاپ و کامپیوتر
        </span>
        <h1 className="max-w-7xl text-2xl font-black leading-[1.35] md:text-3xl xl:text-4xl">
          {slide.title}
        </h1>
        <p className="mt-2 max-w-6xl text-xs leading-6 text-blue-50 md:text-sm">
          {slide.subtitle}
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Link
            href={slide.href || "/shop"}
            className="rounded-2xl bg-white px-5 py-2.5 text-center text-xs font-black text-[#003b5c] shadow-lg transition hover:bg-blue-50 md:text-sm"
          >
            {slide.cta || "مشاهده لپ‌تاپ‌ها"}
          </Link>
          <Link
            href="/cart"
            className="rounded-2xl border border-white/30 px-5 py-2.5 text-center text-xs font-black text-white transition hover:bg-white/10 md:text-sm"
          >
            سبد خرید من
          </Link>
        </div>
      </div>

      {activeSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={previous}
            className="absolute right-4 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl font-black text-[#003b5c] shadow-lg transition hover:bg-white"
            aria-label="اسلاید قبلی"
          >
            ›
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute left-4 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl font-black text-[#003b5c] shadow-lg transition hover:bg-white"
            aria-label="اسلاید بعدی"
          >
            ‹
          </button>
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {activeSlides.map((item, slideIndex) => (
              <button
                key={item.id || slideIndex}
                type="button"
                onClick={() => setIndex(slideIndex)}
                className={`h-2.5 rounded-full transition ${slideIndex === index ? "w-8 bg-white" : "w-2.5 bg-white/45"}`}
                aria-label={`اسلاید ${slideIndex + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
