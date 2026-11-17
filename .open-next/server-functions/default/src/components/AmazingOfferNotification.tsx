"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductHeroImage } from "@/components/ProductImages";
import type { AmazingDealItem } from "@/components/AmazingDealsSection";

export type AmazingNotificationSettings = {
  enabled: boolean;
  title: string;
  text: string;
  discountCode: string;
};

export default function AmazingOfferNotification({
  deal,
  settings,
}: {
  deal?: AmazingDealItem;
  settings: AmazingNotificationSettings;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!settings.enabled || !deal) return;
    const today = new Date().toISOString().slice(0, 10);
    const key = `optibid:amazing-popup:${settings.discountCode || "OPTIBID"}:${today}`;
    if (localStorage.getItem(key)) return;
    const timer = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, [deal, settings.discountCode, settings.enabled]);

  if (!open || !deal) return null;

  const close = () => {
    const today = new Date().toISOString().slice(0, 10);
    const key = `optibid:amazing-popup:${settings.discountCode || "OPTIBID"}:${today}`;
    localStorage.setItem(key, "1");
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/55 p-4 backdrop-blur-sm" dir="rtl">
      <div className="w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="bg-gradient-to-l from-rose-600 to-orange-500 p-5 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                کد کمپین: {settings.discountCode || "OPTIBID"}
              </span>
              <h2 className="mt-3 text-2xl font-black">
                {settings.title || "فرصت ویژه درخواست خرید"}
              </h2>
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-full bg-white/20 px-3 py-1 text-xl font-black hover:bg-white/30"
            >
              ×
            </button>
          </div>
        </div>
        <div className="p-5 text-center">
          <ProductHeroImage
            images={deal.productImages}
            title={deal.title}
            category={deal.category}
            className="mx-auto h-36 w-36 rounded-2xl"
          />
          <div className="mx-auto mt-4 w-fit rounded-full bg-rose-50 px-4 py-2 text-sm font-black text-rose-700">
            امتیاز جذابیت درخواست: {deal.opportunityScore.toLocaleString("fa-IR")} از ۱۰۰
          </div>
          <h3 className="mt-4 text-xl font-black text-gray-900">{deal.title}</h3>
          <p className="mt-2 leading-7 text-gray-600">
            {settings.text || "درخواست‌های خرید با بودجه جذاب و کمبود پیشنهاد فروشنده را سریع‌تر بررسی کنید."}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={close}
              className="rounded-xl bg-gray-100 px-4 py-3 font-bold text-gray-700 hover:bg-gray-200"
            >
              متوجه شدم
            </button>
            <Link
              href={`/requests/${deal.id}`}
              onClick={close}
              className="rounded-xl bg-orange-500 px-4 py-3 font-bold text-white hover:bg-orange-600"
            >
              مشاهده آگهی
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
