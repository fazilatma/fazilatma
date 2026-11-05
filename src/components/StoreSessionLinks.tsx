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

/**
 * بخش ورود/حساب کاربری هدر فروشگاه.
 *
 * هدر فروشگاه سمت سرور و ایستا رندر می‌شود، بنابراین همیشه «ورود» را نشان
 * می‌داد و کاربر بعد از ورود هیچ راهی به داشبورد/پنل ادمین نداشت. این کامپوننت
 * بعد از mount نقش ذخیره‌شده را می‌خواند و لینک‌های مناسب را نشان می‌دهد.
 */
export default function StoreSessionLinks({
  layout = "desktop",
}: {
  layout?: "desktop" | "mobile";
}) {
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    const sync = () => setRole(readRole());
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
    } catch {
      // دسترسی به storage همیشه ممکن نیست.
    }
    window.location.assign("/");
  };

  if (layout === "mobile") {
    if (!role) {
      return (
        <div className="grid gap-2">
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
        </div>
      );
    }

    return (
      <div className="grid gap-2">
        <Link
          href={role === "admin" ? "/admin/dashboard" : `/${role}/dashboard`}
          className="block rounded-2xl border border-[#003b5c]/20 bg-white px-4 py-3 text-center text-sm font-black text-[#003b5c]"
        >
          {role === "admin" ? "پنل مدیریت" : "داشبورد من"}
        </Link>
        <button
          type="button"
          onClick={logout}
          className="block w-full rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-center text-sm font-black text-rose-600"
        >
          خروج از حساب
        </button>
      </div>
    );
  }

  if (!role) {
    return (
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
    );
  }

  return (
    <>
      <Link
        href={role === "admin" ? "/admin/dashboard" : `/${role}/dashboard`}
        className="hidden rounded-2xl border border-[#003b5c]/20 bg-white px-4 py-2 text-sm font-black text-[#003b5c] shadow-sm transition hover:bg-blue-50 sm:inline-flex"
      >
        {role === "admin" ? "پنل مدیریت" : "داشبورد من"}
      </Link>
      <button
        type="button"
        onClick={logout}
        className="hidden rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2 text-sm font-black text-rose-600 shadow-sm transition hover:bg-rose-100 sm:inline-flex"
      >
        خروج
      </button>
    </>
  );
}
