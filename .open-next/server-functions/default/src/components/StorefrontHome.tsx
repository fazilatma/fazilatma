import Link from "next/link";
import HorizontalScroller from "@/components/HorizontalScroller";
import LaptopFilterSidebar, { MobileLaptopFilterMenu } from "@/components/LaptopFilterSidebar";
import StoreAdSlider from "@/components/StoreAdSlider";
import StoreHeroSlider from "@/components/StoreHeroSlider";
import StoreProductCard from "@/components/StoreProductCard";
import {
  getLaptopCollectionProducts,
  laptopCollectionItems,
  laptopGuideItems,
  type LaptopCollectionItem,
  type LaptopGuideItem,
} from "@/lib/laptop-storefront";
import type { HomepageImageSliderSlide, JsonStoreProduct } from "@/lib/json-store";

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
  const collectionRows = laptopCollectionItems.map((collection) => ({
    collection,
    products: getLaptopCollectionProducts(products, collection.slug).slice(0, 3),
  }));
  const specialOfferProducts =
    getLaptopCollectionProducts(products, "special-offers").slice(0, 8);

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f8fa] pb-16">
      <section className="bg-white">
        <div className="grid w-full gap-4 px-2 py-5 sm:px-4 lg:grid-cols-[292px_minmax(0,1fr)] lg:px-5 xl:px-6 2xl:px-8">
          <div className="hidden lg:block">
            <LaptopFilterSidebar products={products} sticky={false} />
          </div>

          <div className="min-w-0 space-y-5">
            <StoreHeroSlider
              slides={heroSlides}
              durationSeconds={heroDurationSeconds}
            />
            <StoreAdSlider />
            <MobileLaptopFilterMenu
              products={products}
              title="فیلتر سریع لپ‌تاپ"
              subtitle="برای باز کردن فیلترهای کامل، این منو را لمس کنید"
            />
            <StoreLaptopBrandSlider />
            <SmartLaptopPickStrip />
            <SpecialOfferCarousel
              products={specialOfferProducts.length > 0 ? specialOfferProducts : featured}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                مسیرهای سریع خرید
              </span>
              <h2 className="mt-3 text-2xl font-black text-slate-900">
                پیشنهاد خرید بر اساس بودجه و کاربری
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                مسیرهای آماده برای رسیدن سریع به لپ‌تاپ مناسب دانشجویی، اداری، مهندسی یا گیمینگ.
              </p>
            </div>
            <Link href="/shop" className="text-sm font-black text-emerald-700">
              مشاهده همه مدل‌ها ←
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <QuickPathCard
              title="اقتصادی و دانشجویی"
              text="مدل‌های سبک، قیمت منطقی و مناسب کلاس، وب‌گردی و کار روزمره."
              href="/shop?use=student&maxPrice=45000000"
              icon="🎓"
              color="emerald"
            />
            <QuickPathCard
              title="اداری و شرکتی"
              text="لپ‌تاپ‌های پایدار برای حسابداری، آفیس، جلسات و استفاده طولانی."
              href="/shop?use=business&ram=16GB"
              icon="💼"
              color="blue"
            />
            <QuickPathCard
              title="مهندسی و طراحی"
              text="پردازنده قوی، رم بالاتر و SSD پرسرعت برای نرم‌افزارهای تخصصی."
              href="/shop?use=engineering&ram=16GB"
              icon="🧮"
              color="amber"
            />
            <QuickPathCard
              title="گیمینگ و تدوین"
              text="مدل‌های RTX و گرافیک مجزا برای بازی، تدوین و کارهای سنگین."
              href="/shop?use=gaming&gpuType=rtx"
              icon="🎮"
              color="rose"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                راهنمای سریع فروشگاه
              </span>
              <h2 className="mt-3 text-2xl font-black text-slate-900">
                قبل از خرید، نیازت را دقیق‌تر مشخص کن
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
                چک‌لیست خرید مطمئن لپ‌تاپ
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                نکاتی که قبل از خرید لپ‌تاپ نو، استوک یا کارکرده بهتر است بررسی کنید.
              </p>
            </div>
            <Link href="/support" className="text-sm font-black text-rose-600">
              مشاوره و پشتیبانی خرید ←
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <TrustCard icon="🧪" title="مهلت تست و بررسی سلامت" text="قبل از نهایی‌کردن خرید، سلامت باتری، نمایشگر، پورت‌ها و قطعات را بررسی کنید." />
            <TrustCard icon="⚙️" title="مقایسه کانفیگ واقعی" text="CPU، RAM، SSD، گرافیک و نسل پردازنده را با نیاز خودتان تطبیق دهید." />
            <TrustCard icon="🔋" title="باتری و شارژدهی" text="برای مدل‌های کارکرده، سلامت باتری و شارژدهی روزانه اهمیت زیادی دارد." />
            <TrustCard icon="🚚" title="ارسال قابل پیگیری" text="پس از ثبت سفارش، اطلاعات ارسال و هماهنگی تحویل از مسیر پشتیبانی قابل پیگیری است." />
            <TrustCard icon="💳" title="پرداخت امن" text="در فاز فروشگاهی، سفارش از مسیر پرداخت آنلاین یا روش‌های فعال سایت ثبت می‌شود." />
            <TrustCard icon="🎧" title="مشاوره انتخاب مدل" text="اگر بین چند مدل مردد هستید، از بخش پشتیبانی آنلاین برای انتخاب بهتر کمک بگیرید." />
          </div>
        </div>
      </section>
    </div>
  );
}


