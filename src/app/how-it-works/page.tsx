import Link from "next/link";

const buyerSteps = [
  { number: "۱", title: "ساخت حساب خریدار", description: "اطلاعات هویتی، نشانی پیش‌فرض دریافت کالا و حساب بانکی خود را ثبت کنید.", icon: "👤" },
  { number: "۲", title: "ثبت درخواست خرید کالا", description: "عنوان کالا، مشخصات، تعداد، بودجه، مهلت و تصاویر نمونه را ثبت کنید.", icon: "📝" },
  { number: "۳", title: "دریافت پیشنهادهای قیمت", description: "فروشندگان مرتبط، مبلغ، زمان تحویل، گارانتی و شرایط ارسال خود را پیشنهاد می‌دهند.", icon: "🎯" },
  { number: "۴", title: "انتخاب فروشنده", description: "قیمت، زمان ارسال، سابقه و امتیاز واقعی فروشندگان را مقایسه و یک پیشنهاد را انتخاب کنید.", icon: "✅" },
  { number: "۵", title: "پرداخت امانی", description: "مبلغ سفارش را از کیف پول یا درگاه پرداخت کنید؛ وجه تا زمان تایید دریافت نزد OptiBid می‌ماند.", icon: "🔒" },
  { number: "۶", title: "دریافت و امتیازدهی", description: "پس از دریافت کالا، تحویل را تایید کنید و تجربه معامله با فروشنده را از یک تا پنج ستاره ارزیابی کنید.", icon: "⭐" },
];

const sellerSteps = [
  { number: "۱", title: "ساخت حساب فروشنده", description: "اطلاعات فروشگاه، نشانی انبار، حساب بانکی و حوزه‌های تامین کالای خود را ثبت کنید.", icon: "🏪" },
  { number: "۲", title: "دریافت درخواست‌های مرتبط", description: "حداکثر پنج درخواست باز و مرتبط با حوزه‌های انتخاب‌شده، در رادار فروشنده نمایش داده می‌شود.", icon: "📡" },
  { number: "۳", title: "اعلام قیمت و تحویل", description: "برای درخواست موردنظر، مبلغ، زمان تحویل و شرایط گارانتی یا ارسال را ثبت کنید.", icon: "💬" },
  { number: "۴", title: "انتظار برای انتخاب و پرداخت", description: "اگر خریدار پیشنهاد شما را انتخاب کند، سفارش ابتدا منتظر پرداخت خریدار می‌ماند.", icon: "⏳" },
  { number: "۵", title: "ارسال کالا", description: "پس از پرداخت خریدار، کالا را به نشانی سفارش ارسال و کد رهگیری را ثبت کنید.", icon: "🚚" },
  { number: "۶", title: "تسویه و ارزیابی خریدار", description: "پس از تایید دریافت، سهم شما پس از کسر کمیسیون به کیف پول واریز می‌شود و می‌توانید خریدار را ارزیابی کنید.", icon: "💰" },
];

const faqs = [
  { question: "ثبت درخواست خرید چگونه انجام می‌شود؟", answer: "خریدار مشخصات کامل کالا، تعداد، بودجه، مهلت و در صورت نیاز تصاویر نمونه را ثبت می‌کند. درخواست فقط برای فروشندگان حوزه مرتبط نمایش داده می‌شود." },
  { question: "وجه خریدار چه زمانی به فروشنده می‌رسد؟", answer: "وجه پس از پرداخت در حساب امانی OptiBid می‌ماند. فقط پس از ثبت ارسال توسط فروشنده و تایید دریافت کالا توسط خریدار، سهم فروشنده آزاد می‌شود." },
  { question: "کمیسیون چگونه محاسبه می‌شود؟", answer: "نرخ کمیسیون توسط ادمین تعیین می‌شود و هنگام انتخاب پیشنهاد در سفارش ثبت می‌گردد. پس از تکمیل معامله، کمیسیون در حساب پلتفرم و مبلغ خالص در کیف پول فروشنده ثبت می‌شود." },
  { question: "امتیاز خریداران و فروشندگان چگونه محاسبه می‌شود؟", answer: "هر طرف فقط پس از یک معامله تکمیل‌شده و فقط یک‌بار می‌تواند طرف مقابل را ارزیابی کند. این امتیازها همراه با کیفیت ارسال، پاسخ‌گویی، لغو و سابقه معامله محاسبه می‌شوند." },
  { question: "اگر کالا ارسال نشود یا مغایرت داشته باشد چه می‌شود؟", answer: "وجه تا تایید دریافت در حساب امانی باقی می‌ماند. خریدار می‌تواند مشکل را گزارش کند تا ادمین مستندات دو طرف را بررسی و درباره آزادسازی یا بازگشت وجه تصمیم‌گیری کند." },
  { question: "برداشت موجودی کیف پول چگونه است؟", answer: "خریدار یا فروشنده درخواست برداشت را برای حساب بانکی ثبت‌شده ارسال می‌کند. پس از بررسی ادمین، تسویه تایید یا در صورت رد، مبلغ به کیف پول بازگردانده می‌شود." },
];

