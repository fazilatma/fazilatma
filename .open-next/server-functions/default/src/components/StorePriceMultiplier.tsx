"use client";

import { useRouter } from "next/navigation";
import { useState as useLocalState } from "react";

/**
 * اعمال ضریب روی قیمت کالاها: قیمت فروشگاه = قیمت مرجع × ضریب.
 * می‌تواند کل فروشگاه را بگیرد یا فقط کالاهای یک لینک مرجع را.
 */
export default function StorePriceMultiplier({ globalMultiplier }: { globalMultiplier: number }) {
  const router = useRouter();
  const [multiplier, setMultiplier] = useLocalState(String(globalMultiplier || 1.1));
  const [sourceUrl, setSourceUrl] = useLocalState("");
  const [scope, setScope] = useLocalState<"all" | "source">("all");
  const [updateGlobal, setUpdateGlobal] = useLocalState(true);
  const [busy, setBusy] = useLocalState(false);
  const [message, setMessage] = useLocalState("");
  const [tone, setTone] = useLocalState<"ok" | "error">("ok");

  const run = async () => {
    if (busy) return;
    const value = Number(String(multiplier).replace(/[^\d.]/g, ""));
    if (!Number.isFinite(value) || value < 0.1 || value > 10) {
      setTone("error");
      setMessage("ضریب باید عددی بین ۰٫۱ و ۱۰ باشد (مثلاً ۱٫۱).");
      return;
    }
    setBusy(true);
    setMessage("");
    let total = 0;
    try {
      for (let round = 0; round < 30; round += 1) {
        const response = await fetch("/api/admin/store-products/apply-multiplier", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            multiplier: value,
            scope,
            sourceUrl: scope === "source" ? sourceUrl.trim() : "",
            updateGlobal: round === 0 ? updateGlobal : false,
          }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) {
          setTone("error");
          setMessage(result?.message || "اعمال ضریب ناموفق بود.");
          return;
        }
        total += Number(result.updated || 0);
        const remaining = Number(result.remaining || 0);
        if (remaining <= 0 || Number(result.updated || 0) === 0) {
          setTone("ok");
          setMessage(
            `ضریب ${value.toLocaleString("fa-IR")} روی ${total.toLocaleString("fa-IR")} کالا اعمال شد؛ قیمت هر کالا = قیمت مرجع × ${value.toLocaleString("fa-IR")}.`,
          );
          router.refresh();
          return;
        }
        setMessage(`${total.toLocaleString("fa-IR")} کالا اعمال شد؛ ${remaining.toLocaleString("fa-IR")} باقی مانده…`);
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
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
      <p className="text-sm font-black text-emerald-900">اعمال ضریب روی قیمت کالاها</p>
      <p className="mt-1 text-xs leading-6 text-emerald-800">
        قیمت هر کالا = قیمت مرجع آن × همین ضریب. اگر ضریب سراسری فروشگاه هم باید همین باشد، تیک پایین را
        برندارید تا کالاهای تازه‌وارد هم از ابتدا با همین ضریب قیمت‌گذاری شوند.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="text-[11px] font-bold text-emerald-900">ضریب</label>
        <input
          value={multiplier}
          onChange={(event) => setMultiplier(event.target.value)}
          inputMode="decimal"
          className="w-24 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-gray-800 outline-none focus:border-emerald-400"
        />
        <select
          value={scope}
          onChange={(event) => setScope(event.target.value === "source" ? "source" : "all")}
          className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-gray-800"
        >
          <option value="all">همهٔ کالاهای فروشگاه</option>
          <option value="source">فقط کالاهای یک لینک</option>
        </select>
        {scope === "source" && (
          <input
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            placeholder="آدرس لینک مرجع"
            dir="ltr"
            className="min-w-[18rem] flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-emerald-400"
          />
        )}
        <label className="flex items-center gap-1 text-[11px] font-bold text-emerald-900">
          <input
            type="checkbox"
            checked={updateGlobal}
            onChange={(event) => setUpdateGlobal(event.target.checked)}
          />
          ضریب سراسری فروشگاه هم این شود
        </label>
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? "در حال اعمال…" : "اعمال ضریب"}
        </button>
      </div>

      {message && (
        <p className={`mt-2 text-[11px] font-bold ${tone === "ok" ? "text-emerald-800" : "text-rose-700"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
