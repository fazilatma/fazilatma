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
  offerAmount,
  offerSellerName,
  offerStatus,
  offerSellerId,
  requestBuyerId,
  hasProductSpecs,
  productSpecs,
}: OfferActionProps) {
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<number>(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem("userRole"));
    setUserId(Number(localStorage.getItem("userId") || 0));
  }, []);

  if (!hasProductSpecs) {
    return (
      <span className="mt-3 inline-block rounded-xl bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700">
        فروشنده باید مشخصات کامل کالا را ثبت کند تا خریدار بتواند برای هماهنگی
        مستقیم تصمیم بگیرد
      </span>
    );
  }

  if (offerStatus === "accepted") {
    return (
      <span className="mt-3 inline-block rounded-xl bg-green-50 px-4 py-2 text-xs font-bold text-green-700">
        این پیشنهاد توسط خریدار برای هماهنگی انتخاب شده است
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
        ورود برای مشاهده پیشنهاد و هماهنگی
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
            مشاهده پیشنهاد و هماهنگی مستقیم
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
                      مشاهده پیشنهاد فروشنده و هماهنگی مستقیم
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      فروشنده: {offerSellerName} · مبلغ پیشنهادی:{" "}
                      {money(offerAmount)}
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
                        {productSpecs?.cpu || "—"} ·{" "}
                        {productSpecs?.cpuCores ? `${productSpecs.cpuCores} هسته · ` : ""}
                        {productSpecs?.ram || "—"} · {productSpecs?.storage || "—"}
                      </b>
                    </span>
                    <span>
                      نمایشگر:{" "}
                      <b>
                        {productSpecs?.display ||
                          [
                            productSpecs?.displaySizeInch
                              ? `${productSpecs.displaySizeInch} اینچ`
                              : "",
                            productSpecs?.refreshRateHz
                              ? `${productSpecs.refreshRateHz}Hz`
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" · ") ||
                          "—"}
                      </b>
                    </span>
                    <span>
                      وضعیت: <b>{productSpecs?.productCondition || "—"}</b>
                    </span>
                    <span>
                      سلامت قطعات:{" "}
                      <b>
                        {productSpecs?.partsHealthPercent
                          ? `${productSpecs.partsHealthPercent}٪`
                          : productSpecs?.partsHealth || "—"}
                      </b>
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

                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
                  <p className="font-bold">توجه حقوقی و مالی</p>
                  <p className="mt-2">
                    در مدل جدید، سایت فقط بستر ثبت درخواست و دریافت پیشنهاد است.
                    وجهی نزد سایت نگهداری نمی‌شود و پرداخت، تحویل، تست، مرجوعی و
                    مسئولیت معامله مستقیماً بین خریدار و فروشنده انجام می‌شود.
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-xl bg-gray-100 px-4 py-3 font-bold text-gray-700"
                  >
                    بستن
                  </button>
                  <Link
                    href={`/sellers/${offerSellerId}`}
                    className="flex-[2] rounded-xl bg-[#003b5c] px-4 py-3 text-center font-bold text-white"
                  >
                    مشاهده پروفایل فروشنده
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      );
    }

    return (
      <span className="mt-3 inline-block rounded-xl bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700">
        فقط خریدار صاحب این درخواست می‌تواند این پیشنهاد را برای هماهنگی مستقیم
        انتخاب کند
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
        هماهنگی با پیشنهاد فقط توسط خریدار صاحب درخواست انجام می‌شود
      </span>
    );
  }

  return (
    <span className="mt-3 inline-block rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600">
      این اقدام فقط برای خریدار صاحب درخواست فعال است
    </span>
  );
}
