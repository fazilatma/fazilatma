"use client";

import { useEffect } from "react";

const STORAGE_KEY = "optibidAdminToken";

/**
 * پل ورود ادمین در محیط پیش‌نمایش.
 *
 * اگر کوکی نشست در iframe ذخیره نشود، توکن موجود در آدرس
 * (`/admin/dashboard?at=...`) را نگه می‌دارد و به همهٔ درخواست‌های
 * `/api/admin/*` به صورت هدر اضافه می‌کند تا پنل بدون کوکی هم کار کند.
 * در production هیچ توکنی وجود ندارد و این کامپوننت کاری نمی‌کند.
 */
export default function AdminPreviewTokenBridge() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("at");
    let token = fromUrl || "";

    if (fromUrl) {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, fromUrl);
      } catch {
        // دسترسی به sessionStorage همیشه ممکن نیست.
      }
      url.searchParams.delete("at");
      window.history.replaceState({}, "", url.toString());
    } else {
      try {
        token = window.sessionStorage.getItem(STORAGE_KEY) || "";
      } catch {
        token = "";
      }
    }

    if (!token) return;

    const originalFetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const target =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : String(input);

      if (target.includes("/api/admin")) {
        const headers = new Headers(
          init?.headers ?? (input instanceof Request ? input.headers : undefined),
        );
        headers.set("x-optibid-admin-token", token);
        return originalFetch(input, { ...init, headers });
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
