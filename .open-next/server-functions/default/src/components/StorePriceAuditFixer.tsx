"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StorePriceAuditFixer({
  productId,
  productIds,
  label,
  tone = "primary",
}: {
  productId?: string;
  productIds?: string[];
  label: string;
  tone?: "primary" | "neutral";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const run = async () => {
    setBusy(true);
    setMessage("");
    try {
      // اصلاح گروهی ممکن است چند دسته شود (سقف عملیات KV در هر درخواست)؛
      // تا وقتی کالای مغایر باقی مانده، ادامه می‌دهیم.
      let total = 0;
      for (let round = 0; round < 40; round += 1) {
        const response = await fetch("/api/admin/store-products/price-audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productId ? { productIds: [productId] } : { productIds: productIds || [] }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) {
          setMessage(result?.message || "اصلاح ناموفق بود.");
          return;
        }
        total += Number(result.fixed || 0);
        const remaining = Number(result.remaining || 0);
        setMessage(
          remaining > 0
            ? `${total.toLocaleString("fa-IR")} کالا اصلاح شد؛ ${remaining.toLocaleString("fa-IR")} باقی مانده…`
            : result.message || `${total.toLocaleString("fa-IR")} کالا اصلاح شد.`,
        );
        if (remaining <= 0 || productId) break;
      }
      router.refresh();
    } catch {
      setMessage("ارتباط با سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  };

  const toneClass =
    tone === "primary"
      ? "bg-purple-600 text-white hover:bg-purple-700 border-purple-600"
      : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200";

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-50 ${toneClass}`}
      >
        {busy ? "در حال اصلاح…" : label}
      </button>
      {message && <span className="text-[10px] font-bold text-emerald-700">{message}</span>}
    </div>
  );
}
