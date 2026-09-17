import type { Metadata } from "next";
import StoreProductCard from "@/components/StoreProductCard";
import { getJsonStoreProducts } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "فروشگاه لپ‌تاپ OptiBid | خرید آنلاین لپ‌تاپ نو و کارکرده",
  description:
    "فروشگاه تخصصی لپ‌تاپ OptiBid برای مقایسه و خرید آنلاین لپ‌تاپ‌های نو، استوک، اداری، دانشجویی، مهندسی و گیمینگ.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; use?: string }>;
}) {
  const params = await searchParams;
  const products = await getJsonStoreProducts();
  const filteredProducts = products.filter((product) => {
    if (params.brand && product.brand !== params.brand) return false;
    if (params.use) {
      const text = `${product.title} ${product.summary} ${product.badges.join(" ")}`.toLowerCase();
      const useKeyword: Record<string, string[]> = {
        business: ["اداری", "شرکتی", "business"],
        student: ["دانشجویی", "student"],
        engineering: ["مهندسی", "workstation", "مهندس"],
        gaming: ["گیمینگ", "gaming", "rtx"],
      };
      const keywords = useKeyword[params.use] || [];
      if (keywords.length && !keywords.some((keyword) => text.includes(keyword))) return false;
    }
    return true;
  });
  const brands = Array.from(new Set(products.map((product) => product.brand)));

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f8fa] pb-16">
      <section className="bg-white py-10 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">
            فروشگاه اینترنتی OptiBid
          </span>
          <h1 className="mt-4 text-3xl font-black text-slate-900 md:text-4xl">
            خرید لپ‌تاپ و کامپیوتر
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            لیست مدل‌های منتخب با امکان مقایسه مشخصات فنی، گارانتی تست، قیمت و ثبت سفارش آنلاین.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="h-fit rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-black text-slate-900">فیلتر سریع برند</h2>
          <div className="mt-4 space-y-2">
            <a href="/shop" className="block rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600">
              همه برندها
            </a>
            {brands.map((brand) => (
              <a
                key={brand}
                href={`/shop?brand=${encodeURIComponent(brand)}`}
                className="block rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600"
              >
                {brand}
              </a>
            ))}
          </div>
        </aside>

        <main>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-900">
              {filteredProducts.length.toLocaleString("fa-IR")} کالا
            </h2>
            <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-500 shadow-sm">
              مرتب‌سازی: پیشنهاد OptiBid
            </span>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              کالایی با این فیلتر پیدا نشد.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <StoreProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
