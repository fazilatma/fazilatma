"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [demoResetUrl, setDemoResetUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const currentToken = new URLSearchParams(window.location.search).get("token");
    if (currentToken) setToken(currentToken);
  }, []);

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    setDemoResetUrl(null);
    try {
      const response = await fetch("/api/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      setMessage(result.message);
      setDemoResetUrl(result.demoResetUrl || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "درخواست بازیابی ناموفق بود.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirmPassword) {
      setError("رمز جدید و تکرار آن یکسان نیستند.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      setMessage(result.message);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تغییر رمز ناموفق بود.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-l from-[#003b5c] to-[#005e94] px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center text-white">
          <Link href="/" className="inline-flex items-center gap-2 text-4xl font-bold">
            <span className="text-[#00a8e8]">Opti</span>Bid
          </Link>
          <p className="mt-3 text-blue-100">بازیابی امن رمز عبور</p>
        </div>

        <section className="rounded-3xl border border-white/20 bg-white p-8 shadow-2xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
            {token ? "🔐" : "✉️"}
          </div>

          {token ? (
            <>
              <h1 className="text-2xl font-bold text-[#003b5c]">تنظیم رمز عبور جدید</h1>
              <p className="mt-2 text-sm leading-7 text-gray-600">
                یک رمز حداقل ۸ کاراکتری شامل حرف و عدد انتخاب کنید. این لینک پس از استفاده باطل می‌شود.
              </p>
              <form onSubmit={resetPassword} className="mt-6 space-y-5">
                <label className="block text-sm font-bold text-gray-700">
                  رمز عبور جدید
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    autoComplete="new-password"
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal outline-none focus:border-[#00a8e8] focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </label>
                <label className="block text-sm font-bold text-gray-700">
                  تکرار رمز عبور جدید
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={8}
                    autoComplete="new-password"
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal outline-none focus:border-[#00a8e8] focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#003b5c] py-3 font-bold text-white transition hover:bg-[#002d46] disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {submitting ? "در حال تغییر رمز..." : "ثبت رمز جدید"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-[#003b5c]">فراموشی رمز عبور</h1>
              <p className="mt-2 text-sm leading-7 text-gray-600">
                ایمیل حساب خود را وارد کنید تا لینک یک‌بارمصرف بازیابی رمز ساخته شود. لینک ۳۰ دقیقه اعتبار دارد.
              </p>
              <form onSubmit={requestReset} className="mt-6 space-y-5">
                <label className="block text-sm font-bold text-gray-700">
                  ایمیل حساب کاربری
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-left font-normal outline-none focus:border-[#00a8e8] focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#00a8e8] py-3 font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {submitting ? "در حال ایجاد لینک..." : "دریافت لینک بازیابی"}
                </button>
              </form>
            </>
          )}

          {message && <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-7 text-green-800">{message}</div>}
          {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-7 text-red-700">{error}</div>}

          {demoResetUrl && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-bold text-amber-800">حالت آزمایشی — سرویس ایمیل متصل نیست</p>
              <p className="mt-2 text-xs leading-6 text-amber-700">
                در محیط واقعی این لینک باید با سرویس ایمیل ارسال شود. برای تست فعلی روی دکمه زیر کلیک کنید.
              </p>
              <a href={demoResetUrl} className="mt-3 block rounded-lg bg-amber-600 px-4 py-2.5 text-center text-sm font-bold text-white">
                باز کردن لینک بازیابی آزمایشی
              </a>
            </div>
          )}

          <div className="mt-6 border-t border-gray-100 pt-5 text-center text-sm">
            <Link href="/login" className="font-bold text-[#00a8e8] hover:underline">
              بازگشت به صفحه ورود
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
