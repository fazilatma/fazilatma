"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * اصلاح سریع قیمت از داخل صفحهٔ محصول (فقط برای مدیر).
 * کمترین قیمت بازار را می‌گیرد، در ضریب همان کالا ضرب می‌کند و قیمت را برای
 * همهٔ صفحات ثبت می‌کند.
 */
export default function AdminQuickPriceFix({
  productId,
  marketPrice,
  multiplier,
  price,
}: {
  productId: string;
  marketPrice: number;
  multiplier: number;
  price: number;
}) {
  const router = useRouter();
  const [reference, setReference] = useState(marketPrice ? String(marketPrice) : "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const preview = (() => {
    const value = Number(String(reference).replace(/[^\d]/g, ""));
    if (!value || !multiplier) return 0;
    return Math.round((value * multiplier) / 10000) * 10000;
  })();

  const run = async () => {
    const value = Number(String(reference).replace(/[^\d]/g, ""));
    if (!value) {
      setMessage("کمترین قیمت بازار را وارد کنید.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/store-products/market-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, marketPrice: value }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setMessage(result?.message || "ثبت ناموفق بود.");
        return;
      }
      setMessage(result.message || "ثبت شد.");
      router.refresh();
    } catch {
      setMessage("ارتباط با سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-dashed border-purple-300 bg-purple-50/70 p-3 text-right" dir="rtl">
      <p className="text-[11px] font-black text-purple-900">
        اصلاح سریع قیمت (مدیر) — قیمت فعلی {price.toLocaleString("fa-IR")} · ضریب {multiplier.toLocaleString("fa-IR")}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="کمترین قیمت بازار (تومان)"
          inputMode="numeric"
          className="w-44 rounded-lg border border-purple-200 bg-white px-2 py-1.5 text-[11px] font-bold text-gray-800 outline-none focus:border-purple-400"
        />
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy}
          className="rounded-lg bg-purple-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {busy ? "در حال ثبت…" : "اعمال با ضریب"}
        </button>
        {preview > 0 && (
          <span className="text-[11px] font-bold text-purple-800">
            قیمت جدید: {preview.toLocaleString("fa-IR")} تومان
          </span>
        )}
      </div>
      {message && <p className="mt-1 text-[11px] font-bold text-emerald-700">{message}</p>}
    </div>
  );
}
