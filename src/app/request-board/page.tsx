import Link from "next/link";
import { ProductThumb } from "@/components/ProductImages";
import { getJsonRequests } from "@/lib/json-store";

export const dynamic = "force-dynamic";

const money = (value: string | number) =>
  `${Number(String(value).replace(/\D/g, "") || 0).toLocaleString("fa-IR")} تومان`;

export default async function RequestBoardPage() {
  const requests = await getJsonRequests().catch(() => []);

  return (
    <div dir="rtl" className="min-h-screen bg-[#f5f7fb] pb-20">
      <section className="bg-gradient-to-l from-[#003b5c] via-[#005e94] to-[#0b9c56] py-14 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-3xl">
            <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-blue-50">
              مدل آگهی‌محور کم‌ریسک
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
              تابلوی آگهی درخواست خرید؛ شبیه دیوار، اما شروع معامله از سمت
              خریدار
            </h1>
            <p className="mt-5 text-lg leading-9 text-blue-50">
              در این مدل، خریدار نیازش را آگهی می‌کند و فروشنده‌ها برای همان
              نیاز پیشنهاد می‌دهند. پلتفرم میزبان آگهی و ابزار مقایسه است، نه
              طرف معامله، نه فروشنده و نه ضامن پرداخت/تحویل.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/request-purchase"
                className="rounded-xl bg-orange-500 px-6 py-3 text-center font-bold text-white shadow-lg transition hover:bg-orange-600"
              >
                ثبت آگهی درخواست خرید
              </Link>
              <Link
                href="/requests"
                className="rounded-xl bg-white/15 px-6 py-3 text-center font-bold text-white ring-1 ring-white/30 transition hover:bg-white/25"
              >
                مشاهده همه درخواست‌ها
              </Link>
              <Link
                href="/"
                className="rounded-xl bg-white px-6 py-3 text-center font-bold text-[#003b5c] transition hover:bg-blue-50"
              >
                بازگشت به مدل فعلی سایت
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: "🧾",
              title: "خریدار آگهی درخواست می‌گذارد",
              text: "به جای اینکه فروشنده اول آگهی بگذارد، خریدار دقیقاً می‌نویسد چه کالا، چه تعداد و چه بودجه‌ای دارد.",
            },
            {
              icon: "⚔️",
              title: "فروشنده‌ها رقابت می‌کنند",
              text: "فروشنده‌ها مثل مدل فریلنسری قیمت، شرایط، زمان تحویل و مشخصات پیشنهادی را اعلام می‌کنند.",
            },
            {
              icon: "🛡️",
              title: "پلتفرم طرف معامله نیست",
              text: "در نسخه آگهی‌محور، توافق، پرداخت، تحویل و مسئولیت حقوقی بین خریدار و فروشنده است؛ سایت فقط میزبان آگهی و پیشنهاد است.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-white bg-white p-6 shadow-sm"
            >
              <div className="text-4xl">{item.icon}</div>
              <h2 className="mt-4 text-xl font-bold text-[#003b5c]">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-gray-600">
                {item.text}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <h2 className="text-xl font-bold">پیشنهاد راهبردی من</h2>
          <p className="mt-3 leading-8">
            این تغییر جهت منطقی است، چون ریسک حقوقی و عملیاتی escrow، پرداخت،
            مرجوعی و اختلاف را کم می‌کند. اما باید متن قوانین، پیام‌های صفحه و
            فاکتورهای سایت واضح بگویند که سایت «واسطه معامله و ضامن کیفیت کالا»
            نیست. درآمد اصلی بهتر است از ثبت آگهی، نردبان/ویژه‌کردن آگهی، اشتراک
            فروشنده حرفه‌ای و نمایش بیشتر پیشنهادها باشد.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "ثبت آگهی درخواست خرید",
              "خریدار برای ثبت یا تمدید آگهی هزینه پرداخت می‌کند.",
            ],
            [
              "نردبان و آگهی ویژه",
              "درخواست‌هایی که فوری‌اند، بالاتر و پررنگ‌تر نمایش داده می‌شوند.",
            ],
            [
              "اشتراک فروشنده حرفه‌ای",
              "فروشنده برای دسترسی بهتر، نشان ویژه و ابزار مدیریت پیشنهاد اشتراک می‌گیرد.",
            ],
            [
              "تبلیغات هدفمند",
              "تبلیغ فروشگاه‌های مرتبط در دسته‌های خاص مثل لپ‌تاپ استوک.",
            ],
          ].map(([title, text]) => (
            <div
              key={title}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <h3 className="font-bold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-gray-600">{text}</p>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-black text-[#003b5c]">
                نمونه آگهی‌های درخواست خرید فعال
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                این صفحه لینک جدید است و لینک‌های قبلی مثل /requests و
                /request-purchase همچنان باقی می‌مانند.
              </p>
            </div>
            <Link
              href="/request-purchase"
              className="rounded-xl bg-[#0b9c56] px-5 py-3 text-center text-sm font-bold text-white"
            >
              + ثبت درخواست جدید
            </Link>
          </div>

          {requests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
              هنوز درخواست فعالی وجود ندارد.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {requests.slice(0, 8).map((request) => (
                <article
                  key={request.id}
                  className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex gap-4">
                    <ProductThumb
                      images={request.productImages}
                      title={request.title}
                      className="h-20 w-20"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {request.category}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                          تعداد: {request.quantity}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {request.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-7 text-gray-600">
                        {request.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                    <b className="text-xl text-[#0b9c56]">
                      {money(request.budget)}
                    </b>
                    <div className="flex gap-2">
                      <Link
                        href={`/requests/${request.id}`}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                      >
                        مشاهده جزئیات
                      </Link>
                      <Link
                        href={`/requests/${request.id}/offer`}
                        className="rounded-xl bg-[#003b5c] px-4 py-2 text-sm font-bold text-white hover:bg-[#002d46]"
                      >
                        پیشنهاد فروشنده
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
