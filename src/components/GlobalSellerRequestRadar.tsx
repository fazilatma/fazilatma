"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type SellerRadarRequest = {
  id: number;
  title: string;
  description?: string;
  category: string;
  budget: string;
  quantity: number;
  buyerName: string;
  offersCount: number;
  sellerRadarScore?: number;
};

const money = (value: string | number) =>
  `${Number(String(value).replace(/\D/g, "") || 0).toLocaleString("fa-IR")} تومان`;

export default function GlobalSellerRequestRadar() {
  const pathname = usePathname();
  const [sellerId, setSellerId] = useState(0);
  const [requests, setRequests] = useState<SellerRadarRequest[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null);

  const shouldHideOnThisPage = pathname?.startsWith("/seller/dashboard");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const id = Number(localStorage.getItem("userId") || 0);
    if (role === "seller" && id) setSellerId(id);
  }, []);

  const loadRequests = useCallback(async () => {
    if (!sellerId || shouldHideOnThisPage) return;
    try {
      const response = await fetch(
        `/api/seller-matching-requests?sellerId=${sellerId}&limit=10`,
        { cache: "no-store" },
      );
      const result = await response.json();
      if (result.success && Array.isArray(result.requests)) {
        setRequests(result.requests);
        setActiveIndex((index) =>
          result.requests.length ? Math.min(index, result.requests.length - 1) : 0,
        );
      }
    } catch {
      // اعلان شناور نباید تجربه کاربر را با خطای شبکه قطع کند.
    }
  }, [sellerId, shouldHideOnThisPage]);

  useEffect(() => {
    if (!sellerId || shouldHideOnThisPage) return;
    void loadRequests();
    const interval = window.setInterval(() => void loadRequests(), 25000);
    return () => window.clearInterval(interval);
  }, [sellerId, shouldHideOnThisPage, loadRequests]);

  const activeRequest = useMemo(
    () => requests[activeIndex] || requests[0] || null,
    [requests, activeIndex],
  );

  const rejectActiveRequest = async () => {
    if (!activeRequest || busyRequestId) return;
    setBusyRequestId(activeRequest.id);
    try {
      await fetch("/api/seller-request-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId,
          requestId: activeRequest.id,
          action: "rejected",
        }),
      });
    } catch {
      // حتی اگر ثبت رد به‌صورت موقت ناموفق بود، کارت از اعلان فعلی حذف شود.
    } finally {
      setRequests((items) => items.filter((item) => item.id !== activeRequest.id));
      setActiveIndex(0);
      setBusyRequestId(null);
    }
  };

  if (!sellerId || shouldHideOnThisPage || requests.length === 0 || !activeRequest) {
    return null;
  }

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-[70] flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-800 shadow-2xl ring-4 ring-emerald-100/60 transition hover:-translate-y-0.5"
        dir="rtl"
        aria-label="باز کردن رادار درخواست‌های فروشنده"
      >
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-600" />
        </span>
        {requests.length.toLocaleString("fa-IR")} درخواست مرتبط
      </button>
    );
  }

  return (
    <aside
      className="fixed bottom-4 right-4 z-[70] w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-[1.75rem] border border-emerald-200 bg-white shadow-2xl ring-4 ring-emerald-100/50"
      dir="rtl"
    >
      <div className="bg-gradient-to-l from-[#003b5c] via-[#006494] to-[#0b9c56] p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-black text-emerald-100">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-300 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-lime-300" />
              </span>
              رادار زنده درخواست کالا
            </div>
            <h2 className="mt-2 text-lg font-black leading-8">
              {requests.length.toLocaleString("fa-IR")} درخواست مطابق حوزه کاری شما
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="rounded-full bg-white/15 px-3 py-1 text-lg font-black hover:bg-white/25"
            aria-label="کوچک کردن اعلان"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
            اولویت {Number(activeRequest.sellerRadarScore || 0).toLocaleString("fa-IR")}
          </span>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            {activeRequest.category}
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            {activeRequest.offersCount.toLocaleString("fa-IR")} پیشنهاد
          </span>
        </div>
        <h3 className="line-clamp-2 text-base font-black text-[#003b5c]">
          {activeRequest.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-600">
          {activeRequest.description || "توضیحی ثبت نشده است."}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-2xl bg-slate-50 p-3">
            <span className="text-slate-500">بودجه خریدار</span>
            <b className="mt-1 block text-emerald-700">{money(activeRequest.budget)}</b>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <span className="text-slate-500">تعداد / خریدار</span>
            <b className="mt-1 block text-[#003b5c]">
              {activeRequest.quantity.toLocaleString("fa-IR")} عدد · {activeRequest.buyerName}
            </b>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={rejectActiveRequest}
            disabled={Boolean(busyRequestId)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
          >
            رد و بعدی
          </button>
          <Link
            href={`/requests/${activeRequest.id}/offer`}
            className="flex-1 rounded-xl bg-[#0b9c56] px-4 py-3 text-center text-sm font-black text-white transition hover:bg-emerald-700"
          >
            ثبت پیشنهاد سریع
          </Link>
          <Link
            href="/seller/dashboard?tab=requests&openRadar=1"
            className="rounded-xl bg-[#003b5c] px-4 py-3 text-center text-sm font-black text-white transition hover:bg-[#002d46]"
          >
            رادار کامل
          </Link>
        </div>

        {requests.length > 1 && (
          <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
            <button
              type="button"
              onClick={() =>
                setActiveIndex((index) =>
                  index <= 0 ? requests.length - 1 : index - 1,
                )
              }
              className="rounded-full bg-slate-100 px-3 py-1 text-lg font-black text-slate-700"
              aria-label="درخواست قبلی"
            >
              ›
            </button>
            <span className="text-xs font-bold text-slate-500">
              {Number(activeIndex + 1).toLocaleString("fa-IR")} از {requests.length.toLocaleString("fa-IR")}
            </span>
            <button
              type="button"
              onClick={() =>
                setActiveIndex((index) =>
                  index >= requests.length - 1 ? 0 : index + 1,
                )
              }
              className="rounded-full bg-slate-100 px-3 py-1 text-lg font-black text-slate-700"
              aria-label="درخواست بعدی"
            >
              ‹
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
