import Link from "next/link";
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
  const activeSlide = slides[0];

  return (
    <section
      className={`relative min-h-[105px] overflow-hidden rounded-[2rem] bg-gradient-to-l ${activeSlide.accent} p-4 text-white shadow-xl md:min-h-[125px]`}
      aria-label="پیشنهاد ویژه فروشگاه لپ‌تاپ"
    >
      <div className="absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -right-16 -top-14 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-3 left-7 hidden w-36 opacity-25 md:block">
        <div className="mx-auto h-12 rounded-t-3xl border-[7px] border-white/80 bg-white/10" />
        <div className="mx-auto h-2 rounded-b-3xl bg-white/80" />
      </div>

      <div className="relative z-10 max-w-2xl">
        <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-black ring-1 ring-white/20">
          {activeSlide.eyebrow}
        </span>
        <h2 className="mt-1.5 text-lg font-black leading-7 md:text-2xl">
          {activeSlide.title}
        </h2>
        <p className="mt-1 max-w-5xl text-xs leading-5 text-white/85 md:text-sm">
          {activeSlide.text}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {slides.map((slide) => (
            <Link
              key={slide.id}
              href={slide.href}
              className={`rounded-2xl px-4 py-2 text-xs font-black shadow-lg transition md:text-sm ${
                slide.id === activeSlide.id
                  ? "bg-white text-[#003b5c] hover:bg-blue-50"
                  : "border border-white/30 text-white hover:bg-white/10"
              }`}
            >
              {slide.cta}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
