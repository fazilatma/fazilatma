"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<"seller" | "buyer">("buyer");
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    city: "",
    postalCode: "",
    defaultAddress: "",
    bankAccountHolder: "",
    bankName: "",
    bankAccountNumber: "",
    bankCardNumber: "",
    bankShebaNumber: "",
    agreeTerms: false,
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [nationalCard, setNationalCard] = useState<File | null>(null);
  const [birthCertificatePages, setBirthCertificatePages] = useState<File[]>([]);
  const [bankCardImage, setBankCardImage] = useState<File | null>(null);
  const [sellerCategories, setSellerCategories] = useState<string[]>([]);
  const availableSellerCategories = [
    "کالای دیجیتال",
    "مد و پوشاک",
    "خانه و آشپزخانه",
    "زیبایی و سلامت",
    "کتاب و لوازم تحریر",
    "ورزش و سفر",
    "اسباب‌بازی و کودک",
    "خودرو و موتور",
    "صنعتی و اداری",
  ];

  const toggleSellerCategory = (category: string) => {
    setSellerCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("لطفاً فقط فایل تصویری انتخاب کنید.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("حجم تصویر نباید بیشتر از ۲ مگابایت باشد.");
      return;
    }

    setProfileImage(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(formData.username)) {
      alert("نام کاربری باید ۳ تا ۳۰ کاراکتر انگلیسی و شامل حروف، عدد، نقطه، خط تیره یا زیرخط باشد.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert("رمز عبور و تکرار آن مطابقت ندارند!");
      return;
    }
    if (!nationalCard || birthCertificatePages.length === 0 || !bankCardImage) {
      alert("تصویر کارت ملی، تصاویر صفحات شناسنامه و تصویر کارت بانکی الزامی هستند.");
      return;
    }
    if (!formData.agreeTerms) {
      alert("باید قوانین و مقررات را بپذیرید!");
      return;
    }
    if (!formData.city.trim() || !formData.defaultAddress.trim()) {
      alert("شهر و نشانی پیش‌فرض الزامی هستند.");
      return;
    }
    if (formData.postalCode && !/^\d{10}$/.test(formData.postalCode)) {
      alert("کدپستی باید دقیقاً ۱۰ رقم باشد.");
      return;
    }
    if (
      !formData.bankAccountHolder.trim() ||
      !formData.bankName.trim() ||
      formData.bankAccountNumber.length !== 14 ||
      formData.bankCardNumber.length !== 16 ||
      formData.bankShebaNumber.length !== 24
    ) {
      alert("اطلاعات بانکی را کامل وارد کنید؛ شماره حساب ۱۴ رقم، شماره کارت ۱۶ رقم و بخش عددی شبا ۲۴ رقم است.");
      return;
    }
    if (accountType === "seller" && sellerCategories.length === 0) {
      alert("برای فروشندگی حداقل یک حوزه فعالیت انتخاب کنید.");
      return;
    }

    setIsSubmitting(true);
    try {
      const multipart = new FormData();
      multipart.append("fullName", formData.fullName);
      multipart.append("username", formData.username);
      multipart.append("email", formData.email);
      multipart.append("password", formData.password);
      multipart.append("role", accountType);
      multipart.append("city", formData.city);
      multipart.append("postalCode", formData.postalCode);
      multipart.append("defaultAddress", formData.defaultAddress);
      multipart.append("bankAccountHolder", formData.bankAccountHolder);
      multipart.append("bankName", formData.bankName);
      multipart.append("bankAccountNumber", formData.bankAccountNumber);
      multipart.append("bankCardNumber", formData.bankCardNumber);
      multipart.append("bankShebaNumber", `IR${formData.bankShebaNumber}`);
      multipart.append(
        "categories",
        JSON.stringify(accountType === "seller" ? sellerCategories : [])
      );
      if (profileImage) multipart.append("profileImage", profileImage);
      multipart.append("nationalCard", nationalCard);
      for (const page of birthCertificatePages) {
        multipart.append("birthCertificatePages", page);
      }
      multipart.append("bankCardImage", bankCardImage);

      const response = await fetch("/api/register", {
        method: "POST",
        body: multipart,
      });
      const result = await response.json();

      if (!result.success) {
        alert(result.message || "ثبت‌نام با خطا روبه‌رو شد.");
        return;
      }

      // حساب تا زمان تایید ادمین فعال نیست؛ ورود خودکار انجام نمی‌شود.
      alert(result.message);
      router.push(`/login?pending=${encodeURIComponent(formData.username)}`);
    } catch {
      alert("خطا در ارتباط با سرور هنگام ثبت‌نام.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-l from-green-600 to-green-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="flex justify-center items-center gap-2 text-4xl font-bold text-white mb-2">
            <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 20 C20 20 15 35 15 50 C15 65 20 80 40 80 C60 80 65 65 65 50" stroke="#00a8e8" strokeWidth="16" strokeLinecap="round" />
              <path d="M45 50 C45 50 60 50 70 50 C80 50 85 60 85 65 C85 75 75 80 60 80 L45 80" stroke="#ffffff" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M60 50 L85 20 M85 20 L65 20 M85 20 L85 40" stroke="#00a8e8" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            OptiBid
          </Link>
          <p className="text-green-100">ایجاد حساب کاربری جدید</p>
        </div>

        {/* Account Type Selection */}
        <div className="bg-white rounded-2xl p-8 shadow-xl mb-6">
          <h2 className="text-xl font-bold text-center mb-6">نوع حساب کاربری خود را انتخاب کنید</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setAccountType("seller")}
              className={`p-6 rounded-xl border-2 transition ${
                accountType === "seller"
                  ? "border-green-600 bg-green-50"
                  : "border-gray-200 hover:border-green-300"
              }`}
            >
              <div className="text-4xl mb-3">🏪</div>
              <h3 className="font-bold text-lg mb-2">فروشنده</h3>
              <p className="text-sm text-gray-600">درخواست‌های مرتبط را دریافت کنید، قیمت پیشنهاد دهید و کالا بفروشید</p>
            </button>
            <button
              type="button"
              onClick={() => setAccountType("buyer")}
              className={`p-6 rounded-xl border-2 transition ${
                accountType === "buyer"
                  ? "border-green-600 bg-green-50"
                  : "border-gray-200 hover:border-green-300"
              }`}
            >
              <div className="text-4xl mb-3">🛒</div>
              <h3 className="font-bold text-lg mb-2">خریدار</h3>
              <p className="text-sm text-gray-600">درخواست خرید کالا ثبت کنید و پیشنهاد فروشندگان را مقایسه کنید</p>
            </button>
          </div>
        </div>

        {accountType === "seller" && (
          <section className="mb-6 rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">حوزه‌های فعالیت فروشنده</h2>
            <p className="mt-2 text-sm leading-7 text-gray-600">
              درخواست‌های خرید فقط برای فروشندگانی ارسال می‌شود که حوزه مرتبط را انتخاب کرده‌اند. حداقل یک حوزه را انتخاب کنید.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {availableSellerCategories.map((category) => {
                const selected = sellerCategories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleSellerCategory(category)}
                    className={`flex items-center justify-between rounded-xl border p-3 text-right text-sm font-bold transition ${
                      selected
                        ? "border-[#00a8e8] bg-blue-50 text-[#003b5c]"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:border-[#00a8e8]/50"
                    }`}
                  >
                    <span>{category}</span>
                    <span className={`flex h-5 w-5 items-center justify-center rounded border ${selected ? "border-[#00a8e8] bg-[#00a8e8] text-white" : "border-gray-300 bg-white"}`}>
                      {selected ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Register Form */}
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile / Logo Upload */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
              <label className="mb-3 block text-sm font-bold text-gray-800">
                {accountType === "seller" ? "لوگوی فروشگاه / شرکت" : "عکس پروفایل یا لوگوی شرکت خریدار"}
              </label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed border-[#00a8e8] bg-white shadow-sm">
                  {profilePreview ? (
                    <img src={profilePreview} alt="پیش‌نمایش تصویر" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-[#003b5c]">
                      <span className="text-3xl">{accountType === "seller" ? "🏪" : "👤"}</span>
                      <span className="mt-1 text-xs font-bold">تصویر</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    onChange={handleProfileImageChange}
                    className="block w-full cursor-pointer rounded-xl border border-gray-200 bg-white text-sm text-gray-600 file:ml-4 file:border-0 file:bg-[#003b5c] file:px-5 file:py-3 file:text-sm file:font-bold file:text-white hover:file:bg-[#002d46]"
                  />
                  <p className="mt-2 text-xs leading-6 text-gray-500">
                    فرمت‌های مجاز: JPG, PNG, WEBP, SVG — حداکثر حجم ۲ مگابایت. این تصویر در پروفایل عمومی شما نمایش داده می‌شود.
                  </p>
                  {profileImage && (
                    <button
                      type="button"
                      onClick={() => { setProfileImage(null); setProfilePreview(null); }}
                      className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                    >
                      حذف تصویر انتخاب‌شده
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {accountType === "seller" ? "نام فروشگاه / شرکت" : "نام و نام خانوادگی یا نام شرکت"}
              </label>
              <input
                type="text"
                placeholder={accountType === "seller" ? "مثال: فروشگاه دیجی‌تک" : "مثال: علی رضایی یا شرکت فناوران"}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نام کاربری
              </label>
              <input
                type="text"
                dir="ltr"
                autoComplete="username"
                placeholder="مثال: ali.rezaei"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-left outline-none focus:border-transparent focus:ring-2 focus:ring-green-500"
                value={formData.username}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 30),
                  })
                }
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                نام کاربری پس از تایید مدارک توسط ادمین فعال می‌شود؛ ۳ تا ۳۰ کاراکتر انگلیسی.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ایمیل
              </label>
              <input
                type="email"
                placeholder="example@email.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                required
                dir="ltr"
              />
            </div>

            {/* Default Address */}
            <section className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
              <div className="mb-5">
                <h3 className="font-bold text-gray-900">
                  {accountType === "buyer" ? "نشانی پیش‌فرض دریافت کالا" : "نشانی پیش‌فرض مبدا ارسال / انبار"}
                </h3>
                <p className="mt-1 text-xs leading-6 text-gray-500">
                  {accountType === "buyer"
                    ? "این نشانی هنگام انتخاب پیشنهاد به‌صورت پیش‌فرض در سفارش قرار می‌گیرد؛ در هر سفارش می‌توانید نشانی دیگری وارد کنید."
                    : "این نشانی به‌عنوان مبدا پیش‌فرض ارسال کالا و اطلاعات فروشگاه شما ذخیره می‌شود."}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">شهر / استان</label>
                  <input
                    type="text"
                    placeholder="مثال: دزفول، دزفول"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">کدپستی ۱۰ رقمی</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="مثال: 1234567890"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-left outline-none focus:border-transparent focus:ring-2 focus:ring-green-500"
                    dir="ltr"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">نشانی کامل</label>
                  <textarea
                    placeholder={accountType === "buyer" ? "خیابان، کوچه، پلاک، واحد و توضیحات لازم برای تحویل" : "نشانی فروشگاه یا انبار، خیابان، کوچه، پلاک و واحد"}
                    value={formData.defaultAddress}
                    onChange={(e) => setFormData({ ...formData, defaultAddress: e.target.value })}
                    className="min-h-28 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>
            </section>

            {/* Bank Settlement Information */}
            <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
              <div className="mb-5">
                <h3 className="font-bold text-gray-900">اطلاعات حساب بانکی برای تسویه کیف پول</h3>
                <p className="mt-1 text-xs leading-6 text-gray-500">
                  این اطلاعات برای درخواست برداشت موجودی کیف پول استفاده می‌شود. تسویه بانکی فقط پس از بررسی و تایید اطلاعات توسط ادمین انجام خواهد شد.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">نام صاحب حساب</label>
                  <input
                    type="text"
                    value={formData.bankAccountHolder}
                    onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                    placeholder="نام دقیق مطابق حساب بانکی"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">نام بانک</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="مثال: بانک ملت"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">شماره حساب</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={[
                      formData.bankAccountNumber.slice(0, 3),
                      formData.bankAccountNumber.slice(3, 6),
                      formData.bankAccountNumber.slice(6, 13),
                      formData.bankAccountNumber.slice(13, 14),
                    ].filter(Boolean).join("-")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankAccountNumber: e.target.value.replace(/\D/g, "").slice(0, 14),
                      })
                    }
                    placeholder="000-000-0000000-0"
                    maxLength={17}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-left outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="mt-2 text-xs text-gray-500" dir="rtl">
                    الگوی شماره حساب: ۳ رقم - ۳ رقم - ۷ رقم - ۱ رقم
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">شماره کارت ۱۶ رقمی</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={formData.bankCardNumber.replace(/(.{4})/g, "$1-").replace(/-$/, "")}
                    onChange={(e) => setFormData({ ...formData, bankCardNumber: e.target.value.replace(/\D/g, "").slice(0, 16) })}
                    placeholder="0000-0000-0000-0000"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-left outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">شماره شبا</label>
                  <div className="flex overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500">
                    <span className="flex items-center border-l bg-gray-100 px-4 font-bold text-[#003b5c]" dir="ltr">IR</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      value={formData.bankShebaNumber}
                      onChange={(e) => setFormData({ ...formData, bankShebaNumber: e.target.value.replace(/\D/g, "").slice(0, 24) })}
                      placeholder="24 رقم شماره شبا"
                      className="w-full border-0 px-4 py-3 text-left outline-none"
                      required
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">شماره شبا در سمت سرور از نظر ساختار و رقم کنترل بررسی می‌شود.</p>
                </div>
              </div>
            </section>

            {/* Identity Verification Documents */}
            <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
              <div className="mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛡️</span>
                  <h3 className="font-bold text-gray-900">مدارک احراز هویت</h3>
                </div>
                <p className="mt-2 text-xs leading-6 text-gray-600">
                  پس از ثبت‌نام، مدارک فقط در پنل ادمین قابل مشاهده‌اند. حساب و نام کاربری شما تا زمان تایید ادمین فعال نخواهد شد. فایل‌ها به‌صورت رمزنگاری‌شده ذخیره می‌شوند.
                </p>
              </div>

              <div className="space-y-4">
                <DocumentInput
                  label="تصویر کارت ملی"
                  help="تصویر واضح روی کارت ملی"
                  file={nationalCard}
                  onChange={(files) => setNationalCard(files[0] || null)}
                />
                <DocumentInput
                  label="تصاویر صفحات شناسنامه"
                  help="تمام صفحات دارای اطلاعات یا توضیحات را انتخاب کنید؛ حداکثر ۸ تصویر"
                  files={birthCertificatePages}
                  multiple
                  onChange={(files) => setBirthCertificatePages(files.slice(0, 8))}
                />
                <DocumentInput
                  label="تصویر کارت بانکی"
                  help="کارت باید متعلق به صاحب حساب ثبت‌شده باشد"
                  file={bankCardImage}
                  onChange={(files) => setBankCardImage(files[0] || null)}
                />
              </div>
              <p className="mt-4 text-xs text-amber-800">فرمت‌های مجاز: JPG، PNG، WEBP — حداکثر حجم هر تصویر ۵ مگابایت</p>
            </section>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رمز عبور
              </label>
              <input
                type="password"
                placeholder="********"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">حداقل ۸ کاراکتر</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تکرار رمز عبور
              </label>
              <input
                type="password"
                placeholder="********"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
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
                  <Link href="/terms" className="text-green-600 hover:underline">قوانین و مقررات</Link> و{" "}
                  <Link href="/privacy" className="text-green-600 hover:underline">حریم خصوصی</Link> را مطالعه کرده و می‌پذیرم
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-lg font-bold transition ${
                isSubmitting ? "bg-gray-400 cursor-not-allowed text-white" : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {isSubmitting
                ? "در حال ثبت‌نام..."
                : accountType === "seller"
                  ? "ثبت‌نام به عنوان فروشنده"
                  : "ثبت‌نام به عنوان خریدار"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">یا ثبت‌نام با</span>
            </div>
          </div>

          {/* Social Register */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-3 hover:bg-gray-50 transition">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium">گوگل</span>
            </button>
            <button className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-3 hover:bg-gray-50 transition">
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm font-medium">فیسبوک</span>
            </button>
          </div>

          {/* Login Link */}
          <p className="text-center mt-6 text-gray-600">
            قبلاً ثبت‌نام کرده‌اید؟{" "}
            <Link href="/login" className="text-green-600 hover:text-green-700 font-bold">
              ورود به حساب
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function DocumentInput({
  label,
  help,
  file,
  files = [],
  multiple = false,
  onChange,
}: {
  label: string;
  help: string;
  file?: File | null;
  files?: File[];
  multiple?: boolean;
  onChange: (files: File[]) => void;
}) {
  const selectedFiles = multiple ? files : file ? [file] : [];

  return (
    <div className="rounded-xl border border-amber-100 bg-white p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold text-gray-800">{label}</p>
          <p className="mt-1 text-xs text-gray-500">{help}</p>
        </div>
        <label className="cursor-pointer rounded-lg bg-[#003b5c] px-4 py-2.5 text-center text-xs font-bold text-white transition hover:bg-[#002d46]">
          انتخاب {multiple ? "تصاویر" : "تصویر"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={multiple}
            className="hidden"
            onChange={(event) => {
              const selected = Array.from(event.target.files || []);
              const invalid = selected.find(
                (item) =>
                  !["image/jpeg", "image/png", "image/webp"].includes(item.type) ||
                  item.size > 5 * 1024 * 1024
              );
              if (invalid) {
                alert("فقط تصاویر JPG، PNG یا WEBP با حداکثر حجم ۵ مگابایت مجاز هستند.");
                event.target.value = "";
                return;
              }
              onChange(selected);
            }}
          />
        </label>
      </div>
      {selectedFiles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          {selectedFiles.map((item, index) => (
            <span key={`${item.name}-${index}`} className="rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
              ✓ {item.name} — {(item.size / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 0 })} کیلوبایت
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
