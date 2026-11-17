"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { productImageUrl, type ProductImageAttachment } from "@/lib/product-image-shared";

export type HomepageImageSliderSlide = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  isActive: boolean;
  image?: ProductImageAttachment;
};

function fallbackBackground(index: number) {
  const gradients = [
    "from-[#003b5c] via-[#005e94] to-[#00a8e8]",
    "from-orange-500 via-rose-500 to-pink-600",
    "from-emerald-600 via-teal-500 to-cyan-500",
    "from-violet-600 via-purple-600 to-fuchsia-600",
    "from-amber-500 via-orange-500 to-red-500",
  ];
  return gradients[index % gradients.length];
}

export default function HomepageImageSlider({
  title,
  subtitle,
  slides,
  durationSeconds = 5,
}: {
  title: string;
  subtitle: string;
  slides: HomepageImageSliderSlide[];
  durationSeconds?: number;
}) {
  const activeSlides = useMemo(
    () => slides.filter((slide) => slide.isActive !== false).slice(0, 5),
    [slides],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const interval = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % activeSlides.length),
      Math.max(3, durationSeconds) * 1000,
    );
    return () => window.clearInterval(interval);
  }, [activeSlides.length, durationSeconds]);

  if (activeSlides.length === 0) return null;
  const activeSlide = activeSlides[activeIndex] || activeSlides[0];
  const goToNextSlide = () =>
    setActiveIndex((current) => (current + 1) % activeSlides.length);
  const goToPreviousSlide = () =>
    setActiveIndex(
      (current) => (current - 1 + activeSlides.length) % activeSlides.length,
    );

  return (
    <section className="bg-white py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#003b5c]">
              جایگاه تبلیغات و درخواست‌های فوری
            </span>
            <h2 className="mt-3 text-2xl font-black text-gray-900 md:text-3xl">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-7 text-gray-500">{subtitle}</p>
          </div>
          <Link
            href="/request-purchase"
            className="rounded-xl bg-orange-500 px-5 py-3 text-center text-sm font-bold text-white shadow-sm hover:bg-orange-600"
          >
            ثبت درخواست ویژه
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="w-full overflow-hidden rounded-[2rem] border border-gray-100 bg-gray-100 shadow-lg">
          <div className="relative h-[280px] md:h-[420px]">
            {activeSlide.image ? (
              <img
                src={productImageUrl(activeSlide.image)}
                alt={activeSlide.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className={`h-full w-full bg-gradient-to-l ${fallbackBackground(activeIndex)}`}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-l from-black/65 via-black/25 to-transparent" />
            {activeSlides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPreviousSlide}
                  className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl font-black text-[#003b5c] shadow-lg transition hover:scale-105 hover:bg-white"
                  aria-label="اسلاید قبلی"
                >
                  ›
                </button>
                <button
                  type="button"
                  onClick={goToNextSlide}
                  className="absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl font-black text-[#003b5c] shadow-lg transition hover:scale-105 hover:bg-white"
                  aria-label="اسلاید بعدی"
                >
                  ‹
                </button>
              </>
            )}
            <div className="absolute inset-y-0 right-0 flex max-w-2xl flex-col justify-center p-6 text-white md:p-10">
              <span className="mb-4 w-fit rounded-full bg-white/20 px-4 py-2 text-xs font-black backdrop-blur">
                {activeSlide.id ? `اسلاید ${activeIndex + 1}` : "ویژه"}
              </span>
              <h3 className="text-3xl font-black leading-tight md:text-5xl">
                {activeSlide.title}
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-8 text-white/85 md:text-base">
                {activeSlide.subtitle}
              </p>
              <Link
                href={activeSlide.href || "/requests"}
                className="mt-6 w-fit rounded-2xl bg-white px-6 py-3 text-sm font-black text-[#003b5c] shadow-lg hover:bg-blue-50"
              >
                {activeSlide.cta || "مشاهده"}
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 bg-white px-4 py-3">
            {activeSlides.map((slide, index) => (
              <button
                key={slide.id || index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 rounded-full transition ${
                  activeIndex === index ? "w-10 bg-[#003b5c]" : "w-2.5 bg-gray-300"
                }`}
                aria-label={`نمایش اسلاید ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
