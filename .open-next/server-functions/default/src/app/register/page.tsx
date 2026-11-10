"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const toEnglishDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

const normalizePhone = (value: string) => {
  const digits = toEnglishDigits(value).replace(/\D/g, "");
  if (digits.startsWith("0098")) return `0${digits.slice(4)}`;
  if (digits.startsWith("98")) return `0${digits.slice(2)}`;
  return digits;
};

const isEmail = (value: string) =>
  /^\S+@\S+\.\S+$/.test(value.trim().toLowerCase());
const isMobile = (value: string) => /^09\d{9}$/.test(normalizePhone(value));

export default function RegisterPage() {
  const router = useRouter();
  const [siteMode, setSiteMode] = useState<"store" | "request" | "hybrid">("store");
  const [accountType, setAccountType] = useState<"seller" | "buyer">("buyer");
  const [identifier, setIdentifier] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nationalCard, setNationalCard] = useState<File | null>(null);
  const [nationalCardBack, setNationalCardBack] = useState<File | null>(null);
  const [businessLicense, setBusinessLicense] = useState<File | null>(null);
  const [onlineStoreProof, setOnlineStoreProof] = useState<File | null>(null);

  useEffect(() => {
    fetch("/api/site-mode", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (result.success && ["store", "request", "hybrid"].includes(result.siteMode)) {
          setSiteMode(result.siteMode);
          setAccountType("buyer");
        }
      })
      .catch(() => undefined);
  }, []);

  const identifierType = useMemo(() => {
    if (isEmail(identifier)) return "email";
    if (isMobile(identifier)) return "phone";
    return "unknown";
  }, [identifier]);

  const startSocialRegister = (provider: "google" | "facebook") => {
    const query = new URLSearchParams({
      role: accountType,
      redirect: "/account/completion",
    });
    window.location.assign(`/api/auth/social/${provider}?${query.toString()}`);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (identifierType === "unknown") {
      alert(
        "لطفاً یک ایمیل معتبر یا شماره موبایل معتبر مثل 09123456789 وارد کنید.",
      );
      return;
    }
    if (password.length < 8) {
      alert("رمز عبور باید حداقل ۸ کاراکتر باشد.");
      return;
    }
    if (password !== confirmPassword) {
      alert("رمز عبور و تکرار آن مطابقت ندارند.");
      return;
    }
    if (!agreeTerms) {
      alert("برای ثبت‌نام باید قوانین و حریم خصوصی را بپذیرید.");
      return;
    }
    if (accountType === "seller" && !nationalCard) {
      alert("برای ثبت‌نام فروشنده، تصویر روی کارت ملی را بارگذاری کنید.");
      return;
    }
    if (accountType === "seller" && !businessLicense && !onlineStoreProof) {
      alert(
        "برای ثبت‌نام فروشنده، تصویر پروانه کسب یا مدرک فروشگاه اینترنتی (اینماد، صفحه فروشگاه آنلاین) را بارگذاری کنید.",
      );
      return;
    }
    const oversized = [nationalCard, nationalCardBack, businessLicense, onlineStoreProof]
      .filter((file): file is File => Boolean(file))
      .find((file) => file.size > 5 * 1024 * 1024);
    if (oversized) {
      alert(`حجم فایل «${oversized.name}» بیشتر از ۵ مگابایت است.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append("role", accountType);
      form.append("identifier", identifier.trim());
      if (identifierType === "email")
        form.append("email", identifier.trim().toLowerCase());
      if (identifierType === "phone")
        form.append("phone", normalizePhone(identifier));
      form.append("fullName", fullName.trim());
      form.append("password", password);
      if (nationalCard) form.append("nationalCard", nationalCard);
      if (nationalCardBack) form.append("nationalCardBack", nationalCardBack);
      if (businessLicense) form.append("businessLicense", businessLicense);
      if (onlineStoreProof) form.append("onlineStoreProof", onlineStoreProof);

      const response = await fetch("/api/register", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || "ثبت‌نام ناموفق بود.");

      localStorage.setItem("userRole", result.user.role);
      localStorage.setItem("userId", String(result.user.id));
      localStorage.setItem("userDisplayName", result.user.fullName);
      alert(result.message);
      router.push("/account/completion?welcome=1");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "خطا در ارتباط با سرور هنگام ثبت‌نام.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-l from-green-600 to-green-800 px-4 py-12"
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="mb-2 flex items-center justify-center gap-2 text-4xl font-bold text-white"
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M40 20 C20 20 15 35 15 50 C15 65 20 80 40 80 C60 80 65 65 65 50"
                stroke="#00a8e8"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M45 50 C45 50 60 50 70 50 C80 50 85 60 85 65 C85 75 75 80 60 80 L45 80"
                stroke="#ffffff"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M60 50 L85 20 M85 20 L65 20 M85 20 L85 40"
                stroke="#00a8e8"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            OptiBid
          </Link>
          <p className="text-green-100">
            ثبت‌نام سریع، تکمیل اطلاعات بعد از ورود
          </p>
        </div>

        <div className="mb-6 rounded-3xl border border-white/20 bg-white/10 p-4 text-sm leading-7 text-white backdrop-blur">
          ثبت‌نام با <b>شماره موبایل یا ایمیل</b> انجام می‌شود. اگر فروشنده
          هستید، همان موقع ثبت‌نام باید <b>تصویر روی کارت ملی</b> و{" "}
          <b>پروانه کسب یا مدرک فروشگاه اینترنتی</b> را بارگذاری کنید تا حساب
          شما بررسی شود. اگر خریدار هستید، با بارگذاری تصویر کارت ملی حساب شما
          سریع‌تر تایید می‌شود.
        </div>

        <div className="mb-6 rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="mb-2 text-center text-xl font-bold text-gray-900">
            نوع حساب را انتخاب کنید
          </h2>
          <p className="mb-5 text-center text-xs leading-6 text-gray-500">
            فروشنده برای شروع فروش باید کارت ملی و مدرک فعالیت فروشگاه (پروانه کسب
            یا مدرک فروشگاه اینترنتی) را بارگذاری کند؛ خریدار می‌تواند کارت ملی را
            برای تایید حساب ارسال کند.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setAccountType("buyer")}
              className={`rounded-2xl border-2 p-5 text-center transition ${accountType === "buyer" ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-green-300"}`}
            >
              <div className="text-4xl">🛒</div>
              <h3 className="mt-3 font-bold">خریدار</h3>
              <p className="mt-2 text-xs leading-6 text-gray-500">
                خرید از فروشگاه و ثبت درخواست خرید؛ با ارسال کارت ملی، حساب شما
                تایید می‌شود.
              </p>
              <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold text-green-700">
                تایید هویت با کارت ملی
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAccountType("seller")}
              className={`rounded-2xl border-2 p-5 text-center transition ${accountType === "seller" ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-green-300"}`}
            >
              <div className="text-4xl">🏪</div>
              <h3 className="mt-3 font-bold">فروشنده</h3>
              <p className="mt-2 text-xs leading-6 text-gray-500">
                ثبت کالا و پیشنهاد روی درخواست‌ها؛ کارت ملی و مدرک فعالیت فروشگاه
                الزامی است.
              </p>
              <span className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-700">
                مدارک الزامی
              </span>
            </button>
          </div>
          {siteMode === "store" && (
            <p className="mt-4 rounded-xl bg-blue-50 px-4 py-2 text-[11px] leading-5 text-blue-800">
              سایت در حالت فروشگاهی است؛ خریدارها می‌توانند خرید کنند و برای تایید
              حساب کارت ملی را ارسال کنند. حساب فروشنده هم ساخته می‌شود ولی تا
              تایید مدارک توسط پشتیبانی، امکان فروش فعال نیست.
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm font-bold text-gray-700">
              شماره موبایل یا ایمیل
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                dir="ltr"
                inputMode="email"
                placeholder="09123456789 یا example@email.com"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-left font-normal outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <span
                className={`mt-2 block text-xs ${identifier && identifierType === "unknown" ? "text-amber-600" : "text-gray-500"}`}
              >
                {identifierType === "email"
                  ? "✓ ثبت‌نام با ایمیل"
                  : identifierType === "phone"
                    ? "✓ ثبت‌نام با شماره موبایل"
                    : "می‌توانید فقط یکی از این دو مورد را وارد کنید."}
              </span>
            </label>

            <label className="block text-sm font-bold text-gray-700">
              نام نمایشی یا نام شرکت (اختیاری)
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder={
                  accountType === "seller"
                    ? "مثال: فروشگاه فراسو"
                    : "مثال: علی رضایی"
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-green-500"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-bold text-gray-700">
                رمز عبور
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="حداقل ۸ کاراکتر"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-green-500"
                  required
                  minLength={8}
                />
              </label>
              <label className="block text-sm font-bold text-gray-700">
                تکرار رمز عبور
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="تکرار رمز"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </label>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black text-gray-900">مدارک هویتی</h3>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ${accountType === "seller" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}
                >
                  {accountType === "seller" ? "مدارک الزامی فروشنده" : "برای تایید حساب"}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-5 text-gray-500">
                فقط تصویر JPG، PNG یا WEBP تا ۵ مگابایت. مدارک رمزنگاری‌شده ذخیره
                می‌شوند و فقط ادمین برای بررسی به آن‌ها دسترسی دارد.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold text-gray-700">
                  تصویر روی کارت ملی{" "}
                  {accountType === "seller" && <span className="text-rose-600">*</span>}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setNationalCard(event.target.files?.[0] || null)}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-normal outline-none file:me-3 file:rounded-lg file:border-0 file:bg-green-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white focus:ring-2 focus:ring-green-500"
                  />
                  {nationalCard && (
                    <span className="mt-1 block truncate text-[11px] font-normal text-green-700">
                      ✓ {nationalCard.name}
                    </span>
                  )}
                </label>

                <label className="block text-xs font-bold text-gray-700">
                  تصویر پشت کارت ملی
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setNationalCardBack(event.target.files?.[0] || null)}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-normal outline-none file:me-3 file:rounded-lg file:border-0 file:bg-gray-700 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white focus:ring-2 focus:ring-green-500"
                  />
                  {nationalCardBack && (
                    <span className="mt-1 block truncate text-[11px] font-normal text-green-700">
                      ✓ {nationalCardBack.name}
                    </span>
                  )}
                </label>
              </div>

              {accountType === "seller" && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-bold text-amber-900">
                    مدرک فعالیت فروشگاه — یکی از این دو مورد الزامی است
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-bold text-gray-700">
                      پروانه کسب / جواز صنفی
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => setBusinessLicense(event.target.files?.[0] || null)}
                        className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-normal outline-none file:me-3 file:rounded-lg file:border-0 file:bg-amber-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white focus:ring-2 focus:ring-amber-500"
                      />
                      {businessLicense && (
                        <span className="mt-1 block truncate text-[11px] font-normal text-green-700">
                          ✓ {businessLicense.name}
                        </span>
                      )}
                    </label>
                    <label className="block text-xs font-bold text-gray-700">
                      مدرک فروشگاه اینترنتی
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => setOnlineStoreProof(event.target.files?.[0] || null)}
                        className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-normal outline-none file:me-3 file:rounded-lg file:border-0 file:bg-amber-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white focus:ring-2 focus:ring-amber-500"
                      />
                      {onlineStoreProof && (
                        <span className="mt-1 block truncate text-[11px] font-normal text-green-700">
                          ✓ {onlineStoreProof.name}
                        </span>
                      )}
                      <span className="mt-1 block text-[10px] font-normal leading-4 text-gray-500">
                        برای فروشندگان آنلاین: اینماد، صفحهٔ فروشگاه یا مدرک مشابه
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(event) => setAgreeTerms(event.target.checked)}
                className="mt-1 h-4 w-4 rounded text-green-600"
                required
              />
              <span>
                <Link
                  href="/terms"
                  className="font-bold text-green-600 hover:underline"
                >
                  قوانین و مقررات
                </Link>{" "}
                و{" "}
                <Link
                  href="/privacy"
                  className="font-bold text-green-600 hover:underline"
                >
                  حریم خصوصی
                </Link>{" "}
                را می‌پذیرم.
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-xl py-3 font-bold text-white transition ${isSubmitting ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
            >
              {isSubmitting ? "در حال ساخت حساب..." : "ثبت‌نام سریع و ورود"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">یا ثبت‌نام با</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => startSocialRegister("google")}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 py-3 transition hover:bg-gray-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-sm font-bold">گوگل</span>
            </button>
            <button
              type="button"
              onClick={() => startSocialRegister("facebook")}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 py-3 transition hover:bg-gray-50"
            >
              <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-sm font-bold">فیسبوک</span>
            </button>
          </div>

          <p className="mt-6 text-center text-gray-600">
            قبلاً ثبت‌نام کرده‌اید؟{" "}
            <Link
              href="/login"
              className="font-bold text-green-600 hover:text-green-700"
            >
              ورود به حساب
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
