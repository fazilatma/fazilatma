"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * قیمت مرجع بازار یک کالا را دوباره از منابع (ترب/دیجی‌کالا) استخراج می‌کند و
 * قیمت فروشگاه را با ضریب همان کالا بازمحاسبه می‌کند.
 */
export default function StorePriceReferenceSync({
  productId,
  label = "به‌روزرسانی از مرجع",
}: {
  productId: string;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"ok" | "error">("ok");

  const run = async () => {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/store-products/refresh-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: [productId],
          references: ["torob", "digikala"],
          maxProducts: 1,
          onlyActive: false,
          updateGlobalMultiplier: false,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setTone("error");
        setMessage(result?.message || "استخراج قیمت مرجع ناموفق بود.");
        return;
      }
      const row = Array.isArray(result.results) ? result.results[0] : null;
      if (row?.status === "updated" || row?.status === "unchanged") {
        setTone("ok");
        setMessage(
          `قیمت مرجع ${Number(row.newPrice || 0).toLocaleString("fa-IR")} تومان شد.`,
        );
      } else {
        setTone("error");
        setMessage(row?.message || "قیمت قابل اعتمادی از منابع پیدا نشد.");
        return;
      }
      router.refresh();
    } catch {
      setTone("error");
      setMessage("ارتباط با سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
      >
        {busy ? "در حال استخراج…" : label}
      </button>
      {message && (
        <span
          className={`max-w-[220px] text-[10px] font-bold leading-4 ${tone === "ok" ? "text-emerald-700" : "text-rose-600"}`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
