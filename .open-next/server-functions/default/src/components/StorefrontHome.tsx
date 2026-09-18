import Link from "next/link";
import LaptopFilterSidebar from "@/components/LaptopFilterSidebar";
import StoreHeroSlider from "@/components/StoreHeroSlider";
import StoreProductCard from "@/components/StoreProductCard";
import {
  laptopCategoryItems,
  laptopGuideItems,
  type LaptopGuideItem,
} from "@/lib/laptop-storefront";
import type { HomepageImageSliderSlide, JsonStoreProduct } from "@/lib/json-store";

const money = (value: number | string) =>
  `${Number(value || 0).toLocaleString("fa-IR")} تومان`;

export default function StorefrontHome({
  products,
  heroSlides,
  heroDurationSeconds,
}: {
  products: JsonStoreProduct[];
  heroSlides?: HomepageImageSliderSlide[];
  heroDurationSeconds?: number;
}) {
  const featured = products.filter((product) => product.isFeatured).slice(0, 4);
  const heroProduct = featured[0] || products[0];
  const brands = Array.from(new Set(products.map((product) => product.brand))).slice(0, 8);
  const minPrice = products.reduce(
    (min, product) => Math.min(min, product.price),
    products[0]?.price || 0,
  );

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f8fa] pb-16">
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.45fr_0.55fr] lg:px-8">
          <StoreHeroSlider
            slides={heroSlides}
            durationSeconds={heroDurationSeconds}
          />

          <Link
            href={heroProduct ? `/shop/${heroProduct.slug}` : "/shop"}
            className="group overflow-hidden rounded-[2rem] border border-rose-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="rounded-[1.5rem] bg-rose-50 p-4 text-center">
              <p className="text-xs font-black text-rose-600">پیشنهاد ویژه امروز</p>
              <h2 className="mt-3 line-clamp-2 min-h-14 text-lg font-black leading-7 text-slate-900">
                {heroProduct?.title || "لپ‌تاپ منتخب OptiBid"}
              </h2>
              <p className="mt-3 text-2xl font-black text-rose-600">
                {heroProduct ? money(heroProduct.price) : "—"}
              </p>
            </div>
            <span className="mt-4 block rounded-2xl bg-[#003b5c] px-5 py-3 text-center text-sm font-black text-white transition group-hover:bg-rose-600">
              مشاهده جزئیات و خرید
            </span>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-end">
          <div>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">
              دسته‌بندی تخصصی لپ‌تاپ
            </span>
            <h2 className="mt-3 text-2xl font-black text-slate-900">
              انتخاب سریع بر اساس نوع لپ‌تاپ
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            شروع قیمت از {money(minPrice)} · {products.length.toLocaleString("fa-IR")} مدل فعال
          </p>
        </div>
        <div className="flex gap-3 overflow-x-auto rounded-[2rem] bg-white p-3 shadow-sm ring-1 ring-slate-200">
          {laptopCategoryItems.map((item) => (
            <LaptopType
              key={item.title}
              title={item.title}
              href={item.href}
              badge={item.badge}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                راهنمای خرید لپ‌تاپ
              </span>
              <h2 className="mt-3 text-2xl font-black text-slate-900">
                قبل از خرید، بر اساس نیاز انتخاب کن
              </h2>
            </div>
            <Link href="/shop" className="text-sm font-black text-rose-600">
              مشاهده همه مدل‌ها ←
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {laptopGuideItems.map((guide) => (
              <GuideCard key={guide.slug} guide={guide} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <LaptopFilterSidebar products={products} sticky={false} />
          <div className="min-w-0 flex-1">
            <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <h2 className="text-2xl font-black text-slate-900">پیشنهادهای منتخب لپ‌تاپ</h2>
                <p className="mt-2 text-sm text-slate-500">
                  مدل‌های منتخب برای خرید آنلاین، مقایسه سریع مشخصات و انتخاب مطمئن‌تر.
                </p>
              </div>
              <Link href="/shop" className="text-sm font-black text-rose-600">
                مشاهده همه محصولات ←
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {featured.length > 0
                ? featured.map((product) => <StoreProductCard key={product.id} product={product} />)
                : products.slice(0, 4).map((product) => <StoreProductCard key={product.id} product={product} />)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">برندهای موجود</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {brands.map((brand) => (
              <Link
                key={brand}
                href={`/shop?brand=${encodeURIComponent(brand)}`}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              >
                {brand}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function LaptopType({
  title,
  href,
  badge,
}: {
  title: string;
  href: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group min-w-[132px] rounded-2xl border border-slate-100 bg-slate-50 px-3 py-4 text-center transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50"
    >
      <div className="mx-auto mb-3 w-20">
        <div className="mx-auto h-10 rounded-t-xl border-[6px] border-slate-700 bg-gradient-to-br from-[#003b5c] to-[#00a8e8] transition group-hover:border-rose-600" />
        <div className="mx-auto h-2 rounded-b-xl bg-slate-500 transition group-hover:bg-rose-500" />
      </div>
      {badge && (
        <span className="mb-1 inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-rose-600 shadow-sm">
          {badge}
        </span>
      )}
      <span className="block text-xs font-black text-slate-700 group-hover:text-rose-600">
        {title}
      </span>
    </Link>
  );
}

function GuideIcon({ icon }: { icon: LaptopGuideItem["icon"] }) {
  const common = "h-8 w-8";
  if (icon === "briefcase") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9 7V6a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" stroke="currentColor" strokeWidth="2" />
        <path d="M4 13h16M10 13v1h4v-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "student") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 8l9-4 9 4-9 4-9-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M7 11v4c0 1.7 2.2 3 5 3s5-1.3 5-3v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M21 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "engineering") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M14.5 5.5 18 9m-8.5 9L6 14.5m1.5-7 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M15 4l5 5-9.5 9.5H5.5v-5L15 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 13h8m-10 4 2-7a4 4 0 0 1 3.8-3h.4A4 4 0 0 1 16 10l2 7a2 2 0 0 1-3 2l-1.2-1.2h-3.6L9 19a2 2 0 0 1-3-2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12v3m-1.5-1.5h3M15.5 13.5h.01M17 15h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GuideCard({ guide }: { guide: LaptopGuideItem }) {
  const colors = {
    blue: "bg-blue-50 text-blue-800 border-blue-100 hover:bg-blue-100",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100",
    amber: "bg-amber-50 text-amber-800 border-amber-100 hover:bg-amber-100",
    rose: "bg-rose-50 text-rose-800 border-rose-100 hover:bg-rose-100",
  }[guide.accent];
  return (
    <Link
      href={guide.href}
      className={`group rounded-3xl border p-5 transition hover:-translate-y-1 hover:shadow-lg ${colors}`}
    >
      <div className="mb-4 inline-grid h-14 w-14 place-items-center rounded-2xl bg-white/80 shadow-sm transition group-hover:scale-105">
        <GuideIcon icon={guide.icon} />
      </div>
      <h3 className="font-black">{guide.title}</h3>
      <p className="mt-2 text-xs leading-6 opacity-80">{guide.text}</p>
      <span className="mt-4 inline-flex text-xs font-black opacity-80">
        مشاهده راهنما ←
      </span>
    </Link>
  );
}
