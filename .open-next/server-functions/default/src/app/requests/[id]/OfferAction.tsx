"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OfferActionProps = {
  offerStatus: "pending" | "accepted" | "rejected";
  offerSellerId: number;
  requestBuyerId: number;
};

export default function OfferAction({ offerStatus, offerSellerId, requestBuyerId }: OfferActionProps) {
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<number>(0);

  useEffect(() => {
    setRole(localStorage.getItem("userRole"));
    setUserId(Number(localStorage.getItem("userId") || 0));
  }, []);

  if (offerStatus === "accepted") {
    return <span className="mt-3 inline-block rounded-xl bg-green-50 px-4 py-2 text-xs font-bold text-green-700">این پیشنهاد انتخاب شده است</span>;
  }

  if (offerStatus === "rejected") {
    return <span className="mt-3 inline-block rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-500">این پیشنهاد رد شده است</span>;
  }

  if (!role) {
    return (
      <Link
        href="/login"
        onClick={() => {
          sessionStorage.setItem("redirectAfterAuth", "/buyer/dashboard");
        }}
        className="mt-3 inline-block rounded-xl bg-[#003b5c] px-4 py-2 text-sm font-bold text-white"
      >
        ورود خریدار برای انتخاب پیشنهاد
      </Link>
    );
  }

  if (role === "buyer") {
    if (userId === requestBuyerId) {
      return (
        <Link href="/buyer/dashboard" className="mt-3 inline-block rounded-xl bg-[#003b5c] px-4 py-2 text-sm font-bold text-white">
          انتخاب این پیشنهاد از داشبورد من
        </Link>
      );
    }

    return (
      <span className="mt-3 inline-block rounded-xl bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700">
        فقط خریدار صاحب این درخواست می‌تواند پیشنهاد را انتخاب کند
      </span>
    );
  }

  if (role === "seller") {
    if (userId === offerSellerId) {
      return (
        <Link href="/seller/dashboard" className="mt-3 inline-block rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-[#00a8e8]">
          پیشنهاد شما ثبت شده؛ مدیریت در داشبورد فروشنده
        </Link>
      );
    }

    return (
      <span className="mt-3 inline-block rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600">
        انتخاب پیشنهاد فقط توسط خریدار انجام می‌شود
      </span>
    );
  }

  return (
    <span className="mt-3 inline-block rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600">
      این اقدام فقط برای خریدار صاحب درخواست فعال است
    </span>
  );
}