const brandCircleItems = [
  { title: "Asus", subtitle: "TUF / VivoBook", href: "/shop?brand=Asus", color: "from-indigo-500 to-fuchsia-500" },
  { title: "Lenovo", subtitle: "ThinkPad / Legion", href: "/shop?brand=Lenovo", color: "from-red-500 to-slate-800" },
  { title: "HP", subtitle: "EliteBook", href: "/shop?brand=HP", color: "from-sky-500 to-blue-700" },
  { title: "Dell", subtitle: "Latitude", href: "/shop?brand=Dell", color: "from-cyan-500 to-slate-700" },
  { title: "Apple", subtitle: "MacBook", href: "/shop?brand=Apple", color: "from-slate-500 to-slate-900" },
  { title: "RTX", subtitle: "گیمینگ", href: "/shop?gpuType=rtx", color: "from-rose-500 to-orange-500" },
  { title: "SSD", subtitle: "سرعت بالا", href: "/shop?ssd=512GB", color: "from-emerald-500 to-teal-700" },
  { title: "i7", subtitle: "حرفه‌ای", href: "/shop?cpu=i7", color: "from-violet-500 to-[#003b5c]" },
];

function StoreLaptopBrandSlider() {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
            انتخاب سریع برند و مشخصات
          </span>
          <h2 className="mt-2 text-xl font-black text-slate-900">
            برندهای محبوب و گزینه‌های پرجستجو
          </h2>
        </div>
        <Link href="/shop" className="text-xs font-black text-rose-600 md:text-sm">
          مشاهده همه لپ‌تاپ‌ها ←
        </Link>
      </div>
      <HorizontalScroller
        arrowClassName="bg-white/95 text-[#003b5c] hover:bg-white"
        contentClassName="flex gap-3 overflow-x-auto scroll-smooth pb-1"
        scrollAmount={420}
      >
        {brandCircleItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group w-32 shrink-0 text-center"
          >
            <div
              className={`mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br ${item.color} p-[3px] shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-lg`}
            >
              <div className="grid h-full w-full place-items-center rounded-full bg-white text-xl font-black text-slate-800">
                {item.title}
              </div>
            </div>
            <p className="mt-2 text-xs font-black text-slate-800 group-hover:text-rose-600">
              {item.subtitle}
            </p>
          </Link>
        ))}
      </HorizontalScroller>
    </section>
  );
}

