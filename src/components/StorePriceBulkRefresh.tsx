"use client";

import { useState } from "react";

/**
 * به‌روزرسانی گروهی قیمت‌های فروشگاه از مرجع بازار (ترب/دیجی‌کالا).
 *
 * هر کلیک چند دسته (هر دسته حداکثر ۱۲ کالا) را پشت سر هم می‌خواند تا سقف
 * پردازش هر درخواست در Cloudflare Worker رعایت شود؛ سپس با `nextOffset`
 * دقیقاً از همان‌جایی که مانده ادامه می‌دهد.
 */
const BATCH_SIZE = 12;

export default function StorePriceBulkRefresh({ total }: { total: number }) {
  const [busy, setBusy] = useState(false);
  const [offset, setOffset] = useState(0);
  const [done, setDone] = useState(0);
  const [updated, setUpdated] = useState(0);
  const [message, setMessage] = useState("");

  const run = async (batches = 4) => {
    setBusy(true);
    setMessage("");
    let cursor = offset;
    let processed = 0;
    let changed = 0;
    try {
      for (let batch = 0; batch < batches; batch += 1) {
        const response = await fetch("/api/admin/store-products/refresh-prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            references: ["torob", "digikala"],
            maxProducts: BATCH_SIZE,
            offset: cursor,
            onlyActive: true,
            updateGlobalMultiplier: false,
          }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) {
          setMessage(result?.message || "به‌روزرسانی قیمت ناموفق بود.");
          break;
        }
        const checked = Number(result.totalChecked ?? result.checked ?? 0);
        const updatedCount = Number(result.updated ?? 0);
        processed += checked;
        changed += updatedCount;
        cursor = Number(result.nextOffset ?? cursor + checked);
        setDone((prev) => prev + updatedCount);
        setUpdated(changed);
        setOffset(cursor);
        if (!result.hasMore || checked === 0) {
          setMessage("همهٔ کالاها بررسی شدند.");
          break;
        }
      }
      if (!message) {
        setMessage(
          `این مرحله: ${processed.toLocaleString("fa-IR")} کالا بررسی و ${changed.toLocaleString("fa-IR")} قیمت اصلاح شد.`,
        );
      }
    } catch {
      setMessage("ارتباط با سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4">
      <p className="text-sm font-black text-purple-900">به‌روزرسانی گروهی قیمت از بازار</p>
      <p className="mt-1 text-xs leading-6 text-purple-800">
        قیمت هر کالا از کمترین پیشنهاد هم‌مدل در ترب و دیجی‌کالا خوانده و با ضریب همان کالا دوباره محاسبه
        می‌شود. هر کلیک چند دسته را بررسی می‌کند؛ اگر تعداد کالاها زیاد است، دوباره بزنید تا شمارنده به
        پایان برسد.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void run(4)}
          disabled={busy}
          className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-black text-white transition hover:bg-purple-700 disabled:opacity-50"
        >
          {busy ? "در حال به‌روزرسانی…" : "به‌روزرسانی قیمت کالاها"}
        </button>
        <button
          type="button"
          onClick={() => void run(12)}
          disabled={busy}
          className="rounded-lg border border-purple-300 bg-white px-3 py-2 text-xs font-black text-purple-700 transition hover:bg-purple-50 disabled:opacity-50"
        >
          {busy ? "در حال اجرا…" : "اجرای بیشتر (دسته‌های بیشتر)"}
        </button>
        <span className="text-[11px] font-bold text-purple-800">
          بررسی‌شده تا اینجا: {offset.toLocaleString("fa-IR")} از {total.toLocaleString("fa-IR")} — اصلاح‌شده:{" "}
          {done.toLocaleString("fa-IR")}
        </span>
      </div>
      {message && <p className="mt-2 text-[11px] font-bold text-emerald-700">{message}</p>}
    </div>
  );
}
