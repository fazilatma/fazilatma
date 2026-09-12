"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  categoryHref,
  defaultCatalogCategories,
  type CatalogCategory,
} from "@/lib/catalog-categories";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [previousUserRole, setPreviousUserRole] = useState<string | null>(null);
  const [headerCategories, setHeaderCategories] = useState<CatalogCategory[]>(
    defaultCatalogCategories,
  );
  const router = useRouter();
  const pathname = usePathname();
  const showMobileAuthDock =
    !userRole && !["/login", "/register"].includes(pathname);

  useEffect(() => {
    // خواندن نقش کاربر از لوکال استوریج در کلاینت‌ساید
    setUserRole(localStorage.getItem("userRole"));
    setPreviousUserRole(localStorage.getItem("previousUserRole"));
    fetch("/api/catalog-categories")
      .then((response) => response.json())
      .then((result) => {
        if (result.success && Array.isArray(result.categories)) {
          setHeaderCategories(result.categories);
        }
      })
      .catch(() => undefined);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" }).catch(() => undefined);
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("userDisplayName");
    localStorage.removeItem("previousUserRole");
    sessionStorage.removeItem("redirectAfterAuth");
    setPreviousUserRole(null);
    setUserRole(null);
    // بعد از خروج از هر نقش، مستقیم به صفحه اصلی برو؛ reload مسیر داشبورد قبلی خطای «آماده نیست» می‌داد.
    window.location.replace("/");
  };

  const switchBackToBuyerMode = () => {
    localStorage.setItem("userRole", "buyer");
    localStorage.removeItem("previousUserRole");
    setUserRole("buyer");
    setPreviousUserRole(null);
    router.push("/buyer/dashboard");
    setTimeout(() => window.location.reload(), 200);
  };

  const switchBackToSellerMode = () => {
    localStorage.setItem("userRole", "seller");
    localStorage.removeItem("previousUserRole");
    setUserRole("seller");
    setPreviousUserRole(null);
    router.push("/seller/dashboard");
    setTimeout(() => window.location.reload(), 200);
  };

  const rememberLoginReturnPath = () => {
    if (pathname.startsWith("/requests") || pathname === "/request-purchase") {
      const query = window.location.search || "";
      sessionStorage.setItem("redirectAfterAuth", `${pathname}${query}`);
      return;
    }
    sessionStorage.removeItem("redirectAfterAuth");
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" dir="rtl">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center">
              <svg
                width="40"
                height="40"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M40 20 C20 20 15 35 15 50 C15 65 20 80 40 80 C60 80 65 65 65 50"
                  stroke="url(#blueGrad)"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <path
                  d="M45 50 C45 50 60 50 70 50 C80 50 85 60 85 65 C85 75 75 80 60 80 L45 80"
                  stroke="#003b5c"
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
                <defs>
                  <linearGradient
                    id="blueGrad"
                    x1="15"
                    y1="20"
                    x2="65"
                    y2="80"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#003b5c" />
                    <stop offset="1" stopColor="#00a8e8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="text-xl font-bold text-[#003b5c] tracking-tight max-[360px]:hidden sm:text-2xl">
              Opti<span className="text-[#00a8e8]">Bid</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 space-x-reverse">
            <Link
              href="/requests"
              className="text-gray-700 hover:text-green-600 transition font-medium"
            >
              درخواست‌های خرید
            </Link>
            <Link
              href="/request-board"
              className="text-gray-700 hover:text-green-600 transition font-medium"
            >
              تابلوی آگهی‌ها
            </Link>
            <Link
              href="/sellers"
              className="text-gray-700 hover:text-green-600 transition font-medium"
            >
              فروشندگان
            </Link>
            <Link
              href="/buyers"
              className="text-gray-700 hover:text-green-600 transition font-medium"
            >
              خریداران
            </Link>
            <div className="group relative py-5">
              <Link
                href="/categories"
                className="text-gray-700 hover:text-green-600 transition font-medium"
              >
                دسته‌بندی‌ها
              </Link>
              <div className="invisible absolute right-0 top-full z-50 w-[760px] overflow-hidden rounded-3xl border border-gray-100 bg-white text-right opacity-0 shadow-2xl transition group-hover:visible group-hover:opacity-100">
                <div className="grid grid-cols-12">
                  <div className="col-span-4 border-l border-gray-100 bg-gray-50 p-3">
                    {headerCategories.filter((category) => category.isActive !== false).map((category) => (
                      <Link
                        key={category.name}
                        href={categoryHref(category)}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-gray-700 hover:bg-white hover:text-[#003b5c]"
                      >
                        <span className="text-xl">{category.icon}</span>
                        <span>{category.name}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="col-span-8 grid grid-cols-3 gap-4 p-5">
                    {headerCategories.filter((category) => category.isActive !== false).slice(0, 6).map((category) => (
                      <div key={category.name}>
                        <Link
                          href={categoryHref(category)}
                          className="mb-3 block border-r-2 border-red-500 pr-2 text-sm font-black text-gray-900 hover:text-[#00a8e8]"
                        >
                          {category.name}
                        </Link>
                        <div className="space-y-2">
                          {category.subcategories
                            .flatMap((group) => group.items.slice(0, 3))
                            .slice(0, 7)
                            .map((item) => (
                              <Link
                                key={item}
                                href={categoryHref(category)}
                                className="block text-xs text-gray-500 hover:text-[#00a8e8]"
                              >
                                {item}
                              </Link>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <Link
              href="/how-it-works"
              className="pr-6 text-gray-700 hover:text-green-600 transition font-medium"
            >
              راهنما
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-3 space-x-reverse">
            <Link
              href="/external-link"
              className="bg-blue-50 hover:bg-blue-100 text-[#003b5c] text-xs font-bold px-3 py-1.5 rounded-full transition flex items-center gap-1 border border-blue-200"
              title="لینک خارجی arena.site"
            >
              🌐 arena.site
            </Link>
            <Link
              href="/request-purchase"
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg transition font-bold text-sm"
            >
              ثبت درخواست خرید
            </Link>

            {userRole ? (
              <div className="flex items-center gap-3 border-r border-gray-200 pr-3">
                {userRole === "admin" && (
                  <Link
                    href="/admin/dashboard"
                    className="text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-lg transition font-bold text-sm"
                  >
                    پنل مدیریت
                  </Link>
                )}
                {(userRole === "buyer" || userRole === "seller") && (
                  <Link
                    href="/account/completion"
                    className="text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-lg transition font-bold text-sm"
                  >
                    تکمیل اطلاعات
                  </Link>
                )}
                {userRole === "buyer" && (
                  <Link
                    href="/buyer/dashboard"
                    className="text-green-700 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg transition font-bold text-sm"
                  >
                    داشبورد من
                  </Link>
                )}
                {userRole === "seller" && (
                  <Link
                    href="/seller/dashboard"
                    className="text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition font-bold text-sm"
                  >
                    داشبورد فروشنده
                  </Link>
                )}
                {userRole === "seller" && previousUserRole === "buyer" && (
                  <button
                    onClick={switchBackToBuyerMode}
                    className="text-green-700 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg transition font-bold text-sm"
                  >
                    بازگشت به حالت خریدار
                  </button>
                )}
                {userRole === "buyer" && previousUserRole === "seller" && (
                  <button
                    onClick={switchBackToSellerMode}
                    className="text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition font-bold text-sm"
                  >
                    بازگشت به حالت فروشنده
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition font-bold text-sm flex items-center gap-1"
                >
                  خروج
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={rememberLoginReturnPath}
                  className="text-gray-700 hover:text-green-600 transition px-3 py-2 font-bold text-sm"
                >
                  ورود
                </Link>
                <Link
                  href="/register"
                  className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition font-bold text-sm"
                >
                  ثبت‌نام
                </Link>
              </>
            )}
          </div>

          {/* Mobile quick action buttons - visible like desktop */}
          <div className="mr-auto ml-1 flex items-center gap-1 md:hidden">
            {userRole ? (
              <Link
                href={`/${userRole === "admin" ? "admin" : userRole}/dashboard`}
                className="rounded-lg bg-[#003b5c] px-3 py-2 text-xs font-bold text-white shadow-sm"
              >
                داشبورد
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={rememberLoginReturnPath}
                  className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 shadow-sm"
                >
                  ورود
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm"
                >
                  ثبت‌نام
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-lg border border-gray-200 p-2 text-gray-700"
            aria-label="باز کردن منوی موبایل"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-3 space-y-reverse">
              <Link
                href="/requests"
                className="text-gray-700 hover:text-green-600 transition py-2 font-bold"
              >
                📋 درخواست‌های خرید
              </Link>
              <Link
                href="/request-board"
                className="text-gray-700 hover:text-green-600 transition py-2 font-bold"
              >
                🧭 تابلوی آگهی‌ها
              </Link>
              <Link
                href="/request-purchase"
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition text-center font-bold"
              >
                ثبت درخواست خرید جدید
              </Link>
              <Link
                href="/sellers"
                className="text-gray-700 hover:text-green-600 transition py-2"
              >
                🏪 فروشندگان
              </Link>
              <Link
                href="/buyers"
                className="text-gray-700 hover:text-green-600 transition py-2"
              >
                🧾 خریداران
              </Link>
              <Link
                href="/categories"
                className="text-gray-700 hover:text-green-600 transition py-2"
              >
                📂 دسته‌بندی‌ها
              </Link>
              <Link
                href="/external-link"
                className="text-[#003b5c] bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition font-bold"
              >
                🌐 لینک خارجی arena.site
              </Link>
              <div className="border-t border-gray-200 pt-3 flex flex-col gap-2">
                <Link
                  href="/buyer/dashboard"
                  className="text-green-700 font-bold bg-green-50 px-2 py-1 rounded hover:bg-green-100 transition flex items-center gap-2"
                >
                  <span>👤</span> داشبورد خریدار
                </Link>
                <Link
                  href="/seller/dashboard"
                  className="text-gray-700 hover:text-green-600 transition flex items-center gap-2"
                >
                  <span>💼</span> داشبورد فروشنده
                </Link>
                <Link
                  href="/seller/sales"
                  className="text-gray-700 hover:text-green-600 transition flex items-center gap-2"
                >
                  <span>💰</span> فروش‌های من (فروشنده)
                </Link>
                {(userRole === "buyer" || userRole === "seller") && (
                  <Link
                    href="/account/completion"
                    className="text-amber-700 bg-amber-50 px-2 py-1 rounded hover:bg-amber-100 transition flex items-center gap-2"
                  >
                    <span>🧩</span> تکمیل اطلاعات حساب
                  </Link>
                )}
                <Link
                  href="/admin/dashboard"
                  className="text-purple-700 bg-purple-50 px-2 py-1 rounded hover:bg-purple-100 transition flex items-center gap-2 mt-1"
                >
                  <span>👑</span> پنل مدیریت پلتفرم (ادمین)
                </Link>
              </div>
              {userRole ? (
                <div className="flex flex-col gap-2 pt-2 border-t">
                  <div className="text-center text-sm font-bold text-gray-500 mb-2">
                    {userRole === "admin"
                      ? "شما ادمین هستید"
                      : userRole === "seller"
                        ? "شما فروشنده هستید"
                        : "شما خریدار هستید"}
                  </div>
                  {userRole === "seller" && previousUserRole === "buyer" && (
                    <button
                      onClick={switchBackToBuyerMode}
                      className="w-full text-center border border-green-200 bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition font-bold"
                    >
                      بازگشت به حالت خریدار
                    </button>
                  )}
                  {userRole === "buyer" && previousUserRole === "seller" && (
                    <button
                      onClick={switchBackToSellerMode}
                      className="w-full text-center border border-blue-200 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition font-bold"
                    >
                      بازگشت به حالت فروشنده
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-center border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition font-bold"
                  >
                    خروج از حساب
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 pt-2 border-t">
                  <Link
                    href="/login"
                    onClick={rememberLoginReturnPath}
                    className="flex-1 text-center border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition font-bold"
                  >
                    ورود
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 text-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-bold"
                  >
                    ثبت‌نام
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      {showMobileAuthDock && (
        <div className="fixed inset-x-3 bottom-3 z-[60] grid grid-cols-2 gap-2 rounded-2xl border border-gray-200 bg-white/95 p-2 shadow-2xl backdrop-blur md:hidden">
          <Link
            href="/login"
            onClick={rememberLoginReturnPath}
            className="rounded-xl border border-gray-300 px-4 py-3 text-center text-sm font-extrabold text-gray-800"
          >
            ورود
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-extrabold text-white"
          >
            ثبت‌نام
          </Link>
        </div>
      )}
    </header>
  );
}
