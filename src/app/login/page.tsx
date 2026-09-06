"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [pendingApproval, setPendingApproval] = useState(false);
  const [socialNotice, setSocialNotice] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pendingUsername = params.get("pending");
    const socialError = params.get("social_error");
    if (pendingUsername) {
      setPendingApproval(true);
      setFormData((current) => ({ ...current, email: pendingUsername }));
    }
    if (socialError) {
      setSocialNotice(
        socialError === "provider"
          ? "ارائه‌دهنده ورود اجتماعی معتبر نیست."
          : socialError,
      );
    }
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const startSocialLogin = (provider: "google" | "facebook") => {
    const redirectUrl = sessionStorage.getItem("redirectAfterAuth") || "";
    const query = new URLSearchParams({ role: "buyer" });
    if (redirectUrl.startsWith("/") && !redirectUrl.startsWith("//"))
      query.set("redirect", redirectUrl);
    window.location.assign(`/api/auth/social/${provider}?${query.toString()}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: formData.email,
          password: formData.password,
        }),
      });
      const result = await response.json();
      if (!result.success) {
        alert(
          result.message || "نام کاربری، موبایل، ایمیل یا رمز عبور صحیح نیست.",
        );
        return;
      }

      const role = result.user.role as string;
      localStorage.setItem("userRole", role);
      localStorage.setItem("userId", String(result.user.id));
      localStorage.setItem("userDisplayName", result.user.fullName);

      const redirectUrl = sessionStorage.getItem("redirectAfterAuth");
      const dashboardUrl = `/${role === "admin" ? "admin" : role}/dashboard`;
      const targetUrl =
        redirectUrl && redirectUrl.startsWith("/") ? redirectUrl : dashboardUrl;
      if (redirectUrl) sessionStorage.removeItem("redirectAfterAuth");

      // استفاده از assign باعث می‌شود بعد از ذخیره localStorage، صفحه واقعاً به پیشخوان نقش مربوطه برود
      // و دیگر reload زودهنگام روی صفحه ورود کاربر را همان‌جا نگه ندارد.
      window.location.assign(targetUrl);
    } catch {
      alert("خطا در ارتباط با سرور هنگام ورود.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-l from-green-600 to-green-800 flex items-center justify-center py-12 px-4"
    >
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="flex justify-center items-center gap-2 text-4xl font-bold text-white mb-2"
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
          <p className="text-green-100">ورود به حساب کاربری</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          {pendingApproval && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800">
              ثبت‌نام شما انجام شد و مدارک در انتظار بررسی ادمین هستند. نام
              کاربری پس از تایید مدارک فعال می‌شود.
            </div>
          )}
          {socialNotice && (
            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-7 text-blue-800">
              {socialNotice}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نام کاربری، شماره موبایل یا ایمیل
              </label>
              <input
                type="text"
                placeholder="مثال: ali.rezaei یا 09123456789 یا email@example.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رمز عبور
              </label>
              <input
                type="password"
                placeholder="********"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) =>
                    setFormData({ ...formData, rememberMe: e.target.checked })
                  }
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-sm text-gray-600">مرا به خاطر بسپار</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-green-600 hover:text-green-700"
              >
                فراموشی رمز عبور
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-lg font-bold transition ${isSubmitting ? "bg-gray-400 cursor-not-allowed text-white" : "bg-green-600 text-white hover:bg-green-700"}`}
            >
              {isSubmitting ? "در حال ورود..." : "ورود"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">یا ورود با</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => startSocialLogin("google")}
              className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-3 hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span className="text-sm font-medium">گوگل</span>
            </button>
            <button
              type="button"
              onClick={() => startSocialLogin("facebook")}
              className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-3 hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-sm font-medium">فیسبوک</span>
            </button>
          </div>

          {/* Register Link */}
          <p className="text-center mt-6 text-gray-600">
            حساب کاربری ندارید؟{" "}
            <Link
              href="/register"
              className="text-green-600 hover:text-green-700 font-bold"
            >
              ثبت‌نام رایگان
            </Link>
          </p>
        </div>

        {/* Benefits */}
        <div className="mt-8 text-center text-green-100 text-sm">
          <p>✓ دسترسی به درخواست‌های خرید و پیشنهادهای واقعی</p>
          <p>✓ پرداخت امن و تضمین شده</p>
          <p>✓ پشتیبانی ۲۴ ساعته</p>
        </div>
      </div>
    </div>
  );
}
