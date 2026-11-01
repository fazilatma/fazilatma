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

const priceReferenceOptions = [
  { id: "digikala", label: "دیجی‌کالا" },
  { id: "torob", label: "ترب" },
  { id: "google", label: "گوگل" },
  { id: "instagram", label: "اینستاگرام" },
  { id: "telegram", label: "تلگرام" },
] as const;

type PriceReferenceId = (typeof priceReferenceOptions)[number]["id"];

function PriceHistoryGraph({
  points,
  rangeLabel,
  expanded = false,
}: {
  points: StorePriceHistoryPoint[];
  rangeLabel: string;
  expanded?: boolean;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const width = expanded ? 900 : 320;
  const height = expanded ? 360 : 140;
  const left = expanded ? 104 : 20;
  const right = expanded ? 860 : 300;
  const top = expanded ? 32 : 14;
  const bottom = expanded ? 300 : 112;
  const values = points.map((point) => Number(point.price));
  const minPrice = values.length ? Math.min(...values) : 0;
  const maxPrice = values.length ? Math.max(...values) : 0;
  const range = Math.max(1, maxPrice - minPrice);
  const coordinates = points.map((point, index) => ({
    x: points.length === 1 ? (left + right) / 2 : left + (index * (right - left)) / (points.length - 1),
    y: maxPrice === minPrice ? (top + bottom) / 2 : bottom - ((Number(point.price) - minPrice) / range) * (bottom - top),
  }));
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const activeIndex = hoveredIndex !== null && points[hoveredIndex] ? hoveredIndex : null;
  const activePoint = activeIndex !== null ? points[activeIndex] : null;
  const activeCoordinate = activeIndex !== null ? coordinates[activeIndex] : null;
  const gridLevels = [maxPrice, (maxPrice + minPrice) / 2, minPrice];
  const gridY = [top, (top + bottom) / 2, bottom];

  return (
    <div className="relative" onMouseLeave={() => setHoveredIndex(null)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={expanded ? "h-[min(58vh,420px)] w-full overflow-visible" : "h-36 w-full overflow-visible"}
        role="img"
        aria-label={`منحنی واقعی قیمت ${rangeLabel}`}
      >
        {gridY.map((y, index) => (
          <g key={y}>
            <path d={`M${left} ${y}H${right}`} stroke={index === 2 ? "#e2e8f0" : "#eef2f7"} strokeWidth="2" strokeLinecap="round" />
            {expanded && (
              <text x={left - 12} y={y + 5} textAnchor="end" className="fill-slate-400" fontSize="13">
                {money(gridLevels[index])}
              </text>
            )}
          </g>
        ))}
        {points.length > 1 && (
          <polyline points={line} fill="none" stroke="#0b86b5" strokeWidth={expanded ? 5 : 4} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {points.map((point, index) => {
          const coordinate = coordinates[index];
          const label = `${formatDate(point.recordedAt)}، ${money(point.price)}`;
          return (
            <circle
              key={`${point.recordedAt}-${point.source}-${index}`}
              cx={coordinate.x}
              cy={coordinate.y}
              r={activeIndex === index ? (expanded ? 9 : 7) : (expanded ? 7 : 5)}
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
        {expanded && points.length > 0 && (
          <>
            <text x={left} y={height - 12} textAnchor="start" className="fill-slate-400" fontSize="13">
              {formatDate(points[0].recordedAt)}
            </text>
            <text x={right} y={height - 12} textAnchor="end" className="fill-slate-400" fontSize="13">
              {formatDate(points[points.length - 1].recordedAt)}
            </text>
          </>
        )}
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
  );
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
  const [refreshingPrice, setRefreshingPrice] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");
  const [selectedReferences, setSelectedReferences] = useState<PriceReferenceId[]>(
    priceReferenceOptions.map((option) => option.id),
  );
  const [expanded, setExpanded] = useState(false);
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
  const minPrice = points.length ? Math.min(...points.map((point) => Number(point.price))) : 0;
  const rangeLabel = range === "week" ? "هفتگی" : range === "month" ? "ماهانه" : "سالانه";
  const hasAnyHistory = allPoints.length > 0;

  const refreshPriceNow = async () => {
    if (!productId) return;
    if (selectedReferences.length === 0) {
      setRefreshMessage("حداقل یک مرجع قیمت را انتخاب کنید.");
      return;
    }
    setRefreshingPrice(true);
    setRefreshMessage("");
    try {
      const response = await fetch("/api/admin/store-products/refresh-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: [productId],
          references: selectedReferences,
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

  const rangeControls = (
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
          onClick={() => setRange(key)}
          className={`rounded-lg px-2 py-2 transition ${range === key ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const emptyMessage = points.length === 0
    ? hasAnyHistory
      ? `در بازهٔ ${rangeLabel} قیمت ثبت‌شده‌ای وجود ندارد؛ بازهٔ دیگری را انتخاب کنید.`
      : "هنوز تاریخچهٔ قیمت واقعی ثبت نشده است. پس از ثبت قیمت CSV یا به‌روزرسانی از مرجع معتبر، نخستین نقطه ثبت می‌شود."
    : "";

  return (
    <>
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-black text-slate-900">سابقهٔ واقعی قیمت</h2>
          <div className="flex items-center gap-2">
            {points.length > 0 && (
              <button type="button" onClick={() => setExpanded(true)} className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-700">
                نمایش نمودار کامل
              </button>
            )}
            <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-black text-rose-600">{rangeLabel}</span>
          </div>
        </div>
          {rangeControls}
          {isAdmin && productId && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-2">
                {priceReferenceOptions.map((option) => {
                  const checked = selectedReferences.includes(option.id);
                  return (
                    <label
                      key={option.id}
                      className={`cursor-pointer rounded-full px-2 py-1 text-[10px] font-bold transition ${checked ? "bg-emerald-100 text-emerald-800" : "bg-white text-slate-400"}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setSelectedReferences((current) =>
                          current.includes(option.id)
                            ? current.filter((item) => item !== option.id)
                            : [...current, option.id],
                        )}
                        className="ml-1 align-middle"
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
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
          <div className="grid min-h-36 place-items-center rounded-2xl bg-slate-50 px-4 text-center text-xs leading-6 text-slate-500">{emptyMessage}</div>
        ) : (
          <PriceHistoryGraph points={points} rangeLabel={rangeLabel} />
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

      {expanded && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-[2rem] bg-white p-5 shadow-2xl sm:p-7" role="dialog" aria-modal="true" aria-label="نمودار سابقه قیمت کالا">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">نمودار قیمت واقعی</span>
                <h2 className="mt-3 text-xl font-black text-slate-900">{rangeLabel}؛ قیمت و تاریخ ثبت‌شده</h2>
              </div>
              <button type="button" onClick={() => setExpanded(false)} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700" aria-label="بستن نمودار">✕</button>
            </div>
            {rangeControls}
            {points.length === 0 ? (
              <div className="mt-5 grid min-h-64 place-items-center rounded-2xl bg-slate-50 px-6 text-center text-sm leading-7 text-slate-500">{emptyMessage}</div>
            ) : (
              <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-3 sm:p-5">
                <PriceHistoryGraph points={points} rangeLabel={rangeLabel} expanded />
              </div>
            )}
            {points.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-4">کمترین ثبت‌شده: <b className="text-emerald-700">{money(minPrice)}</b></div>
                <div className="rounded-2xl bg-slate-50 p-4">آخرین ثبت: <b className="text-rose-600">{money(points[points.length - 1].price)}</b></div>
              </div>
            )}
            <p className="mt-4 text-xs leading-6 text-slate-400">منحنی فقط نقاط قیمت واقعیِ ذخیره‌شده را نشان می‌دهد؛ دادهٔ تاریخیِ ثبت‌نشده ساخته یا حدس زده نمی‌شود.</p>
          </div>
        </div>
      )}
    </>
  );
}
