"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SellerOfferActionProps = {
  requestId: number;
  requestBuyerId: number;
  requestCategory: string;
  requestStatus: string;
  sellerOffers: Array<{
    sellerId: number;
    status: "pending" | "accepted" | "rejected";
  }>;
};

export default function SellerOfferAction({
  requestId,
  requestBuyerId,
  requestCategory,
  requestStatus,
  sellerOffers,
}: SellerOfferActionProps) {
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState(0);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem("userRole"));
    setUserId(Number(localStorage.getItem("userId") || 0));
  }, []);

  const existingOffer = useMemo(
    () => sellerOffers.find((offer) => offer.sellerId === userId),
    [sellerOffers, userId],
  );

  const isOwnRequest = Boolean(userId && userId === requestBuyerId);
  const isOpen = requestStatus === "open";

  const switchBuyerToSeller = async () => {
    if (!userId) {
      sessionStorage.setItem("redirectAfterAuth", `/requests/${requestId}`);
      window.location.href = "/login";
      return;
    }
    if (isOwnRequest) {
      alert("روی درخواست خرید خودتان نمی‌توانید پیشنهاد فروشنده ثبت کنید.");
      return;
    }
    const ok = confirm(
      "می‌خواهید برای این درخواست وارد حالت فروشنده شوید؟ حساب خریدار شما باقی می‌ماند و فقط امکان ثبت پیشنهاد فروشنده فعال می‌شود.",
    );
    if (!ok) return;

    setSwitching(true);
    try {
      const response = await fetch("/api/account/seller-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, requestId, category: requestCategory }),
      });
      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || "فعال‌سازی حالت فروشنده ناموفق بود.");
      localStorage.setItem("previousUserRole", role || "buyer");
      localStorage.setItem("userRole", "seller");
      alert(result.message);
      window.location.href = result.nextUrl || `/requests/${requestId}/offer`;
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "فعال‌سازی حالت فروشنده ناموفق بود.",
      );
    } finally {
      setSwitching(false);
    }
  };

  if (!isOpen) {
    return (
      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-[#003b5c]">اقدام فروشنده</h2>
        <p className="mt-2 text-sm leading-7 text-gray-500">
          این درخواست دیگر باز نیست و امکان ثبت پیشنهاد جدید وجود ندارد.
        </p>
      </section>
    );
  }

  if (role === "admin") {
    return (
      <section className="rounded-3xl border border-purple-100 bg-purple-50 p-5 shadow-sm">
        <h2 className="font-bold text-purple-800">اقدام فروشنده</h2>
        <p className="mt-2 text-sm leading-7 text-purple-700">
          ادمین برای ثبت پیشنهاد باید با حساب خریدار/فروشنده جداگانه وارد شود.
        </p>
      </section>
    );
  }

  if (isOwnRequest && (role === "seller" || role === "buyer")) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <h2 className="font-bold text-amber-900">اقدام فروشنده</h2>
        <p className="mt-2 text-sm leading-7 text-amber-800">
          این درخواست توسط خود شما ثبت شده است؛ برای جلوگیری از تضاد منافع،
          نمی‌توانید روی درخواست خودتان پیشنهاد فروشنده ثبت کنید.
        </p>
      </section>
    );
  }

  if (role === "seller") {
    return (
      <section className="rounded-3xl border border-green-200 bg-green-50 p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="font-bold text-green-900">
              ثبت پیشنهاد فروشنده بعد از مطالعه درخواست
            </h2>
            <p className="mt-2 text-sm leading-7 text-green-800">
              فرم قیمت داخل همین صفحه باز نمی‌شود؛ برای جلوگیری از خطا، قیمت،
              عکس و مشخصات کامل کالای پیشنهادی در صفحه جداگانه ثبت می‌شود.
            </p>
          </div>
          <Link
            href={`/requests/${requestId}/offer`}
            className="shrink-0 rounded-xl bg-[#0b9c56] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-green-700"
          >
            {existingOffer
              ? "ویرایش پیشنهاد و مشخصات کالا"
              : "ثبت پیشنهاد قیمت و مشخصات کالا"}
          </Link>
        </div>
      </section>
    );
  }

  if (role === "buyer") {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="font-bold text-amber-900">
              می‌خواهید برای این درخواست قیمت بدهید؟
            </h2>
            <p className="mt-2 text-sm leading-7 text-amber-800">
              می‌توانید بدون حذف حساب خریدار، حالت فروشنده را فعال کنید و برای
              درخواست‌های دیگران قیمت، عکس و مشخصات کامل کالا ثبت کنید.
            </p>
          </div>
          <button
            type="button"
            disabled={switching}
            onClick={switchBuyerToSeller}
            className="shrink-0 rounded-xl bg-amber-500 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-amber-600 disabled:bg-gray-300"
          >
            {switching
              ? "در حال تغییر حالت..."
              : "ورود به حالت فروشنده و ثبت پیشنهاد"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-bold text-[#003b5c]">فروشنده هستید؟</h2>
          <p className="mt-2 text-sm leading-7 text-blue-800">
            بعد از ورود، می‌توانید برای این درخواست قیمت بدهید و فرم مشخصات کامل
            کالای پیشنهادی را پر کنید.
          </p>
        </div>
        <Link
          href="/login"
          onClick={() =>
            sessionStorage.setItem(
              "redirectAfterAuth",
              `/requests/${requestId}`,
            )
          }
          className="shrink-0 rounded-xl bg-[#003b5c] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#002d46]"
        >
          ورود برای ثبت پیشنهاد
        </Link>
      </div>
    </section>
  );
}
