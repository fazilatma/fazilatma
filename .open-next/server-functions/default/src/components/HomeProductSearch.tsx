import Link from "next/link";

const popularSearches: Record<"components" | "laptop", string[]> = {
  components: ["RTX 5060", "Ryzen 7", "H610", "SSD", "DDR5"],
  laptop: ["لپ‌تاپ گیمینگ", "ThinkPad", "MacBook", "لپ‌تاپ استوک"],
};

/**
 * جستجوی محصولات در صفحهٔ اصلی؛ فرم مستقیم به فروشگاه (`/shop?q=`)
 * ارسال می‌شود تا همان موتور جستجو و فیلترهای فروشگاه نتیجه را نشان دهد.
 */
export default function HomeProductSearch({
  focus = "components",
}: {
  focus?: "components" | "laptop";
}) {
  const chips = popularSearches[focus];
  return (
    <section id="home-product-search" aria-label="جستجوی محصولات فروشگاه">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 lg:w-72 lg:shrink-0">
            <h2 className="text-lg font-black text-slate-900 sm:text-xl">
              دنبال چه کالایی هستید؟
            </h2>
            <p className="mt-1 text-sm leading-7 text-slate-500">
              بین همهٔ محصولات فروشگاه جستجو کنید و قیمت به‌روز را مقایسه کنید.
            </p>
          </div>
          <form action="/shop" method="get" role="search" className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">جستجوی کالا</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                >
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="m16.5 16.5 4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="search"
                  name="q"
                  maxLength={120}
                  autoComplete="off"
                  placeholder={
                    focus === "components"
                      ? "جستجو بین قطعات؛ مثلاً Ryzen 7، RTX 5060 یا H610..."
                      : "نام، برند یا مدل کالا را جستجو کنید..."
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-12 pl-4 text-sm font-bold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
                />
              </label>
              <button
                type="submit"
                className="h-12 shrink-0 rounded-2xl bg-rose-600 px-7 text-sm font-black text-white transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200"
              >
                جستجوی کالا
              </button>
            </div>
          </form>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-black text-slate-500">جستجوهای پرتکرار:</span>
          {chips.map((chip) => (
            <Link
              key={chip}
              href={`/shop?q=${encodeURIComponent(chip)}`}
              className="rounded-full bg-slate-100 px-3 py-1.5 font-bold text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
            >
              {chip}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
