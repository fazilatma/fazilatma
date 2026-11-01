import Link from "next/link";

const buyerSteps = [
  { number: "۱", title: "ثبت آگهی درخواست خرید", description: "خریدار کالا، تعداد، بودجه، مهلت و عکس نمونه را ثبت می‌کند.", icon: "📝" },
  { number: "۲", title: "دریافت پیشنهاد فروشنده‌ها", description: "فروشنده‌های مرتبط قیمت، مشخصات کالا، عکس واقعی و شرایط تحویل را پیشنهاد می‌دهند.", icon: "🎯" },
  { number: "۳", title: "مقایسه و مذاکره مستقیم", description: "خریدار پیشنهادها را مقایسه می‌کند و برای پرداخت، تست و تحویل مستقیماً با فروشنده هماهنگ می‌شود.", icon: "🤝" },
];

const sellerSteps = [
  { number: "۱", title: "مشاهده درخواست‌های مرتبط", description: "فروشنده درخواست‌های خرید مرتبط با حوزه فعالیت خود را مشاهده می‌کند.", icon: "📡" },
  { number: "۲", title: "ثبت قیمت و مشخصات کالا", description: "فروشنده قیمت، زمان تحویل، عکس، وضعیت کالا و شرایط تست را ثبت می‌کند.", icon: "💬" },
  { number: "۳", title: "هماهنگی مستقیم با خریدار", description: "اگر خریدار پیشنهاد را پسندید، ادامه توافق، پرداخت و تحویل مستقیم بین دو طرف انجام می‌شود.", icon: "📞" },
];

const faqs = [
  { question: "آیا سایت پول خریدار را نگه می‌دارد؟", answer: "خیر. در مدل جدید سایت فقط بستر ثبت درخواست خرید و دریافت پیشنهاد فروشنده‌هاست. پرداخت، تحویل، تست، مرجوعی و مسئولیت معامله مستقیم بین خریدار و فروشنده است." },
  { question: "درآمد سایت از کجاست؟", answer: "مدل درآمدی می‌تواند ثبت آگهی، نردبان/ویژه‌کردن آگهی، اشتراک فروشنده حرفه‌ای و تبلیغات هدفمند باشد؛ نه نگهداری وجه معامله." },
  { question: "تفاوت با سایت‌های آگهی چیست؟", answer: "در سایت‌های آگهی معمولاً فروشنده آگهی می‌گذارد؛ اینجا خریدار درخواست خرید می‌گذارد و فروشنده‌ها برای همان نیاز رقابت می‌کنند." },
  { question: "تفاوت با سایت‌های فریلنسری چیست؟", answer: "سایت‌های فریلنسری معمولاً وسط پروژه و پرداخت هستند و درصد می‌گیرند. این مدل به دیوار نزدیک‌تر است: ارتباط‌ساز و آگهی‌محور، با ریسک حقوقی کمتر." },
];

export default function HowItWorksPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-l from-[#003b5c] to-[#005e94] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold md:text-5xl">راهنمای مدل آگهی درخواست خرید</h1>
          <p className="mx-auto mt-4 max-w-3xl text-xl text-blue-100">خریدار آگهی درخواست می‌گذارد، فروشنده‌ها رقابت می‌کنند، اما پرداخت و تحویل مستقیم بین طرفین انجام می‌شود.</p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center"><h2 className="text-3xl font-bold text-[#003b5c]">مسیر خریدار</h2><p className="mx-auto mt-3 max-w-2xl text-gray-600">درخواست خرید ثبت کنید و پیشنهادهای فروشنده‌ها را شفاف مقایسه کنید.</p></div>
          <div className="grid gap-8 md:grid-cols-3">{buyerSteps.map((step) => <StepCard key={step.number} {...step} color="blue" />)}</div>
          <div className="mt-12 text-center"><Link href="/request-purchase" className="inline-block rounded-xl bg-[#00a8e8] px-8 py-4 font-bold text-white transition hover:bg-blue-500">ثبت آگهی درخواست خرید</Link></div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center"><h2 className="text-3xl font-bold text-[#003b5c]">مسیر فروشنده</h2><p className="mx-auto mt-3 max-w-2xl text-gray-600">درخواست‌های واقعی را ببینید و با قیمت و مشخصات کامل پیشنهاد بدهید.</p></div>
          <div className="grid gap-8 md:grid-cols-3">{sellerSteps.map((step) => <StepCard key={step.number} {...step} color="green" />)}</div>
          <div className="mt-12 text-center"><Link href="/register" className="inline-block rounded-xl bg-[#0b9c56] px-8 py-4 font-bold text-white transition hover:bg-green-700">ثبت‌نام فروشنده</Link></div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center"><h2 className="text-3xl font-bold text-[#003b5c]">سوالات متداول</h2><p className="mt-3 text-gray-600">پاسخ کوتاه به مهم‌ترین سوالات مدل کم‌ریسک و آگهی‌محور</p></div>
          <div className="space-y-4">{faqs.map((faq) => <article key={faq.question} className="rounded-2xl border border-gray-100 bg-gray-50 p-6"><h3 className="text-lg font-bold text-gray-900">{faq.question}</h3><p className="mt-3 leading-8 text-gray-600">{faq.answer}</p></article>)}</div>
        </div>
      </section>

      <section className="bg-gradient-to-l from-[#003b5c] to-[#005e94] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold md:text-4xl">آماده ثبت درخواست یا پیشنهاد هستید؟</h2>
          <p className="mt-4 text-xl text-blue-100">آگهی درخواست خرید بسازید یا به درخواست‌های موجود پیشنهاد بدهید.</p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row"><Link href="/request-board" className="rounded-xl bg-white px-8 py-4 font-bold text-[#003b5c]">مشاهده تابلوی درخواست‌ها</Link><Link href="/request-purchase" className="rounded-xl border-2 border-white px-8 py-4 font-bold text-white transition hover:bg-white hover:text-[#003b5c]">ثبت درخواست خرید</Link></div>
        </div>
      </section>
    </div>
  );
}

function StepCard({ number, title, description, icon, color }: { number: string; title: string; description: string; icon: string; color: "blue" | "green" }) {
  const palette = color === "blue" ? "bg-blue-100 text-[#003b5c]" : "bg-green-100 text-[#0b9c56]";
  return <article className="rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-sm"><div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${palette}`}>{icon}</div><p className="mt-4 text-sm font-bold text-gray-400">مرحله {number}</p><h3 className="mt-2 text-xl font-bold text-gray-900">{title}</h3><p className="mt-3 leading-7 text-gray-600">{description}</p></article>;
}
