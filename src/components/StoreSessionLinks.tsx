"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Role = "admin" | "buyer" | "seller" | null;

function readRole(): Role {
  try {
    const value = window.localStorage.getItem("userRole");
    return value === "admin" || value === "buyer" || value === "seller"
      ? value
      : null;
  } catch {
    return null;
  }
}

function readAdminToken() {
  try {
    return window.sessionStorage.getItem("optibidAdminToken") || "";
  } catch {
    return "";
  }
}

/**
 * بخش ورود/حساب کاربری هدر فروشگاه.
 *
 * هدر فروشگاه سمت سرور و ایستا رندر می‌شود و همیشه «ورود» را نشان می‌داد؛
 * در نتیجه کاربر بعد از ورود هیچ دکمه‌ای برای رفتن به داشبورد یا پنل ادمین
 * نداشت. این کامپوننت بعد از mount نقش ذخیره‌شده را می‌خواند و دکمهٔ مناسب را
 * نشان می‌دهد. برای ادمین، در صورت وجود توکن پیش‌نمایش، لینک پنل با همان توکن
 * ساخته می‌شود تا حتی وقتی کوکی در iframe ذخیره نشده باشد پنل باز شود.
 */
export default function StoreSessionLinks({
  layout = "desktop",
}: {
  layout?: "desktop" | "mobile";
}) {
  const [role, setRole] = useState<Role>(null);
  const [adminHref, setAdminHref] = useState("/admin/dashboard");

  useEffect(() => {
    const sync = () => {
      const nextRole = readRole();
      setRole(nextRole);
      const token = readAdminToken();
      setAdminHref(
        token
          ? `/admin/dashboard?at=${encodeURIComponent(token)}`
          : "/admin/dashboard",
      );
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" }).catch(() => undefined);
    try {
      window.localStorage.removeItem("userRole");
      window.localStorage.removeItem("userId");
      window.localStorage.removeItem("userDisplayName");
      window.localStorage.removeItem("previousUserRole");
      window.sessionStorage.removeItem("redirectAfterAuth");
      window.sessionStorage.removeItem("optibidAdminToken");
    } catch {
      // دسترسی به storage همیشه ممکن نیست.
    }
    window.location.assign("/");
  };

  const dashboardHref =
    role === "admin" ? adminHref : role ? `/${role}/dashboard` : "/login";
  const dashboardLabel = role === "admin" ? "پنل مدیریت" : "داشبورد من";

  if (layout === "mobile") {
    return (
      <div className="grid gap-2">
        {role ? (
          <>
            <Link
              href={dashboardHref}
              className="block rounded-2xl border border-[#003b5c]/20 bg-white px-4 py-3 text-center text-sm font-black text-[#003b5c]"
            >
              {dashboardLabel}
            </Link>
            <button
              type="button"
              onClick={logout}
              className="block w-full rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-center text-sm font-black text-rose-600"
            >
              خروج از حساب
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="block rounded-2xl border border-[#003b5c]/20 bg-white px-4 py-3 text-center text-sm font-black text-[#003b5c]"
            >
              ورود
            </Link>
            <Link
              href="/register"
              className="block rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center text-sm font-black text-emerald-700"
            >
              ثبت‌نام
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {role ? (
        <>
          <Link
            href={dashboardHref}
            className="hidden rounded-2xl border border-[#003b5c]/20 bg-white px-4 py-2 text-sm font-black text-[#003b5c] shadow-sm transition hover:bg-blue-50 sm:inline-flex"
          >
            {dashboardLabel}
          </Link>
          <button
            type="button"
            onClick={logout}
            className="hidden rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2 text-sm font-black text-rose-600 shadow-sm transition hover:bg-rose-100 sm:inline-flex"
          >
            خروج
          </button>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className="hidden rounded-2xl border border-[#003b5c]/20 bg-white px-4 py-2 text-sm font-black text-[#003b5c] shadow-sm transition hover:bg-blue-50 sm:inline-flex"
          >
            ورود
          </Link>
          <Link
            href="/register"
            className="hidden rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-100 sm:inline-flex"
          >
            ثبت‌نام
          </Link>
        </>
      )}
    </>
  );
}
