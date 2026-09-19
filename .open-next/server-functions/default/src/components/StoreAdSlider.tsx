"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const slides = [
  {
    id: "stock-test",
    eyebrow: "تبلیغ ویژه فروشگاه",
    title: "لپ‌تاپ استوک شرکتی با مهلت تست",
    text: "مدل‌های تمیز اداری و مهندسی را با مشخصات دقیق، قیمت شفاف و امکان بررسی سلامت انتخاب کنید.",
    href: "/shop?condition=stock",
    cta: "مشاهده استوک‌ها",
    accent: "from-emerald-500 to-[#003b5c]",
  },
  {
    id: "ssd-ram",
    eyebrow: "ارتقای کاربردی",
    title: "انتخاب سریع بر اساس RAM و SSD",
    text: "اگر سرعت اجرای برنامه‌ها مهم است، مدل‌های رم ۱۶ گیگ و SSD 512GB را یکجا ببینید.",
    href: "/shop?ram=16GB&ssd=512GB",
    cta: "مدل‌های سریع",
    accent: "from-blue-500 to-[#003b5c]",
  },
  {
    id: "gaming-rtx",
    eyebrow: "برای بازی و تدوین",
    title: "لپ‌تاپ گیمینگ و RTX",
    text: "برای بازی، تدوین، طراحی و کارهای سنگین، مدل‌های دارای گرافیک مجزا را مقایسه کنید.",
    href: "/shop?gpuType=rtx",
    cta: "مشاهده RTX",
    accent: "from-rose-500 to-[#003b5c]",
  },
  {
    id: "buy-guide",
    eyebrow: "راهنمای خرید",
    title: "نمی‌دانید چه لپ‌تاپی مناسب شماست؟",
    text: "بر اساس کار اداری، دانشجویی، مهندسی یا گیمینگ، راهنمای خرید اختصاصی را ببینید.",
    href: "/shop/guides",
    cta: "شروع راهنما",
    accent: "from-amber-500 to-[#003b5c]",
  },
];

export default function StoreAdSlider() {
  const [index, setIndex] = useState(0);
  const activeSlide = useMemo(() => slides[index] || slides[0], [index]);

  useEffect(() => {
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % slides.length),
      5500,
    );
    return () => window.clearInterval(timer);
  }, []);

  const next = () => setIndex((current) => (current + 1) % slides.length);
  const previous = () =>
    setIndex((current) => (current === 0 ? slides.length - 1 : current - 1));

  return (
    <section
      className={`relative min-h-[250px] overflow-hidden rounded-[2rem] bg-gradient-to-l ${activeSlide.accent} p-6 text-white shadow-xl`}
      aria-label="اسلایدر تبلیغاتی فروشگاه لپ‌تاپ"
    >
      <div className="absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -right-16 -top-14 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-6 left-7 hidden w-52 opacity-25 md:block">
        <div className="mx-auto h-28 rounded-t-3xl border-[12px] border-white/80 bg-white/10" />
        <div className="mx-auto h-4 rounded-b-3xl bg-white/80" />
      </div>

      <div className="relative z-10 max-w-2xl">
        <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-black ring-1 ring-white/20">
          {activeSlide.eyebrow}
        </span>
        <h2 className="mt-4 text-2xl font-black leading-10 md:text-3xl">
          {activeSlide.title}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-white/85">
          {activeSlide.text}
        </p>
        <Link
          href={activeSlide.href}
          className="mt-5 inline-flex rounded-2xl bg-white px-6 py-3 text-sm font-black text-[#003b5c] shadow-lg transition hover:bg-blue-50"
        >
          {activeSlide.cta}
        </Link>
      </div>

      <button
        type="button"
        onClick={previous}
        className="absolute right-4 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl font-black text-[#003b5c] shadow-lg transition hover:bg-white"
        aria-label="تبلیغ قبلی"
      >
        ›
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute left-4 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl font-black text-[#003b5c] shadow-lg transition hover:bg-white"
        aria-label="تبلیغ بعدی"
      >
        ‹
      </button>
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((slide, slideIndex) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setIndex(slideIndex)}
            className={`h-2.5 rounded-full transition ${slideIndex === index ? "w-8 bg-white" : "w-2.5 bg-white/45"}`}
            aria-label={`تبلیغ ${slideIndex + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
