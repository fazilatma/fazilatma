"use client";

import { useState } from "react";
import type { ProductValuationFactors } from "@/lib/request-valuation";
import { RequestSpecsDetails } from "@/components/RequestSpecsDetails";

export default function RequestSpecsModalButton({
  title,
  description,
  factors,
  className = "rounded-lg border border-gray-200 px-3 py-2 text-center text-xs font-bold text-gray-700 hover:bg-gray-50",
  label = "ریز مشخصات درخواست خرید",
}: {
  title: string;
  description?: string;
  factors?: Partial<ProductValuationFactors> | null;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[120] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          dir="rtl"
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 text-right shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#00a8e8]">
                  ریز مشخصات درخواست خرید
                </span>
                <h2 className="mt-3 text-xl font-bold text-[#003b5c]">
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-gray-100 px-3 py-1 text-lg font-bold text-gray-500 hover:bg-gray-200"
              >
                ×
              </button>
            </div>
            <RequestSpecsDetails
              factors={factors}
              description={description}
              dense
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-xl bg-[#003b5c] px-4 py-3 font-bold text-white hover:bg-[#002d46]"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </>
  );
}
