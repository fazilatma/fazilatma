import Link from "next/link";

export type HomepagePromoSlide = {
  title: string;
  subtitle: string;
  badge: string;
  cta: string;
  href: string;
  tone: string;
};

const toneClasses: Record<string, string> = {
  orange: "from-orange-500 via-rose-500 to-pink-600",
  blue: "from-[#003b5c] via-[#005e94] to-[#00a8e8]",
  green: "from-[#0b9c56] via-emerald-500 to-teal-500",
  purple: "from-violet-600 via-purple-600 to-fuchsia-600",
  amber: "from-amber-500 via-orange-500 to-red-500",
};

export const defaultHomepagePromoSlidersText = [
  "نردبان درخواست‌های فوری لپ‌تاپ|درخواست‌هایی که خریدار برای تأمین سریع‌تر حاضر است بیشتر دیده شود|نردبان درخواست|مشاهده درخواست‌ها|/requests|orange",
  "جایگاه ویژه خریداران شرکتی|درخواست‌های عمده و سازمانی برای فروشندگان لپ‌تاپ و کامپیوتر دست‌دوم|آگهی ویژه|ثبت درخواست خرید|/request-purchase|blue",
  "ویترین فروشندگان تخصصی لپ‌تاپ|فروشندگان حرفه‌ای می‌توانند با اشتراک، پروفایل و پیشنهادهایشان بیشتر دیده شود|اشتراک فروشنده|داشبورد فروشنده|/seller/dashboard|green",
  "تبلیغات هدفمند خدمات مرتبط|جایگاه تبلیغ برای تعمیرات، گارانتی، قطعات، رم، SSD و خدمات تست لپ‌تاپ|تبلیغ هدفمند|تماس با ما|/contact|purple",
  "درخواست‌های با بودجه جذاب|آگهی‌هایی که از نظر بودجه، تعداد و کمبود پیشنهاد برای فروشنده فرصت بهتری هستند|فرصت فروشنده|شروع پیشنهاد|/requests|amber",
].join("\n");

export function parseHomepagePromoSliders(text?: string | null): HomepagePromoSlide[] {
  const source = text?.trim() ? text : defaultHomepagePromoSlidersText;
  return source
    .split("\n")
    .map((line) => {
      const [title, subtitle, badge, cta, href, tone] = line
        .split("|")
        .map((part) => part.trim());
      if (!title) return null;
      return {
        title,
        subtitle: subtitle || "درخواست‌های ویژه برای دیده‌شدن بیشتر",
        badge: badge || "جایگاه ویژه",
        cta: cta || "مشاهده",
        href: href || "/requests",
        tone: tone || "blue",
      };
    })
    .filter((item): item is HomepagePromoSlide => Boolean(item))
    .slice(0, 8);
}

export default function HomepagePromoSliders({
  title,
  subtitle,
  sliders,
}: {
  title: string;
  subtitle: string;
  sliders: HomepagePromoSlide[];
}) {
  if (sliders.length === 0) return null;

  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
              جایگاه‌های درآمدی OptiBid
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

        <div className="space-y-4">
          {sliders.map((slider, index) => (
            <div
              key={`${slider.title}-${index}`}
              className={`overflow-hidden rounded-[2rem] bg-gradient-to-l ${
                toneClasses[slider.tone] || toneClasses.blue
              } p-4 text-white shadow-lg`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black">
                    {slider.badge}
                  </span>
                  <h3 className="mt-3 text-xl font-black md:text-2xl">
                    {slider.title}
                  </h3>
                  <p className="mt-1 text-sm leading-7 text-white/85">
                    {slider.subtitle}
                  </p>
                </div>
                <span className="hidden text-4xl md:block">{index + 1}</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {["بودجه بهتر", "نمایش بیشتر", "پیشنهاد سریع"].map((chip) => (
                  <div
                    key={chip}
                    className="min-w-36 rounded-2xl bg-white/15 px-4 py-3 text-center text-sm font-bold ring-1 ring-white/25"
                  >
                    {chip}
                  </div>
                ))}
                <Link
                  href={slider.href}
                  className="min-w-36 rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-[#003b5c] hover:bg-blue-50"
                >
                  {slider.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
