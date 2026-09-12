import Link from "next/link";
import { ProductHeroImage } from "@/components/ProductImages";
import { getJsonRequests } from "@/lib/json-store";
import type { ProductValuationFactors } from "@/lib/request-valuation";

export const dynamic = "force-dynamic";

const money = (value: string | number) =>
  `${Number(String(value).replace(/\D/g, "") || 0).toLocaleString("fa-IR")} تومان`;

function requestSpecBadges(request: Awaited<ReturnType<typeof getJsonRequests>>[number]) {
  const factors = (request.valuationFactors || {}) as Partial<ProductValuationFactors>;
  const badges = [
    factors.cpuCores ? `${Number(factors.cpuCores).toLocaleString("fa-IR")} هسته CPU` : "",
    factors.ramGb ? `RAM ${Number(factors.ramGb).toLocaleString("fa-IR")}GB` : "",
    factors.storageGb ? `${Number(factors.storageGb).toLocaleString("fa-IR")}GB SSD/HDD` : "",
    factors.displaySizeInch ? `${factors.displaySizeInch} اینچ` : "",
    factors.batteryHealthPercent ? `باتری ${Number(factors.batteryHealthPercent).toLocaleString("fa-IR")}٪` : "",
    `تعداد ${Number(request.quantity || 1).toLocaleString("fa-IR")}`,
  ].filter(Boolean);

  if (badges.length > 0) return badges.slice(0, 4);
  return String(request.description || "")
    .replace(/\s+/g, " ")
    .split(/[،,.]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export default async function RequestBoardPage() {
  const requests = await getJsonRequests().catch(() => []);

  return (
    <div dir="rtl" className="min-h-screen bg-[#f5f7fb] pb-20">
      <section className="bg-gradient-to-l from-[#003b5c] via-[#005e94] to-[#0b9c56] py-12 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-blue-50">
                تابلوی درخواست‌ها
              </span>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
                آگهی‌های درخواست خرید فعال
              </h1>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/request-purchase"
                className="rounded-xl bg-orange-500 px-6 py-3 text-center font-bold text-white shadow-lg transition hover:bg-orange-600"
              >
                + ثبت درخواست جدید
              </Link>
              <Link
                href="/requests"
                className="rounded-xl bg-white px-6 py-3 text-center font-bold text-[#003b5c] transition hover:bg-blue-50"
              >
                مشاهده لیست کامل
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {requests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
            هنوز درخواست فعالی وجود ندارد.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {requests.slice(0, 12).map((request) => {
              const badges = requestSpecBadges(request);
              return (
                <article
                  key={request.id}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-2 p-3 pb-2">
                    <div className="min-w-0">
                      <p className="truncate text-[10px] text-gray-500">
                        شخص/شرکت درخواست‌دهنده
                      </p>
                      <b className="block truncate text-xs text-gray-900">
                        {request.buyerName || "خریدار OptiBid"}
                      </b>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#00a8e8]">
                      {request.category}
                    </span>
                  </div>

                  <Link href={`/requests/${request.id}`} className="block px-3">
                    <ProductHeroImage
                      images={request.productImages}
                      title={request.title}
                      category={request.category}
                      className="h-32 rounded-xl"
                    />
                  </Link>

                  <div className="flex flex-1 flex-col p-3">
                    <h2 className="line-clamp-2 min-h-10 text-base font-extrabold leading-5 text-gray-900 transition group-hover:text-[#003b5c]">
                      {request.title}
                    </h2>
                    <p className="mt-1.5 line-clamp-1 text-xs leading-6 text-gray-500">
                      {request.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {badges.map((badge) => (
                        <span
                          key={badge}
                          className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-600"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                      <b className="text-sm text-[#0b9c56]">{money(request.budget)}</b>
                      <span className="text-[11px] font-bold text-gray-500">
                        {Number(request.offersCount || 0).toLocaleString("fa-IR")} پیشنهاد
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link
                        href={`/requests/${request.id}`}
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-center text-xs font-bold text-gray-700 hover:bg-gray-50"
                      >
                        مشاهده آگهی
                      </Link>
                      <Link
                        href={`/requests/${request.id}/offer`}
                        className="flex-1 rounded-lg bg-[#003b5c] px-3 py-2 text-center text-xs font-bold text-white hover:bg-[#002d46]"
                      >
                        پیشنهاد فروشنده
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
