"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type OfferActionProps = {
  offerId: number;
  offerAmount: string;
  offerSellerName: string;
  offerStatus: "pending" | "accepted" | "rejected";
  offerSellerId: number;
  requestBuyerId: number;
  hasProductSpecs: boolean;
  productSpecs?: any;
  defaultShippingAddress?: string;
};

const money = (value: string | number) =>
  `${Number(String(value).replace(/\D/g, "") || 0).toLocaleString("fa-IR")} تومان`;

export default function OfferAction({
  offerId,
  offerAmount,
  offerSellerName,
  offerStatus,
  offerSellerId,
  requestBuyerId,
  hasProductSpecs,
  productSpecs,
  defaultShippingAddress = "",
}: OfferActionProps) {
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [shippingAddress, setShippingAddress] = useState(
    defaultShippingAddress,
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "wallet" | "zarinpal" | "gateway"
  >("gateway");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem("userRole"));
    setUserId(Number(localStorage.getItem("userId") || 0));
    setShippingAddress(defaultShippingAddress || "");
  }, [defaultShippingAddress]);

  const chooseAndPay = async () => {
    if (!confirmed) {
      alert("قبل از پرداخت، مشخصات کالای پیشنهادی فروشنده را تایید کنید.");
      return;
    }
    if (!shippingAddress.trim()) {
      alert("برای پرداخت، نشانی تحویل کالا را وارد کنید.");
      return;
    }
    setSubmitting(true);
    try {
      const selectResponse = await fetch("/api/orders/select-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: userId,
          offerId,
          useAlternateAddress: true,
          shippingAddress,
          buyerConfirmedProductSpecs: true,
        }),
      });
      const selectResult = await selectResponse.json();
      if (!selectResult.success)
        throw new Error(selectResult.message || "انتخاب پیشنهاد ناموفق بود.");

      const payResponse = await fetch("/api/orders/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: userId,
          orderId: selectResult.order.id,
          paymentMethod,
        }),
      });
      const payResult = await payResponse.json();
      if (!payResult.success) {
        alert(
          `${payResult.message || "پرداخت انجام نشد."}\nسفارش انتخاب شد و در داشبورد خریدار آماده پرداخت است.`,
        );
        window.location.assign("/buyer/dashboard");
        return;
      }
      if (payResult.redirectUrl) {
        window.location.assign(payResult.redirectUrl);
        return;
      }
      alert(payResult.message || "پیشنهاد انتخاب و پرداخت ثبت شد.");
      window.location.assign("/buyer/dashboard");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "انتخاب پیشنهاد یا پرداخت ناموفق بود.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasProductSpecs) {
    return (
      <span className="mt-3 inline-block rounded-xl bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700">
        فروشنده باید مشخصات کامل کالا را ثبت کند تا خریدار بتواند انتخاب و
        پرداخت کند
      </span>
    );
  }

  if (offerStatus === "accepted") {
    return (
      <span className="mt-3 inline-block rounded-xl bg-green-50 px-4 py-2 text-xs font-bold text-green-700">
        این پیشنهاد انتخاب شده است
      </span>
    );
  }

  if (offerStatus === "rejected") {
    return (
      <span className="mt-3 inline-block rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-500">
        این پیشنهاد رد شده است
      </span>
    );
  }

  if (!role) {
    return (
      <Link
        href="/login"
        onClick={() => {
          sessionStorage.setItem("redirectAfterAuth", window.location.pathname);
        }}
        className="mt-3 inline-block rounded-xl bg-[#003b5c] px-4 py-2 text-sm font-bold text-white"
      >
        ورود برای انتخاب پیشنهاد و پرداخت
      </Link>
    );
  }

  if (role === "buyer") {
    if (userId === requestBuyerId) {
      return (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 inline-block rounded-xl bg-[#0b9c56] px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700"
          >
            انتخاب پیشنهاد و پرداخت
          </button>
          {open && (
            <div
              className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
              dir="rtl"
            >
              <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 text-right shadow-2xl">
                <div className="mb-5 flex items-start justify-between gap-4 border-b pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#003b5c]">
                      انتخاب پیشنهاد و پرداخت امانی
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      فروشنده: {offerSellerName} · مبلغ: {money(offerAmount)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-gray-100 px-3 py-1 font-bold text-gray-500"
                  >
                    ×
                  </button>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-7 text-blue-900">
                  <p className="font-bold">مشخصات کلیدی کالای پیشنهادی</p>
                  <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                    <span>
                      برند/مدل:{" "}
                      <b>
                        {productSpecs?.brand || "—"}{" "}
                        {productSpecs?.exactModel || ""}
                      </b>
                    </span>
                    <span>
                      کانفیگ:{" "}
                      <b>
                        {productSpecs?.cpu || "—"} · {productSpecs?.ram || "—"}{" "}
                        · {productSpecs?.storage || "—"}
                      </b>
                    </span>
                    <span>
                      وضعیت: <b>{productSpecs?.productCondition || "—"}</b>
                    </span>
                    <span>
                      مهلت تست:{" "}
                      <b>
                        {productSpecs?.testDeadlineDays
                          ? `${productSpecs.testDeadlineDays} روز`
                          : "—"}
                      </b>
                    </span>
                  </div>
                </div>

                <label className="mt-4 block text-sm font-bold text-gray-700">
                  نشانی تحویل کالا
                  <textarea
                    value={shippingAddress}
                    onChange={(event) => setShippingAddress(event.target.value)}
                    className="mt-2 min-h-24 w-full rounded-xl border p-3 font-normal outline-none focus:border-[#00a8e8]"
                    placeholder="نشانی کامل تحویل را وارد کنید"
                  />
                </label>

                <label className="mt-4 block text-sm font-bold text-gray-700">
                  روش پرداخت
                  <select
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target.value as "wallet" | "zarinpal" | "gateway",
                      )
                    }
                    className="mt-2 w-full rounded-xl border bg-white p-3 font-normal outline-none focus:border-[#00a8e8]"
                  >
                    <option value="gateway">پرداخت اینترنتی آزمایشی</option>
                    <option value="wallet">پرداخت از کیف پول</option>
                    <option value="zarinpal">زرین‌پال</option>
                  </select>
                </label>

                <label className="mt-4 flex items-start gap-2 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-800">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                    className="mt-1"
                  />
                  مشخصات کالای پیشنهادی فروشنده را بررسی کردم و تایید می‌کنم؛
                  بعد از پرداخت، وجه تا تایید دریافت کالا نزد پلتفرم امانی
                  می‌ماند.
                </label>

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-xl bg-gray-100 px-4 py-3 font-bold text-gray-700"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    disabled={submitting || !confirmed}
                    onClick={chooseAndPay}
                    className="flex-[2] rounded-xl bg-[#0b9c56] px-4 py-3 font-bold text-white disabled:bg-gray-300"
                  >
                    {submitting ? "در حال ثبت..." : "تایید، انتخاب و پرداخت"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      );
    }

    return (
      <span className="mt-3 inline-block rounded-xl bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700">
        فقط خریدار صاحب این درخواست می‌تواند پیشنهاد را انتخاب و پرداخت کند
      </span>
    );
  }

  if (role === "seller") {
    if (userId === offerSellerId) {
      return (
        <Link
          href="/seller/dashboard"
          className="mt-3 inline-block rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-[#00a8e8]"
        >
          پیشنهاد شما ثبت شده؛ مدیریت در داشبورد فروشنده
        </Link>
      );
    }

    return (
      <span className="mt-3 inline-block rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600">
        انتخاب و پرداخت فقط توسط خریدار صاحب درخواست انجام می‌شود
      </span>
    );
  }

  return (
    <span className="mt-3 inline-block rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600">
      این اقدام فقط برای خریدار صاحب درخواست فعال است
    </span>
  );
}
