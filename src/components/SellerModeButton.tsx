"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SellerModeButton({
  requestId,
  requestBuyerId,
  requestCategory,
  className = "rounded-lg bg-[#003b5c] px-3 py-2 text-center text-xs font-bold text-white transition hover:bg-[#002d46]",
  buyerLabel = "ورود به عنوان فروشنده",
  sellerLabel = "ورود به عنوان فروشنده",
}: {
  requestId: string | number;
  requestBuyerId?: number;
  requestCategory?: string;
  className?: string;
  buyerLabel?: string;
  sellerLabel?: string;
}) {
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState(0);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem("userRole"));
    setUserId(Number(localStorage.getItem("userId") || 0));
  }, []);

  const isOwnRequest = Boolean(userId && requestBuyerId && userId === requestBuyerId);
  if (role === "admin") return null;
  if (isOwnRequest) {
    return (
      <span className="rounded-lg bg-gray-100 px-3 py-2 text-center text-xs font-bold text-gray-500">
        آگهی خود شما
      </span>
    );
  }

  if (role === "seller") {
    return (
      <Link href={`/requests/${requestId}/offer`} className={className}>
        {sellerLabel}
      </Link>
    );
  }

  if (!role) {
    return (
      <Link
        href="/login"
        onClick={() =>
          sessionStorage.setItem("redirectAfterAuth", `/requests/${requestId}`)
        }
        className={className}
      >
        ورود برای ثبت پیشنهاد
      </Link>
    );
  }

  const switchToSeller = async () => {
    if (!userId) {
      sessionStorage.setItem("redirectAfterAuth", `/requests/${requestId}`);
      window.location.href = "/login";
      return;
    }
    if (isOwnRequest) return;

    setSwitching(true);
    try {
      const response = await fetch("/api/account/seller-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          requestId,
          category: requestCategory,
        }),
      });
      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || "فعال‌سازی حالت فروشنده ناموفق بود.");
      localStorage.setItem("previousUserRole", role);
      localStorage.setItem("userRole", "seller");
      window.location.href = result.nextUrl || `/requests/${requestId}/offer`;
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "فعال‌سازی حالت فروشنده ناموفق بود.",
      );
      setSwitching(false);
    }
  };

  return (
    <button
      type="button"
      onClick={switchToSeller}
      disabled={switching}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {switching ? "در حال ورود..." : buyerLabel}
    </button>
  );
}
