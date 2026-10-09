"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { StorePriceHistoryPoint } from "@/lib/store-price-history";

const money = (value: number) => `${Number(value || 0).toLocaleString("fa-IR")} تومان`;

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" });
}

export default function StorePriceHistoryChart({
  history,
  asOf,
  productId,
  isAdmin = false,
}: {
  history?: StorePriceHistoryPoint[];
  asOf?: string;
  productId?: string;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [range, setRange] = useState<"week" | "month" | "year">("month");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [refreshingPrice, setRefreshingPrice] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");
  const allPoints = useMemo(() => (history || [])
    .filter((point) => Number.isFinite(Date.parse(point.recordedAt)) && Number(point.price) > 0)
    .slice()
    .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt)), [history]);
  const rangeDays = range === "week" ? 7 : range === "month" ? 30 : 365;
  const rangeAnchor = Date.parse(asOf || allPoints[allPoints.length - 1]?.recordedAt || "");
  const points = Number.isFinite(rangeAnchor)
    ? allPoints.filter((point) => {
        const timestamp = Date.parse(point.recordedAt);
        return timestamp >= rangeAnchor - rangeDays * 24 * 60 * 60 * 1000 && timestamp <= rangeAnchor;
      })
    : allPoints.slice(-30);

  const width = 320;
  const height = 140;
  const left = 20;
  const right = 300;
  const top = 14;
  const bottom = 112;
  const values = points.map((point) => Number(point.price));
  const minPrice = values.length ? Math.min(...values) : 0;
  const maxPrice = values.length ? Math.max(...values) : 0;
  const rangeSize = Math.max(1, maxPrice - minPrice);
  const coordinates = points.map((point, index) => ({
    x: points.length === 1 ? (left + right) / 2 : left + (index * (right - left)) / (points.length - 1),
    y: maxPrice === minPrice ? (top + bottom) / 2 : bottom - ((Number(point.price) - minPrice) / rangeSize) * (bottom - top),
  }));
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const activeIndex = hoveredIndex !== null && points[hoveredIndex] ? hoveredIndex : null;
  const activePoint = activeIndex !== null ? points[activeIndex] : null;
  const activeCoordinate = activeIndex !== null ? coordinates[activeIndex] : null;
  const rangeLabel = range === "week" ? "هفتگی" : range === "month" ? "ماهانه" : "سالانه";
  const hasAnyHistory = allPoints.length > 0;

  const refreshPriceNow = async () => {
    if (!productId) return;
    setRefreshingPrice(true);
    setRefreshMessage("");
    try {
      const response = await fetch("/api/admin/store-products/refresh-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: [productId],
          references: ["digikala", "torob"],
          maxProducts: 1,
          onlyActive: true,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "به‌روزرسانی قیمت از مرجع ناموفق بود.");
      }
      if (Number(result.updated || 0) + Number(result.unchanged || 0) === 0) {
        const itemMessage = result.results?.[0]?.message;
        setRefreshMessage(itemMessage || "قیمت قابل‌اعتماد پیدا نشد؛ نقطهٔ جدیدی به تاریخچه اضافه نشد.");
      } else {
        setRefreshMessage("قیمت از مرجع معتبر بررسی و تاریخچه ثبت شد.");
        router.refresh();
      }
    } catch (error) {
      setRefreshMessage(error instanceof Error ? error.message : "به‌روزرسانی قیمت ناموفق بود.");
    } finally {
      setRefreshingPrice(false);
    }
  };

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-black text-slate-900">سابقهٔ واقعی قیمت</h2>
          <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-black text-rose-600">{rangeLabel}</span>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-[11px] font-bold">
          {([
            ["week", "هفتگی"],
            ["month", "ماهانه"],
            ["year", "سالانه"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={range === key}
              onClick={() => { setRange(key); setHoveredIndex(null); }}
              className={`rounded-lg px-2 py-2 transition ${range === key ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {isAdmin && productId && (
          <div>
            <button
              type="button"
              disabled={refreshingPrice}
              onClick={refreshPriceNow}
              className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
            >
              {refreshingPrice ? "در حال بررسی مرجع قیمت..." : "بررسی قیمت معتبر و ثبت نقطهٔ جدید"}
            </button>
            {refreshMessage && <p className="mt-2 text-center text-[11px] leading-5 text-slate-500">{refreshMessage}</p>}
          </div>
        )}
      </div>

      {points.length === 0 ? (
        <div className="grid min-h-36 place-items-center rounded-2xl bg-slate-50 px-4 text-center text-xs leading-6 text-slate-500">
          {hasAnyHistory
            ? `در بازهٔ ${rangeLabel} قیمت ثبت‌شده‌ای وجود ندارد؛ بازهٔ دیگری را انتخاب کنید.`
            : "هنوز تاریخچهٔ قیمت واقعی ثبت نشده است. پس از ثبت قیمت CSV یا به‌روزرسانی از مرجع معتبر، نخستین نقطه ثبت می‌شود."}
        </div>
      ) : (
        <div className="relative" onMouseLeave={() => setHoveredIndex(null)}>
          <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full overflow-visible" role="img" aria-label={`نمودار واقعی قیمت ${rangeLabel}`}>
            <path d={`M${left} ${bottom}H${right}`} stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
            <path d={`M${left} ${(top + bottom) / 2}H${right}`} stroke="#eef2f7" strokeWidth="2" strokeLinecap="round" />
            <path d={`M${left} ${top}H${right}`} stroke="#eef2f7" strokeWidth="2" strokeLinecap="round" />
            {points.length > 1 && (
              <polyline points={line} fill="none" stroke="#0b86b5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            )}
            {points.map((point, index) => {
              const coordinate = coordinates[index];
              const label = `${formatDate(point.recordedAt)}، ${money(point.price)}`;
              return (
                <circle
                  key={`${point.recordedAt}-${point.source}-${index}`}
                  cx={coordinate.x}
                  cy={coordinate.y}
                  r={activeIndex === index ? 7 : 5}
                  fill="#003b5c"
                  stroke="white"
                  strokeWidth="2"
                  tabIndex={0}
                  role="button"
                  aria-label={label}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={() => setHoveredIndex(null)}
                >
                  <title>{label}</title>
                </circle>
              );
            })}
          </svg>
          {activePoint && activeCoordinate && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-center text-[11px] font-bold text-white shadow-lg"
              style={{ left: `${(activeCoordinate.x / width) * 100}%`, top: `${(activeCoordinate.y / height) * 100}%` }}
            >
              <span className="block">{formatDate(activePoint.recordedAt)}</span>
              <span className="mt-1 block text-rose-200">{money(activePoint.price)}</span>
            </div>
          )}
        </div>
      )}

      {points.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
          <div className="rounded-2xl bg-slate-50 p-3">
            کمترین ثبت‌شده: <b className="text-emerald-700">{money(minPrice)}</b>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            آخرین ثبت: <b className="text-rose-600">{money(points[points.length - 1].price)}</b>
          </div>
        </div>
      )}
      {points.length === 1 && (
        <p className="mt-3 text-[11px] leading-5 text-slate-400">
          فعلاً یک ثبت واقعی داریم؛ با ثبت قیمت‌های بعدی، روند زمانی کامل‌تر می‌شود.
        </p>
      )}
      {points.length > 1 && (
        <p className="mt-3 text-[11px] leading-5 text-slate-400">
          نشانگر هر نقطه را لمس کنید یا نشانگر ماوس را روی آن ببرید تا تاریخ و قیمت همان ثبت را ببینید.
        </p>
      )}
    </div>
  );
}
