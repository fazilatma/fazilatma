"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

/**
 * به‌روزرسانی قیمت «همهٔ کالاهای سایت» از لینک‌های مرجعی که ادمین داده است.
 *
 * برای هر کالا کمترین قیمتِ هم‌مدل در ترب و دیجی‌کالا (و لینک مرجع خود کالا)
 * خوانده و در ضریب همان کالا ضرب می‌شود. چون هر درخواست در Cloudflare Worker
 * سقف پردازش دارد، کار دسته‌دسته انجام می‌شود و همین دکمه به‌طور خودکار تا
 * پایان فهرست ادامه می‌دهد؛ می‌توانید وسط کار «توقف» بزنید و بعداً ادامه دهید.
 */
const BATCH_SIZE = 8;
const STORAGE_KEY = "optibidBulkPriceOffset";

type BatchResult = {
  success?: boolean;
  message?: string;
  totalProducts?: number;
  totalChecked?: number;
  updated?: number;
  unchanged?: number;
  notFound?: number;
  failed?: number;
  nextOffset?: number;
  hasMore?: boolean;
};

export default function StorePriceBulkRefresh({ total }: { total: number }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [offset, setOffset] = useState(0);
  const [checked, setChecked] = useState(0);
  const [updated, setUpdated] = useState(0);
  const [missing, setMissing] = useState(0);
  const [message, setMessage] = useState("");
  const [rate, setRate] = useState(0);
  const stopRef = useRef(false);

  const persistOffset = (value: number) => {
    setOffset(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // بی‌اهمیت.
    }
  };

  const run = async () => {
    if (running) return;
    stopRef.current = false;
    setRunning(true);
    let cursor = offset;
    // اگر اجرای قبلی نیمه‌کاره مانده باشد، از همان کالا ادامه می‌دهیم.
    try {
      const saved = Number(window.localStorage.getItem(STORAGE_KEY) || 0);
      if (cursor === 0 && Number.isFinite(saved) && saved > 0) cursor = saved;
    } catch {
      // بی‌اهمیت؛ از ابتدا شروع می‌شود.
    }
    setMessage(`در حال خواندن قیمت از مرجع (از کالای ${cursor.toLocaleString("fa-IR")})…`);
    let processed = 0;
    let changed = 0;
    let notFound = 0;
    const startedAt = Date.now();
    setChecked(0);
    setUpdated(0);
    setMissing(0);

    try {
      for (;;) {
        if (stopRef.current) {
          setMessage("متوقف شد؛ با همین دکمه ادامه دهید (از همان کالا ادامه می‌یابد).");
          break;
        }
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
        const result = (await response.json().catch(() => null)) as BatchResult | null;
        if (!response.ok || !result?.success) {
          setMessage(result?.message || "به‌روزرسانی قیمت ناموفق بود؛ دوباره تلاش کنید.");
          break;
        }

        const batchChecked = Number(result.totalChecked ?? 0);
        processed += batchChecked;
        changed += Number(result.updated ?? 0);
        notFound += Number(result.notFound ?? 0);
        persistOffset(Number(result.nextOffset ?? 0));
        setChecked(processed);
        setUpdated(changed);
        setMissing(notFound);
        setRate(processed / Math.max(1, (Date.now() - startedAt) / 1000));

        if (!result.hasMore || batchChecked === 0) {
          persistOffset(0);
          setMessage(
            `پایان: ${processed.toLocaleString("fa-IR")} کالا بررسی شد، ${changed.toLocaleString("fa-IR")} قیمت تازه شد و برای ${notFound.toLocaleString("fa-IR")} کالا قیمت هم‌مدل پیدا نشد.`,
          );
          router.refresh();
          break;
        }

        cursor = Number(result.nextOffset ?? 0);
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    } catch {
      setMessage("ارتباط با سرور قطع شد؛ با همین دکمه ادامه دهید.");
    } finally {
      setRunning(false);
    }
  };

  const percent = total > 0 ? Math.min(100, Math.round((offset / total) * 100)) : 0;

  return (
    <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-black text-purple-900">به‌روزرسانی قیمت همهٔ کالاهای سایت</p>
          <p className="mt-1 max-w-3xl text-xs leading-6 text-purple-800">
            برای هر کالا کمترین قیمت هم‌مدل در ترب و دیجی‌کالا (و لینک مرجع خودِ کالا) پیدا و در ضریب همان
            کالا ضرب می‌شود. کالایی که قیمت هم‌مدل ندارد دست‌نخورده می‌ماند. این دکمه خودش تا آخر فهرست
            ادامه می‌دهد؛ صفحه را نبندید و می‌توانید وسط کار «توقف» بزنید.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void run()}
            disabled={running}
            className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-black text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            {running ? "در حال به‌روزرسانی…" : offset > 0 ? "ادامهٔ به‌روزرسانی" : "شروع به‌روزرسانی همه"}
          </button>
          {running && (
            <button
              type="button"
              onClick={() => {
                stopRef.current = true;
              }}
              className="rounded-lg border border-purple-300 bg-white px-3 py-2 text-xs font-black text-purple-700 hover:bg-purple-50"
            >
              توقف
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-purple-100">
        <div
          className="h-full rounded-full bg-purple-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-bold text-purple-900">
        <span>
          پیشرفت: {offset.toLocaleString("fa-IR")} از {total.toLocaleString("fa-IR")} ({percent}%)
        </span>
        <span>قیمت تازه‌شده این اجرا: {updated.toLocaleString("fa-IR")}</span>
        <span>بدون قیمت هم‌مدل: {missing.toLocaleString("fa-IR")}</span>
        {running && <span>{Math.round(rate).toLocaleString("fa-IR")} کالا در ثانیه</span>}
        {checked === 0 && !running && offset > 0 && <span>برای ادامه، دکمهٔ بالا را بزنید.</span>}
      </div>

      {message && <p className="mt-2 text-[11px] font-bold text-emerald-700">{message}</p>}
    </div>
  );
}
