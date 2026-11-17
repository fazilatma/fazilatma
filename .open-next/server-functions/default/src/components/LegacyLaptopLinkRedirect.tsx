"use client";

import { useEffect } from "react";

/**
 * لینک‌های قدیمی منوی «لپ‌تاپ» به‌صورت `/shop#laptop-menu` بودند؛ چون fragment
 * به سرور نمی‌رسد، صفحه کل کاتالوگ را نشان می‌داد. این کامپوننت همان لینک‌های
 * قدیمی (بوکمارک‌ها و صفحات کش‌شده) را به آدرس درست دستهٔ لپ‌تاپ هدایت می‌کند.
 */
export default function LegacyLaptopLinkRedirect() {
  useEffect(() => {
    if (window.location.hash.replace(/^#/, "").trim() !== "laptop-menu") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("category")) return;
    params.set("category", "laptop");
    window.location.replace(`/shop?${params.toString()}#all-laptops`);
  }, []);

  return null;
}
