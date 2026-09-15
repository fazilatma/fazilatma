"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductHeroImage } from "@/components/ProductImages";
import type { ProductImageAttachment } from "@/lib/product-image-shared";

export type AmazingDealItem = {
  id: number;
  title: string;
  category: string;
  budget: string;
  opportunityScore: number;
  quantity: number;
  offers: number;
  productImages?: ProductImageAttachment[];
};

export type AmazingDealsSettings = {
  enabled: boolean;
  durationHours: number;
  discountCode: string;
  title?: string;
  subtitle?: string;
};

function timeParts(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return [hours, minutes, seconds].map((value) =>
    value.toLocaleString("fa-IR", { minimumIntegerDigits: 2 }),
  );
}

export default function AmazingDealsSection({
  items,
  settings,
}: {
  items: AmazingDealItem[];
  settings: AmazingDealsSettings;
}) {
  const [remaining, setRemaining] = useState(
    Math.max(1, Math.round(settings.durationHours || 6)) * 3600,
  );

  useEffect(() => {
    const total = Math.max(1, Math.round(settings.durationHours || 6)) * 3600;
    const startedAt = Date.now();
    setRemaining(total);
    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setRemaining(Math.max(0, total - elapsed));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [settings.durationHours]);

  if (!settings.enabled || items.length === 0) return null;

  const [hours, minutes, seconds] = timeParts(remaining);

  return (
    <section className="bg-white py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-l from-rose-600 via-rose-500 to-orange-500 p-4 text-white shadow-lg">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🔥</span>
                <h2 className="text-2xl font-black md:text-3xl">
                  {settings.title || "درخواست‌های داغ فروشندگان"}
                </h2>
              </div>
              <p className="mt-2 text-sm text-rose-50">
                {settings.subtitle ||
                  "درخواست‌هایی با بودجه جذاب، تعداد بالاتر یا کمبود پیشنهاد فروشنده"}
              </p>
            </div>
            <div className="flex items-center gap-2" dir="ltr">
              {[hours, minutes, seconds].map((part, index) => (
                <span
                  key={`${part}-${index}`}
                  className="grid h-10 min-w-10 place-items-center rounded-xl bg-white px-2 text-lg font-black text-rose-700"
                >
                  {part}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {items.map((item) => (
              <Link
                href={`/requests/${item.id}`}
                key={item.id}
                className="group w-40 shrink-0 overflow-hidden rounded-2xl bg-white p-3 text-gray-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="relative">
                  <ProductHeroImage
                    images={item.productImages}
                    title={item.title}
                    category={item.category}
                    className="mx-auto h-24 w-24 rounded-xl"
                  />
                  <span className="absolute right-0 top-0 rounded-full bg-rose-600 px-2 py-1 text-[11px] font-black text-white">
                    امتیاز {item.opportunityScore.toLocaleString("fa-IR")}
                  </span>
                </div>
                <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-black leading-5">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm font-black text-[#0b9c56]">
                  {item.budget}
                </p>
                <p className="mt-1 text-[11px] text-gray-400">
                  {item.offers.toLocaleString("fa-IR")} پیشنهاد · تعداد {item.quantity.toLocaleString("fa-IR")}
                </p>
              </Link>
            ))}
            <Link
              href="/requests"
              className="grid w-32 shrink-0 place-items-center rounded-2xl bg-white/15 p-4 text-center text-sm font-black text-white ring-1 ring-white/30 transition hover:bg-white/25"
            >
              مشاهده همه
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