function SmartLaptopPickStrip() {
  const picks = [
    {
      title: "برای کار اداری",
      text: "ThinkPad، Latitude یا EliteBook با رم ۱۶ گیگ و SSD انتخاب امن‌تری است.",
      href: "/shop?use=business&ram=16GB",
      icon: "💼",
      color: "bg-blue-50 text-blue-800 border-blue-100",
    },
    {
      title: "برای دانشجو",
      text: "وزن کم، باتری سالم و نمایشگر ۱۴ اینچ برای حمل روزانه مناسب‌تر است.",
      href: "/shop?use=student&display=14",
      icon: "🎓",
      color: "bg-emerald-50 text-emerald-800 border-emerald-100",
    },
    {
      title: "برای گیم و تدوین",
      text: "مدل‌های دارای RTX و خنک‌کنندگی بهتر را در اولویت بگذارید.",
      href: "/shop?use=gaming&gpuType=rtx",
      icon: "🎮",
      color: "bg-rose-50 text-rose-800 border-rose-100",
    },
    {
      title: "برای خرید اقتصادی",
      text: "استوک تمیز با مهلت تست می‌تواند بهترین نسبت قیمت به کارایی باشد.",
      href: "/shop?condition=stock&maxPrice=45000000",
      icon: "💰",
      color: "bg-amber-50 text-amber-800 border-amber-100",
    },
  ];

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
            پیشنهاد هوشمند OptiBid
          </span>
          <h2 className="mt-2 text-xl font-black text-slate-900">
            نمی‌دانی کدام لپ‌تاپ مناسب‌تر است؟
          </h2>
        </div>
        <Link href="/shop/guides" className="text-xs font-black text-rose-600 md:text-sm">
          راهنمای کامل خرید ←
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {picks.map((pick) => (
          <Link
            key={pick.title}
            href={pick.href}
            className={`rounded-2xl border p-4 transition hover:-translate-y-1 hover:shadow-md ${pick.color}`}
          >
            <div className="text-2xl">{pick.icon}</div>
            <h3 className="mt-2 text-sm font-black">{pick.title}</h3>
            <p className="mt-1 text-xs leading-6 opacity-80">{pick.text}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SpecialOfferCarousel({ products }: { products: JsonStoreProduct[] }) {
  return (
    <section className="rounded-[2rem] border border-rose-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">
            پیشنهاد ویژه
          </span>
          <h2 className="mt-2 text-xl font-black text-slate-900 md:text-2xl">
            پیشنهادهای ویژه امروز
          </h2>
          <p className="mt-1 text-sm leading-7 text-slate-500">
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
        {products.map((product) => (
          <div key={`hero-special-${product.id}`} className="w-[270px] shrink-0 md:w-[300px]">
            <StoreProductCard product={product} />
          </div>
        ))}
      </HorizontalScroller>
    </section>
  );
}

function QuickPathCard({
  title,
  text,
  href,
  icon,
  color,
}: {
  title: string;
  text: string;
  href: string;
  icon: string;
  color: "emerald" | "blue" | "amber" | "rose";
}) {
  const colors = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    blue: "border-blue-100 bg-blue-50 text-blue-800 hover:bg-blue-100",
    amber: "border-amber-100 bg-amber-50 text-amber-800 hover:bg-amber-100",
    rose: "border-rose-100 bg-rose-50 text-rose-800 hover:bg-rose-100",
  }[color];
  return (
    <Link
      href={href}
      className={`rounded-3xl border p-5 transition hover:-translate-y-1 hover:shadow-lg ${colors}`}
    >
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-3 font-black">{title}</h3>
      <p className="mt-2 text-xs leading-6 opacity-80">{text}</p>
    </Link>
  );
}

function TrustCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-blue-100 hover:bg-blue-50/60 hover:shadow-md">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-3 font-black text-slate-900">{title}</h3>
      <p className="mt-2 text-xs leading-6 text-slate-500">{text}</p>
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