export default function HowItWorksPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-l from-[#003b5c] to-[#005e94] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold md:text-5xl">راهنمای خرید و فروش در OptiBid</h1>
          <p className="mx-auto mt-4 max-w-3xl text-xl text-blue-100">از ثبت درخواست کالا تا پیشنهاد قیمت، پرداخت امانی، ارسال، دریافت و تسویه نهایی</p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[#003b5c]">مسیر خریدار</h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-600">درخواست کالا ثبت کنید، پیشنهادهای واقعی را مقایسه و با پرداخت امانی خرید کنید.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {buyerSteps.map((step) => <StepCard key={step.number} {...step} color="blue" />)}
          </div>
          <div className="mt-12 text-center"><Link href="/request-purchase" className="inline-block rounded-xl bg-[#00a8e8] px-8 py-4 font-bold text-white transition hover:bg-blue-500">ثبت درخواست خرید کالا</Link></div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[#003b5c]">مسیر فروشنده</h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-600">درخواست‌های مرتبط را دریافت کنید، قیمت بدهید، کالا ارسال کنید و پس از تایید خریدار تسویه شوید.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {sellerSteps.map((step) => <StepCard key={step.number} {...step} color="green" />)}
          </div>
          <div className="mt-12 text-center"><Link href="/register" className="inline-block rounded-xl bg-[#0b9c56] px-8 py-4 font-bold text-white transition hover:bg-green-700">ثبت‌نام به عنوان فروشنده</Link></div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center"><h2 className="text-3xl font-bold text-[#003b5c]">سوالات متداول</h2><p className="mt-3 text-gray-600">پاسخ کوتاه به مهم‌ترین سوالات معامله در OptiBid</p></div>
          <div className="space-y-4">{faqs.map((faq) => <article key={faq.question} className="rounded-2xl border border-gray-100 bg-gray-50 p-6"><h3 className="text-lg font-bold text-gray-900">{faq.question}</h3><p className="mt-3 leading-8 text-gray-600">{faq.answer}</p></article>)}</div>
        </div>
      </section>

      <section className="bg-gradient-to-l from-[#003b5c] to-[#005e94] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold md:text-4xl">آماده خرید یا فروش کالا هستید؟</h2>
          <p className="mt-4 text-xl text-blue-100">همین امروز حساب خود را بسازید و اولین معامله امن را آغاز کنید.</p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row"><Link href="/register" className="rounded-xl bg-white px-8 py-4 font-bold text-[#003b5c]">ثبت‌نام رایگان</Link><Link href="/request-purchase" className="rounded-xl border-2 border-white px-8 py-4 font-bold text-white transition hover:bg-white hover:text-[#003b5c]">ثبت درخواست خرید</Link></div>
        </div>
      </section>
    </div>
  );
}

function StepCard({ number, title, description, icon, color }: { number: string; title: string; description: string; icon: string; color: "blue" | "green" }) {
  const palette = color === "blue" ? "bg-blue-100 text-[#003b5c]" : "bg-green-100 text-[#0b9c56]";
  return <article className="rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-sm"><div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${palette}`}>{icon}</div><p className="mt-4 text-sm font-bold text-gray-400">مرحله {number}</p><h3 className="mt-2 text-xl font-bold text-gray-900">{title}</h3><p className="mt-3 leading-7 text-gray-600">{description}</p></article>;
}
