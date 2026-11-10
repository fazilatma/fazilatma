import Link from "next/link";
import { getOptiBidData } from "@/lib/json-store";
import { auditStoreProductPrices, type PriceAuditStatus } from "@/lib/store-price-audit";
import { normalizeStorePriceMultiplier } from "@/lib/store-pricing";
import StorePriceAuditFixer from "@/components/StorePriceAuditFixer";
import StorePriceReferenceSync from "@/components/StorePriceReferenceSync";
import StorePriceBulkRefresh from "@/components/StorePriceBulkRefresh";
import StorePriceManualReference from "@/components/StorePriceManualReference";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "کنترل مغایرت قیمت‌ها | پنل مدیریت OptiBid",
};

const fa = (value: number) => value.toLocaleString("fa-IR");
const toman = (value: number) => `${fa(Math.round(value))} تومان`;

const STATUS_META: Record<PriceAuditStatus, { label: string; tone: string }> = {
  mismatch: { label: "مغایرت با فرمول", tone: "bg-rose-50 text-rose-700 border-rose-200" },
  "missing-reference": { label: "قیمت مرجع ندارد", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  stale: { label: "قیمت قدیمی", tone: "bg-sky-50 text-sky-700 border-sky-200" },
  ok: { label: "درست", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

type SearchParams = Record<string, string | string[] | undefined>;

const firstParam = (params: SearchParams, key: string, fallback = "") => {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? fallback;
};

export default async function PriceAuditPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const statusFilter = firstParam(params, "status", "problems");
  const query = firstParam(params, "q");

  const data = await getOptiBidData();
  const fallbackMultiplier = normalizeStorePriceMultiplier(data.settings.storePriceMultiplier, 1);
  const { rows, summary } = auditStoreProductPrices(data.storeProducts, fallbackMultiplier);

  const needle = query.trim().toLowerCase();
  const filtered = rows
    .filter((row) => {
      if (statusFilter === "problems") return row.status !== "ok";
      if (statusFilter === "all") return true;
      return row.status === statusFilter;
    })
    .filter((row) =>
      needle
        ? `${row.title} ${row.brand} ${row.category} ${row.slug}`.toLowerCase().includes(needle)
        : true,
    )
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

  const mismatchIds = rows.filter((row) => row.status === "mismatch").map((row) => row.id);
  const shown = filtered.slice(0, 200);

  return (
    <main dir="rtl" className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">کنترل مغایرت قیمت‌ها</h1>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            قیمت هر کالا در همهٔ صفحات سایت باید برابر «قیمت مرجع بازار × ضریب همان کالا» باشد.
            این صفحه هر کالایی را که با این فرمول نمی‌خواند نشان می‌دهد و با یک کلیک اصلاح می‌کند.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StorePriceAuditFixer
            productIds={mismatchIds}
            label={`اصلاح همهٔ مغایرت‌ها (${fa(mismatchIds.length)})`}
          />
          <Link
            href="/admin/orders"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            سفارش‌ها و فروش‌ها
          </Link>
          <Link
            href="/admin/dashboard"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            بازگشت به داشبورد مدیریت
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <StorePriceBulkRefresh total={summary.total} />
      </div>
      <div className="mb-6">
        <StorePriceManualReference />
      </div>
      {summary.unverified > 0 && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
          {fa(summary.unverified)} کالا با قیمت روز بازار تطبیق داده نشده است. تا وقتی این عدد صفر نشود،
          امکان دارد قیمت فروشگاه از کمترین قیمت ترب پایین‌تر (یا بالاتر) باشد؛ دکمهٔ «به‌روزرسانی قیمت کالاها»
          را تا پایان شمارنده بزنید.
        </div>
      )}
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-gray-100 border-r-4 border-r-purple-600 bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs text-gray-500">کل کالاها</p>
          <p className="text-lg font-black text-gray-900">{fa(summary.total)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 border-r-4 border-r-rose-500 bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs text-gray-500">مغایرت با فرمول</p>
          <p className="text-lg font-black text-rose-600">{fa(summary.mismatch)}</p>
          <p className="mt-1 text-[11px] text-gray-400">اختلاف کل: {toman(summary.totalDifference)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 border-r-4 border-r-amber-500 bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs text-gray-500">بدون قیمت مرجع</p>
          <p className="text-lg font-black text-amber-600">{fa(summary.missingReference)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 border-r-4 border-r-sky-500 bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs text-gray-500">قیمت قدیمی‌تر از ۷ روز</p>
          <p className="text-lg font-black text-sky-600">{fa(summary.stale)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 border-r-4 border-r-emerald-500 bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs text-gray-500">درست</p>
          <p className="text-lg font-black text-emerald-600">{fa(summary.ok)}</p>
          <p className="mt-1 text-[11px] text-gray-400">ضریب پیش‌فرض: {fa(fallbackMultiplier)}</p>
        </div>
      </div>

      <form action="/admin/pricing-audit" method="get" className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="نام کالا، برند یا اسلاگ…"
          className="min-w-[220px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-500"
        />
        <select
          name="status"
          defaultValue={statusFilter}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="problems">فقط مشکل‌دارها</option>
          <option value="mismatch">مغایرت با فرمول</option>
          <option value="missing-reference">بدون قیمت مرجع</option>
          <option value="stale">قیمت قدیمی</option>
          <option value="ok">درست</option>
          <option value="all">همه</option>
        </select>
        <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white">
          فیلتر
        </button>
        <span className="ms-auto text-xs text-gray-500">
          {fa(filtered.length)} مورد{filtered.length > shown.length ? ` — نمایش ${fa(shown.length)} مورد اول` : ""}
        </span>
      </form>

      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-10 text-center text-sm font-bold text-emerald-700">
          ✅ هیچ مغایرت قیمتی با این فیلتر پیدا نشد.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[1080px] text-right text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="p-3 font-bold">کالا</th>
                <th className="p-3 font-bold">قیمت مرجع</th>
                <th className="p-3 font-bold">ضریب</th>
                <th className="p-3 font-bold">قیمت درست (فرمول)</th>
                <th className="p-3 font-bold">قیمت فعلی سایت</th>
                <th className="p-3 font-bold">اختلاف</th>
                <th className="p-3 font-bold">آخرین به‌روزرسانی</th>
                <th className="p-3 font-bold">وضعیت</th>
                <th className="p-3 font-bold">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.id} className="border-t border-gray-100 align-top">
                  <td className="p-3">
                    <Link
                      href={`/shop/${row.slug}`}
                      className="font-bold text-gray-900 hover:text-purple-700"
                      target="_blank"
                    >
                      {row.title}
                    </Link>
                    <div className="text-[11px] text-gray-500">
                      {row.brand} · {row.category}
                      {!row.isActive ? " · غیرفعال" : row.stock <= 0 ? " · ناموجود" : ""}
                    </div>
                  </td>
                  <td className="p-3 text-gray-700">{row.referencePrice ? toman(row.referencePrice) : "—"}</td>
                  <td className="p-3 text-gray-700">{fa(row.multiplier)}</td>
                  <td className="p-3 font-bold text-emerald-700">
                    {row.expectedPrice ? toman(row.expectedPrice) : "—"}
                  </td>
                  <td className="p-3 font-bold text-gray-900">{toman(row.storedPrice)}</td>
                  <td className="p-3">
                    {row.difference === 0 ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <span className={row.difference > 0 ? "text-rose-600" : "text-amber-600"}>
                        {row.difference > 0 ? "+" : "−"}
                        {toman(Math.abs(row.difference))}
                        <span className="ms-1 text-[11px] text-gray-400">({fa(row.differenceRatio)}٪)</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-[11px] text-gray-500">
                    {row.priceUpdatedAt || "—"}
                    {row.daysSinceUpdate !== null ? ` (${fa(row.daysSinceUpdate)} روز)` : ""}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block whitespace-nowrap rounded-lg border px-2 py-0.5 text-[11px] font-bold ${STATUS_META[row.status].tone}`}
                    >
                      {STATUS_META[row.status].label}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-2">
                      {row.status === "mismatch" && (
                        <StorePriceAuditFixer productId={row.id} label="اصلاح قیمت" />
                      )}
                      <StorePriceReferenceSync productId={row.id} />
                      {row.sourceUrl && (
                        <a
                          href={row.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-purple-700 underline"
                        >
                          مرجع قیمت
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-6 text-blue-900">
        <p className="font-bold">فرمول قیمت‌گذاری سایت</p>
        <p>
          قیمت فروش = قیمت مرجع بازار × ضریب همان کالا (گرد‌شده به نزدیک‌ترین ۱۰٬۰۰۰ تومان).
          ضریب هر کالا از لینک/دستهٔ واردات آن می‌آید و اگر کالایی ضریب اختصاصی نداشته باشد، ضریب
          پیش‌فرض تنظیمات ({fa(fallbackMultiplier)}) استفاده می‌شود. «اصلاح قیمت» همین فرمول را
          دوباره اعمال و در دیتابیس ذخیره می‌کند، بنابراین هم صفحهٔ اصلی، هم لیست فروشگاه، هم صفحهٔ
          محصول و هم سبد خرید عدد یکسان نشان می‌دهند.
        </p>
      </div>
    </main>
  );
}
