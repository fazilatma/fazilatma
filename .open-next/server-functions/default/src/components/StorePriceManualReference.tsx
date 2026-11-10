"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * تعیین قیمت مرجع یک کالا با لینک ترب/دیجی‌کالا یا ورود دستی عدد قیمت.
 * قیمت فروشگاه = قیمت مرجع × ضریب همان کالا.
 */
export default function StorePriceManualReference() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [marketPrice, setMarketPrice] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"ok" | "error">("ok");

  const run = async () => {
    if (busy) return;
    if (!query.trim()) {
      setTone("error");
      setMessage("نام یا شناسهٔ کالا را وارد کنید.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/store-products/market-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          marketPrice: Number(String(marketPrice).replace(/[^\d]/g, "")) || 0,
          referenceUrl: referenceUrl.trim(),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setTone("error");
        setMessage(result?.message || "ثبت قیمت مرجع ناموفق بود.");
        return;
      }
      setTone("ok");
      setMessage(result.message || "قیمت به‌روزرسانی شد.");
      setMarketPrice("");
      setReferenceUrl("");
      router.refresh();
    } catch {
      setTone("error");
      setMessage("ارتباط با سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
      <p className="text-sm font-black text-sky-900">ثبت دستی قیمت مرجع بازار (برای کالاهای سرسخت)</p>
      <p className="mt-1 text-xs leading-6 text-sky-800">
        اگر استخراج خودکار برای کالایی قیمت پیدا نکرد، نام کالا و «کمترین قیمت بازار» یا لینک صفحهٔ ترب/دیجی‌کالا
        را اینجا بدهید؛ قیمت فروشگاه با ضریب همان کالا محاسبه و در همهٔ صفحات اعمال می‌شود.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="نام یا شناسهٔ کالا"
          className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-sky-400"
        />
        <input
          value={marketPrice}
          onChange={(event) => setMarketPrice(event.target.value)}
          placeholder="کمترین قیمت بازار (تومان)"
          inputMode="numeric"
          className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-sky-400"
        />
        <input
          value={referenceUrl}
          onChange={(event) => setReferenceUrl(event.target.value)}
          placeholder="یا لینک ترب/دیجی‌کالا"
          dir="ltr"
          className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-sky-400"
        />
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy}
          className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-black text-white transition hover:bg-sky-700 disabled:opacity-50"
        >
          {busy ? "در حال اعمال…" : "اعمال با ضریب"}
        </button>
      </div>
      {message && (
        <p className={`mt-2 text-[11px] font-bold ${tone === "ok" ? "text-emerald-700" : "text-rose-700"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
