import Link from "next/link";
import LaptopFilterSidebar from "@/components/LaptopFilterSidebar";
import StoreHeroSlider from "@/components/StoreHeroSlider";
import StoreProductCard from "@/components/StoreProductCard";
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
          <LaptopType title="لپ‌تاپ لنوو" href="/shop?brand=Lenovo" />
          <LaptopType title="لپ‌تاپ اچ‌پی" href="/shop?brand=HP" />
          <LaptopType title="لپ‌تاپ دل" href="/shop?brand=Dell" />
          <LaptopType title="لپ‌تاپ ایسوس" href="/shop?brand=Asus" />
          <LaptopType title="مک‌بوک اپل" href="/shop?brand=Apple" />
          <LaptopType title="لپ‌تاپ گیمینگ" href="/shop?use=gaming" />
          <LaptopType title="لپ‌تاپ اداری" href="/shop?use=business" />
          <LaptopType title="لپ‌تاپ دانشجویی" href="/shop?use=student" />
          <LaptopType title="لپ‌تاپ مهندسی" href="/shop?use=engineering" />
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
            <GuideCard title="کار اداری و حسابداری" text="Core i5، رم ۱۶GB و SSD برای سرعت پایدار روزانه کافی است." accent="blue" />
            <GuideCard title="دانشجو و حمل روزانه" text="وزن کم، باتری سالم و نمایشگر ۱۳ تا ۱۴ اینچ اولویت دارد." accent="emerald" />
            <GuideCard title="مهندسی و طراحی" text="پردازنده قوی‌تر، رم بالاتر و در صورت نیاز گرافیک مجزا انتخاب کنید." accent="amber" />
            <GuideCard title="گیمینگ و تدوین" text="کارت گرافیک RTX، خنک‌کنندگی مناسب و نمایشگر ۱۴۴Hz مهم است." accent="rose" />
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

function LaptopType({ title, href }: { title: string; href: string }) {
  return (
    <Link
      href={href}
      className="group min-w-[132px] rounded-2xl border border-slate-100 bg-slate-50 px-3 py-4 text-center transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50"
    >
      <div className="mx-auto mb-3 w-20">
        <div className="mx-auto h-10 rounded-t-xl border-[6px] border-slate-700 bg-gradient-to-br from-[#003b5c] to-[#00a8e8] transition group-hover:border-rose-600" />
        <div className="mx-auto h-2 rounded-b-xl bg-slate-500 transition group-hover:bg-rose-500" />
      </div>
      <span className="text-xs font-black text-slate-700 group-hover:text-rose-600">
        {title}
      </span>
    </Link>
  );
}

function GuideCard({
  title,
  text,
  accent,
}: {
  title: string;
  text: string;
  accent: "blue" | "emerald" | "amber" | "rose";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-800 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-100",
    amber: "bg-amber-50 text-amber-800 border-amber-100",
    rose: "bg-rose-50 text-rose-800 border-rose-100",
  }[accent];
  return (
    <div className={`rounded-3xl border p-5 ${colors}`}>
      <h3 className="font-black">{title}</h3>
      <p className="mt-2 text-xs leading-6 opacity-80">{text}</p>
    </div>
  );
}
