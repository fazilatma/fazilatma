import Link from "next/link";
import {
  getAdminOrdersOverview,
  type MarketOrderRow,
  type StoreOrderRow,
} from "@/lib/admin-orders";
import type { JsonOrder, JsonStoreOrder } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "سفارش‌ها، خریدها و فروش فروشندگان | پنل مدیریت OptiBid",
};

const fa = (value: number) => value.toLocaleString("fa-IR");
const toman = (value: number) => `${fa(value)} تومان`;

const faDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const MARKET_STATUS: Record<JsonOrder["status"], { label: string; tone: string }> = {
  pending_payment: { label: "در انتظار پرداخت", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  paid: { label: "پرداخت‌شده (امانی)", tone: "bg-sky-50 text-sky-700 border-sky-200" },
  shipped: { label: "ارسال‌شده", tone: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  completed: { label: "تکمیل‌شده", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "لغو‌شده", tone: "bg-rose-50 text-rose-700 border-rose-200" },
  returned: { label: "مرجوعی", tone: "bg-orange-50 text-orange-700 border-orange-200" },
};

const STORE_STATUS: Record<JsonStoreOrder["status"], { label: string; tone: string }> = {
  pending_payment: { label: "در انتظار پرداخت", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  paid: { label: "پرداخت‌شده", tone: "bg-sky-50 text-sky-700 border-sky-200" },
  processing: { label: "در حال آماده‌سازی", tone: "bg-violet-50 text-violet-700 border-violet-200" },
  shipped: { label: "ارسال‌شده", tone: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  completed: { label: "تحویل‌شده", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "لغو‌شده", tone: "bg-rose-50 text-rose-700 border-rose-200" },
};

const PAYMENT_LABEL: Record<string, string> = {
  wallet: "کیف پول",
  gateway: "درگاه بانکی",
  zarinpal: "زرین‌پال",
};

function Badge({ label, tone }: { label: string; tone: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-lg border px-2 py-0.5 text-[11px] font-bold ${tone}`}>
      {label}
    </span>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-100 border-r-4 border-r-purple-600 bg-white p-4 shadow-sm">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <p className="text-lg font-black text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

const TABS = [
  { id: "market", label: "خرید و فروش بازار" },
  { id: "store", label: "خریدهای فروشگاه" },
  { id: "sellers", label: "فروش فروشندگان" },
] as const;

type SearchParams = Record<string, string | string[] | undefined>;

const firstParam = (params: SearchParams, key: string) => {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
};

const PAGE_SIZE = 40;

function matchesQuery(haystack: Array<string | number | undefined>, query: string) {
  if (!query) return true;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return haystack.some((value) => String(value ?? "").toLowerCase().includes(needle));
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const overview = await getAdminOrdersOverview();
  const tabParam = firstParam(params, "tab");
  const tab = TABS.some((item) => item.id === tabParam) ? tabParam : "market";
  const statusFilter = firstParam(params, "status");
  const query = firstParam(params, "q");
  const requestedPage = Math.max(1, Math.floor(Number(firstParam(params, "page")) || 1));

  const marketRows = overview.marketOrders.filter(
    (order: MarketOrderRow) =>
      (!statusFilter || order.status === statusFilter) &&
      matchesQuery(
        [order.id, order.buyerName, order.sellerName, order.title, order.category, order.trackingCode],
        query,
      ),
  );
  const storeRows = overview.storeOrders.filter(
    (order: StoreOrderRow) =>
      (!statusFilter || order.status === statusFilter) &&
      matchesQuery(
        [order.id, order.buyerName, order.receiverPhone, order.shippingAddress, ...order.items.map((item) => item.title)],
        query,
      ),
  );
  const sellerRows = overview.sellers.filter((seller) =>
    matchesQuery([seller.sellerName, seller.sellerId], query),
  );

  const rowsCount = tab === "store" ? storeRows.length : tab === "sellers" ? sellerRows.length : marketRows.length;
  const totalPages = Math.max(1, Math.ceil(rowsCount / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const slice = <T,>(items: T[]) => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusOptions =
    tab === "store"
      ? (Object.entries(STORE_STATUS) as Array<[string, { label: string; tone: string }]>)
      : (Object.entries(MARKET_STATUS) as Array<[string, { label: string; tone: string }]>);

  const pageHref = (next: Record<string, string>) => {
    const search = new URLSearchParams({ tab, ...(query ? { q: query } : {}), ...next });
    return `/admin/orders?${search.toString()}`;
  };

  return (
    <main dir="rtl" className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">سفارش‌ها، خریدها و فروش فروشندگان</h1>
          <p className="mt-1 text-sm text-gray-600">
            همهٔ سفارش‌های بازار (خریدار ↔ فروشنده) و خریدهای فروشگاه به‌همراه جمع فروش هر فروشنده.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/dashboard"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            بازگشت به داشبورد مدیریت
          </Link>
          <Link
            href="/shop"
            className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-purple-700"
          >
            مشاهدهٔ فروشگاه
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="کل سفارش‌ها"
          value={fa(overview.totals.allCount)}
          hint={`${fa(overview.totals.marketCount)} بازار + ${fa(overview.totals.storeCount)} فروشگاه`}
        />
        <Stat
          label="فروش بازار (سفارش‌های فعال و تکمیل‌شده)"
          value={toman(overview.totals.marketGross)}
          hint={`${fa(overview.totals.marketOpen)} سفارش باز · ${fa(overview.totals.marketCompleted)} تکمیل‌شده`}
        />
        <Stat
          label="سهم فروشندگان"
          value={toman(overview.totals.marketSellerShare)}
          hint={`کمیسیون پلتفرم: ${toman(overview.totals.marketCommission)}`}
        />
        <Stat
          label="درآمد فروشگاه"
          value={toman(overview.totals.storeRevenue)}
          hint={`${fa(overview.totals.storePending)} سفارش در انتظار پرداخت`}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((item) => (
          <Link
            key={item.id}
            href={`/admin/orders?tab=${item.id}`}
            className={`rounded-xl border px-4 py-2 text-sm font-bold ${
              tab === item.id
                ? "border-purple-600 bg-purple-600 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <form action="/admin/orders" method="get" className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <input type="hidden" name="tab" value={tab} />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={tab === "sellers" ? "نام یا شناسهٔ فروشنده…" : "شناسهٔ سفارش، نام خریدار/فروشنده یا کالا…"}
          className="min-w-[240px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-500"
        />
        {tab !== "sellers" && (
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">همهٔ وضعیت‌ها</option>
            {statusOptions.map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
        )}
        <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white">
          جست‌وجو
        </button>
        {(query || statusFilter) && (
          <Link href={`/admin/orders?tab=${tab}`} className="text-xs font-bold text-purple-700 underline">
            پاک‌کردن فیلترها
          </Link>
        )}
        <span className="ms-auto text-xs text-gray-500">{fa(rowsCount)} مورد</span>
      </form>

      {rowsCount === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          هنوز سفارشی با این فیلترها ثبت نشده است. سفارش‌های جدیدِ فروشگاه و بازار به‌طور خودکار اینجا نمایش داده می‌شوند.
        </div>
      )}

      {tab === "market" && rowsCount > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[980px] text-right text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="p-3 font-bold">شناسه / تاریخ</th>
                <th className="p-3 font-bold">کالا</th>
                <th className="p-3 font-bold">خریدار</th>
                <th className="p-3 font-bold">فروشنده</th>
                <th className="p-3 font-bold">مبلغ کل</th>
                <th className="p-3 font-bold">کمیسیون</th>
                <th className="p-3 font-bold">سهم فروشنده</th>
                <th className="p-3 font-bold">وضعیت</th>
                <th className="p-3 font-bold">جزئیات</th>
              </tr>
            </thead>
            <tbody>
              {slice(marketRows).map((order) => (
                <tr key={order.id} className="border-t border-gray-100 align-top">
                  <td className="p-3">
                    <div className="font-bold text-gray-900">{order.id}</div>
                    <div className="text-[11px] text-gray-500">{faDate(order.createdAt)}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-gray-800">{order.title}</div>
                    <div className="text-[11px] text-gray-500">
                      {order.category} · تعداد {fa(order.quantity)}
                    </div>
                  </td>
                  <td className="p-3 text-gray-700">{order.buyerName}</td>
                  <td className="p-3 text-gray-700">{order.sellerName}</td>
                  <td className="p-3 font-bold text-gray-900">{toman(order.totalAmount)}</td>
                  <td className="p-3 text-gray-600">{toman(order.commission)}</td>
                  <td className="p-3 text-gray-600">{toman(order.sellerShare)}</td>
                  <td className="p-3">
                    <Badge
                      label={MARKET_STATUS[order.status]?.label ?? order.status}
                      tone={MARKET_STATUS[order.status]?.tone ?? "bg-gray-50 text-gray-600 border-gray-200"}
                    />
                  </td>
                  <td className="p-3 text-[11px] text-gray-500">
                    <details>
                      <summary className="cursor-pointer font-bold text-purple-700">باز کردن</summary>
                      <div className="mt-1 space-y-0.5">
                        <div>روش پرداخت: {order.paymentMethod ? PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod : "—"}</div>
                        <div>پرداخت: {faDate(order.paidAt)}</div>
                        <div>تحویل: {faDate(order.deliveredAt)}</div>
                        <div>کد رهگیری: {order.trackingCode || "—"}</div>
                        <div>آدرس: {order.shippingAddress || "—"}</div>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "store" && rowsCount > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-right text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="p-3 font-bold">شناسه / تاریخ</th>
                <th className="p-3 font-bold">خریدار</th>
                <th className="p-3 font-bold">اقلام</th>
                <th className="p-3 font-bold">مبلغ</th>
                <th className="p-3 font-bold">وضعیت</th>
                <th className="p-3 font-bold">ارسال</th>
              </tr>
            </thead>
            <tbody>
              {slice(storeRows).map((order) => (
                <tr key={order.id} className="border-t border-gray-100 align-top">
                  <td className="p-3">
                    <div className="font-bold text-gray-900">{order.id}</div>
                    <div className="text-[11px] text-gray-500">{faDate(order.createdAt)}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-gray-800">{order.buyerName}</div>
                    <div className="text-[11px] text-gray-500" dir="ltr">
                      {order.receiverPhone || "—"}
                    </div>
                  </td>
                  <td className="p-3">
                    <ul className="list-inside list-disc space-y-0.5 text-xs text-gray-700">
                      {order.items.slice(0, 4).map((item, index) => (
                        <li key={`${order.id}-${index}`}>
                          {item.title} × {fa(item.quantity)}
                        </li>
                      ))}
                      {order.items.length > 4 && (
                        <li className="text-gray-500">و {fa(order.items.length - 4)} قلم دیگر…</li>
                      )}
                    </ul>
                  </td>
                  <td className="p-3 font-bold text-gray-900">{toman(order.totalAmount)}</td>
                  <td className="p-3">
                    <Badge
                      label={STORE_STATUS[order.status]?.label ?? order.status}
                      tone={STORE_STATUS[order.status]?.tone ?? "bg-gray-50 text-gray-600 border-gray-200"}
                    />
                  </td>
                  <td className="p-3 text-[11px] text-gray-500">
                    <div>پرداخت: {faDate(order.paidAt)}</div>
                    <div>{order.shippingAddress || "—"}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "sellers" && rowsCount > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[860px] text-right text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="p-3 font-bold">فروشنده</th>
                <th className="p-3 font-bold">تعداد سفارش</th>
                <th className="p-3 font-bold">تکمیل‌شده</th>
                <th className="p-3 font-bold">باز</th>
                <th className="p-3 font-bold">لغو/مرجوعی</th>
                <th className="p-3 font-bold">فروش کل</th>
                <th className="p-3 font-bold">سهم فروشنده</th>
                <th className="p-3 font-bold">کمیسیون</th>
                <th className="p-3 font-bold">آخرین سفارش</th>
                <th className="p-3 font-bold">سفارش‌ها</th>
              </tr>
            </thead>
            <tbody>
              {slice(sellerRows).map((seller) => (
                <tr key={`${seller.sellerId}-${seller.sellerName}`} className="border-t border-gray-100">
                  <td className="p-3">
                    <div className="font-bold text-gray-900">{seller.sellerName}</div>
                    <div className="text-[11px] text-gray-500">شناسه {fa(seller.sellerId)}</div>
                  </td>
                  <td className="p-3">{fa(seller.ordersCount)}</td>
                  <td className="p-3 text-emerald-700">{fa(seller.completedCount)}</td>
                  <td className="p-3 text-amber-700">{fa(seller.openCount)}</td>
                  <td className="p-3 text-rose-700">{fa(seller.cancelledCount)}</td>
                  <td className="p-3 font-bold text-gray-900">{toman(seller.grossAmount)}</td>
                  <td className="p-3 text-gray-700">{toman(seller.sellerShare)}</td>
                  <td className="p-3 text-gray-700">{toman(seller.commission)}</td>
                  <td className="p-3 text-[11px] text-gray-500">{faDate(seller.lastOrderAt)}</td>
                  <td className="p-3">
                    <Link
                      href={`/admin/orders?tab=market&q=${encodeURIComponent(seller.sellerName)}`}
                      className="text-xs font-bold text-purple-700 underline"
                    >
                      مشاهده
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, index) => index + 1)
            .filter((item) => Math.abs(item - page) < 3 || item === 1 || item === totalPages)
            .map((item) => (
              <Link
                key={item}
                href={pageHref({ page: String(item), ...(statusFilter ? { status: statusFilter } : {}) })}
                className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${
                  item === page
                    ? "border-purple-600 bg-purple-600 text-white"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                {fa(item)}
              </Link>
            ))}
        </div>
      )}
    </main>
  );
}
