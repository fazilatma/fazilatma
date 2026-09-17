import Link from "next/link";
import StoreProductCard from "@/components/StoreProductCard";
import type { JsonStoreProduct } from "@/lib/json-store";

const money = (value: number | string) =>
  `${Number(value || 0).toLocaleString("fa-IR")} تومان`;

export default function StorefrontHome({ products }: { products: JsonStoreProduct[] }) {
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
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-l from-[#003b5c] via-[#006494] to-[#00a8e8] p-7 text-white shadow-xl md:p-10">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-xs font-black ring-1 ring-white/20">
                فروشگاه تخصصی لپ‌تاپ و کامپیوتر
              </span>
              <h1 className="mt-5 text-3xl font-black leading-[1.7] md:text-5xl">
                خرید آنلاین لپ‌تاپ نو و کارکرده با مقایسه کامل مشخصات
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-blue-50 md:text-lg">
                مدل‌های منتخب لپ‌تاپ اداری، دانشجویی، مهندسی و گیمینگ را با قیمت،
                گارانتی تست، مشخصات فنی و شرایط ارسال مقایسه کنید.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/shop"
                  className="rounded-2xl bg-white px-7 py-4 text-center text-sm font-black text-[#003b5c] shadow-lg transition hover:bg-blue-50"
                >
                  مشاهده همه لپ‌تاپ‌ها
                </Link>
                <Link
                  href="/cart"
                  className="rounded-2xl border border-white/30 px-7 py-4 text-center text-sm font-black text-white transition hover:bg-white/10"
                >
                  سبد خرید من
                </Link>
              </div>
            </div>
          </div>

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
        <div className="grid gap-3 md:grid-cols-4">
          <Feature icon="🚚" title="ارسال قابل پیگیری" text="ثبت سفارش، هماهنگی ارسال و کد رهگیری" />
          <Feature icon="🛡️" title="مهلت تست" text="امکان بررسی مشخصات و سلامت کالا" />
          <Feature icon="💳" title="پرداخت امن" text="آماده اتصال به درگاه و ثبت سفارش آنلاین" />
          <Feature icon="📊" title="مقایسه فنی" text="بررسی CPU، RAM، حافظه، گارانتی و قیمت" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">
              دسته‌بندی فروشگاهی
            </span>
            <h2 className="mt-3 text-2xl font-black text-slate-900">
              خرید بر اساس نیاز
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            شروع قیمت از {money(minPrice)} · {products.length.toLocaleString("fa-IR")} مدل فعال
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <CategoryBox title="لپ‌تاپ اداری و شرکتی" icon="💼" href="/shop?use=business" />
          <CategoryBox title="لپ‌تاپ دانشجویی" icon="🎓" href="/shop?use=student" />
          <CategoryBox title="لپ‌تاپ مهندسی" icon="🧮" href="/shop?use=engineering" />
          <CategoryBox title="لپ‌تاپ گیمینگ" icon="🎮" href="/shop?use=gaming" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.length > 0
            ? featured.map((product) => <StoreProductCard key={product.id} product={product} />)
            : products.slice(0, 4).map((product) => <StoreProductCard key={product.id} product={product} />)}
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

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-3 font-black text-slate-900">{title}</h3>
      <p className="mt-1 text-xs leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function CategoryBox({ title, icon, href }: { title: string; icon: string; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-rose-200 hover:shadow-lg"
    >
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-4 font-black text-slate-900">{title}</h3>
      <p className="mt-2 text-xs text-slate-500">مشاهده مدل‌های مناسب</p>
    </Link>
  );
}
