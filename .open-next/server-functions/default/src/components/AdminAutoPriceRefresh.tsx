"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * استخراج خودکار قیمت همین کالا از منابع بازار (ترب/دیجی‌کالا و لینک مرجع کالا)
 * و ضرب کمترین قیمت در ضریب همان کالا. هیچ ورودی دستی لازم نیست.
 */
export default function AdminAutoPriceRefresh({
  productId,
  price,
  multiplier,
}: {
  productId: string;
  price: number;
  multiplier: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"ok" | "error">("ok");

  const run = async () => {
    setBusy(true);
    setMessage("در حال استخراج کمترین قیمت از منابع…");
    setTone("ok");
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
        setMessage(result?.message || "استخراج قیمت ناموفق بود.");
        return;
      }
      const detail = Array.isArray(result.results) ? result.results[0] : null;
      if (detail?.status === "updated") {
        setMessage(
          `قیمت از ${Number(detail.oldPrice || 0).toLocaleString("fa-IR")} به ${Number(
            detail.newPrice || 0,
          ).toLocaleString("fa-IR")} تومان به‌روز شد — کمترین قیمت ${detail.source === "torob" ? "ترب" : "دیجی‌کالا"}: «${String(
            detail.candidateTitle || "",
          ).slice(0, 60)}» × ضریب ${multiplier.toLocaleString("fa-IR")}`,
        );
        router.refresh();
        return;
      }
      if (detail?.status === "unchanged") {
        setMessage("قیمت همین حالا با کمترین قیمت منابع هم‌خوان است؛ تغییری لازم نبود.");
        return;
      }
      const warnings = Array.isArray(result.warnings) ? result.warnings.slice(0, 2).join(" | ") : "";
      setTone("error");
      setMessage(
        `منابع قیمت هم‌مدل برنگرداندند${warnings ? ` (${warnings})` : ""}. چند دقیقه بعد دوباره بزنید.`,
      );
    } catch {
      setTone("error");
      setMessage("ارتباط با سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-dashed border-purple-300 bg-purple-50/70 p-3 text-right" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-black text-purple-900">
          استخراج خودکار قیمت (مدیر) — قیمت فعلی {price.toLocaleString("fa-IR")} تومان · ضریب{" "}
          {multiplier.toLocaleString("fa-IR")}
        </p>
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy}
          className="rounded-lg bg-purple-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {busy ? "در حال استخراج…" : "به‌روزرسانی قیمت از منابع"}
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
