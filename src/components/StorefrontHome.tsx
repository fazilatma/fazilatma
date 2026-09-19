import Link from "next/link";
import HorizontalScroller from "@/components/HorizontalScroller";
import LaptopFilterSidebar from "@/components/LaptopFilterSidebar";
import StoreHeroSlider from "@/components/StoreHeroSlider";
import StoreProductCard from "@/components/StoreProductCard";
import {
  getLaptopCollectionProducts,
  laptopCategoryItems,
  laptopCollectionItems,
  laptopGuideItems,
  type LaptopCollectionItem,
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
  const bottomLaptopCategories = laptopCategoryItems.slice(0, 24);
  const minPrice = products.reduce(
    (min, product) => Math.min(min, product.price),
    products[0]?.price || 0,
  );
  const collectionRows = laptopCollectionItems.map((collection) => ({
    collection,
    products: getLaptopCollectionProducts(products, collection.slug).slice(0, 3),
  }));
  const specialOfferProducts =
    getLaptopCollectionProducts(products, "special-offers").slice(0, 8);

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f8fa] pb-16">
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[318px_minmax(0,1fr)] lg:px-8">
          <LaptopFilterSidebar products={products} sticky={false} />

          <div className="min-w-0">
            <StoreHeroSlider
              slides={heroSlides}
              durationSeconds={heroDurationSeconds}
            />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">
                پیشنهاد ویژه
              </span>
              <h2 className="mt-3 text-2xl font-black text-slate-900">
                پیشنهادهای ویژه امروز
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                چند مدل منتخب با قیمت جذاب‌تر؛ با فلش‌ها بین پیشنهادها جابه‌جا شوید.
              </p>
            </div>
            <Link href="/shop/collections/special-offers" className="text-sm font-black text-rose-600">
              مشاهده همه فروش ویژه ←
            </Link>
          </div>
          <HorizontalScroller
            arrowClassName="bg-white/95 text-rose-600 hover:bg-white"
            contentClassName="flex gap-4 overflow-x-auto scroll-smooth pb-2"
            scrollAmount={560}
          >
            {(specialOfferProducts.length > 0 ? specialOfferProducts : featured).map(
              (product) => (
                <div key={`hero-special-${product.id}`} className="w-[270px] shrink-0 md:w-[300px]">
                  <StoreProductCard product={product} />
                </div>
              ),
            )}
          </HorizontalScroller>
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

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {collectionRows.map(({ collection, products: rowProducts }) => (
          <StoreCollectionRow
            key={collection.slug}
            collection={collection}
            products={rowProducts}
          />
        ))}
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
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                دسته‌بندی‌های محبوب لپ‌تاپ
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                انتخاب سریع بین برندها، کاربری‌ها و مشخصات مهم لپ‌تاپ؛ حداقل ۱۰ دسته برای دسترسی سریع‌تر خریدار.
              </p>
            </div>
            <Link href="/shop" className="text-sm font-black text-rose-600">
              مشاهده همه دسته‌ها ←
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {bottomLaptopCategories.map((item) => (
              <Link
                key={`bottom-${item.title}`}
                href={item.href}
                className="group rounded-3xl border border-slate-200 bg-slate-50 px-4 py-5 text-center transition hover:-translate-y-1 hover:border-rose-200 hover:bg-rose-50 hover:shadow-lg"
              >
                <div className="mx-auto mb-3 w-20">
                  <div className="mx-auto h-10 rounded-t-xl border-[6px] border-slate-700 bg-gradient-to-br from-[#003b5c] to-[#00a8e8] transition group-hover:border-rose-600" />
                  <div className="mx-auto h-2 rounded-b-xl bg-slate-500 transition group-hover:bg-rose-500" />
                </div>
                {item.badge && (
                  <span className="mb-2 inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-rose-600 shadow-sm">
                    {item.badge}
                  </span>
                )}
                <span className="block text-sm font-black text-slate-700 group-hover:text-rose-600">
                  {item.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function CollectionIcon({ icon }: { icon: LaptopCollectionItem["icon"] }) {
  const common = "h-7 w-7";
  if (icon === "trend") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 17 9 12l4 4 7-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 7h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (icon === "fire") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 21c3.9 0 7-2.7 7-6.6 0-2.8-1.6-5.1-3.3-6.9-.5 2-1.6 3.2-3 4.2.2-3.2-1-5.8-3.5-8.2.2 4.2-4.2 6-4.2 10.9C5 18.3 8.1 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 12v8H4v-8m16 0H4m16 0H4m4-4a2 2 0 1 1 4 0v4H8V8Zm8 0a2 2 0 1 0-4 0v4h4V8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StoreCollectionRow({
  collection,
  products,
}: {
  collection: LaptopCollectionItem;
  products: JsonStoreProduct[];
}) {
  const colors = {
    emerald: {
      badge: "bg-emerald-50 text-emerald-700",
      icon: "bg-emerald-100 text-emerald-700",
      link: "text-emerald-700 hover:text-emerald-800",
      border: "border-emerald-100",
    },
    blue: {
      badge: "bg-blue-50 text-blue-700",
      icon: "bg-blue-100 text-blue-700",
      link: "text-blue-700 hover:text-blue-800",
      border: "border-blue-100",
    },
    rose: {
      badge: "bg-rose-50 text-rose-700",
      icon: "bg-rose-100 text-rose-700",
      link: "text-rose-700 hover:text-rose-800",
      border: "border-rose-100",
    },
  }[collection.accent];

  return (
    <div className={`rounded-[2rem] border bg-white p-5 shadow-sm ${colors.border}`}>
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="flex items-start gap-3">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${colors.icon}`}>
            <CollectionIcon icon={collection.icon} />
          </div>
          <div>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${colors.badge}`}>
              {collection.badge}
            </span>
            <h2 className="mt-3 text-2xl font-black text-slate-900">
              {collection.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
              {collection.subtitle}
            </p>
          </div>
        </div>
        <Link href={collection.href} className={`text-sm font-black ${colors.link}`}>
          مشاهده صفحه {collection.shortTitle} ←
        </Link>
      </div>
      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          فعلاً محصولی برای این بخش ثبت نشده است.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <StoreProductCard key={`${collection.slug}-${product.id}`} product={product} />
          ))}
        </div>
      )}
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
