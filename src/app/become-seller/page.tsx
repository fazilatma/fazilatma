"use client";

import { useState } from "react";
import Link from "next/link";

export default function BecomeSellerPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    storeName: "",
    storeDescription: "",
    category: "",
    phone: "",
    nationalId: "",
    bankAccount: "",
    agreeTerms: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("درخواست فروشندگی شما با موفقیت ثبت شد. پس از بررسی، نتیجه از طریق ایمیل اطلاع‌رسانی می‌شود.");
  };

  const benefits = [
    {
      icon: "💰",
      title: "درآمد نامحدود",
      description: "بدون محدودیت درآمد کسب کنید و کسب‌وکار خود را رشد دهید",
    },
    {
      icon: "👥",
      title: "دسترسی به میلیون‌ها مشتری",
      description: "محصولات خود را به میلیون‌ها کاربر OptiBid معرفی کنید",
    },
    {
      icon: "🚀",
      title: "رشد سریع کسب‌وکار",
      description: "با ابزارهای بازاریابی و تبلیغات، فروش خود را افزایش دهید",
    },
    {
      icon: "🔒",
      title: "پرداخت امن و مطمئن",
      description: "دریافت پرداخت‌ها با تضمین و امنیت کامل",
    },
    {
      icon: "📊",
      title: "داشبورد مدیریت فروش",
      description: "مدیریت آسان محصولات، سفارشات و گزارش‌های فروش",
    },
    {
      icon: "🎯",
      title: "پشتیبانی اختصاصی",
      description: "تیم پشتیبانی فروشندگان همیشه آماده کمک به شما است",
    },
  ];

  const requirements = [
    "داشتن حساب کاربری در OptiBid",
    "احراز هویت با کد ملی و شماره موبایل",
    "ارائه اطلاعات حساب بانکی به نام متقاضی",
    "تعهد به رعایت قوانین و مقررات پلتفرم",
    "داشتن حداقل ۵ محصول برای شروع فروش",
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-l from-green-600 to-green-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">شروع فروشندگی در OptiBid</h1>
          <p className="text-xl text-green-100 max-w-3xl mx-auto mb-8">
            کسب‌وکار خود را آنلاین کنید و به میلیون‌ها مشتری دسترسی پیدا کنید
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setStep(2)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-bold transition"
            >
              شروع ثبت‌نام فروشنده
            </button>
            <Link
              href="/sellers"
              className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-white hover:text-green-700 transition"
            >
              مشاهده فروشندگان
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">چرا فروشندگی در OptiBid؟</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            با پیوستن به شبکه فروشندگان OptiBid، از مزایای زیر بهره‌مند شوید
          </p>

          <div className="grid md:grid-cols-2 md:grid-cols-3 gap-8">
            {benefits.map((benefit, i) => (
              <div key={i} className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="font-bold text-xl mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-8">شرایط و مدارک مورد نیاز</h2>
          
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <ul className="space-y-4">
              {requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      {step === 2 && (
        <section className="py-16 bg-white">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 text-center">فرم ثبت‌نام فروشندگی</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نام فروشگاه
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: دیجی‌تک"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    دسته‌بندی اصلی محصولات
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">انتخاب دسته‌بندی</option>
                    <option value="digital">کالای دیجیتال</option>
                    <option value="fashion">مد و پوشاک</option>
                    <option value="home">خانه و آشپزخانه</option>
                    <option value="beauty">زیبایی و سلامت</option>
                    <option value="books">کتاب و لوازم تحریر</option>
                    <option value="sports">ورزش و سفر</option>
                    <option value="toys">اسباب‌بازی و کودک</option>
                    <option value="auto">خودرو و موتور</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    توضیحات فروشگاه
                  </label>
                  <textarea
                    placeholder="درباره فروشگاه و محصولات خود توضیح دهید..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[150px]"
                    value={formData.storeDescription}
                    onChange={(e) => setFormData({ ...formData, storeDescription: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    شماره موبایل
                  </label>
                  <input
                    type="tel"
                    placeholder="09123456789"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    کد ملی
                  </label>
                  <input
                    type="text"
                    placeholder="کد ملی ۱۰ رقمی"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    required
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    شماره شبا
                  </label>
                  <input
                    type="text"
                    placeholder="IR000000000000000000000000"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">شماره شبا باید به نام متقاضی باشد</p>
                </div>

                <div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeTerms}
                      onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                      className="w-4 h-4 text-green-600 rounded mt-1"
                      required
                    />
                    <span className="text-sm text-gray-600">
                      <Link href="/seller-terms" className="text-green-600 hover:underline">قوانین و مقررات فروشندگان</Link> را مطالعه کرده و می‌پذیرم
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 transition"
                >
                  ثبت درخواست فروشندگی
                </button>
              </form>

              <p className="text-center text-gray-600 mt-6">
                قبلاً ثبت‌نام کرده‌اید؟{" "}
                <Link href="/login" className="text-green-600 hover:text-green-700 font-bold">
                  ورود به حساب
                </Link>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">سوالی دارید؟</h2>
          <p className="text-xl text-gray-400 mb-8">تیم پشتیبانی ما آماده پاسخگویی به سوالات شما است</p>
          <Link
            href="/contact"
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-bold transition"
          >
            تماس با ما
          </Link>
        </div>
      </section>
    </div>
  );
}
