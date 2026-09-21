import type { Metadata } from "next";
import Link from "next/link";
import LaptopFilterSidebar, { MobileLaptopFilterMenu } from "@/components/LaptopFilterSidebar";
import StoreProductCard from "@/components/StoreProductCard";
import { getJsonStoreProducts, type JsonStoreProduct } from "@/lib/json-store";
import { laptopCategoryItems } from "@/lib/laptop-storefront";
import { buildSeoMetadata, itemListJsonLd, jsonLd, storeSeoKeywords } from "@/lib/seo";

export const dynamic = "force-dynamic";

type ShopSearchParams = Record<string, string | string[] | undefined>;

type FilterOption = {
  label: string;
  value: string;
  hint?: string;
};

const getParam = (params: ShopSearchParams, key: string) => {
  const value = params[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
};

const lowerSearchText = (product: JsonStoreProduct) =>
  `${product.title} ${product.brand} ${product.category} ${product.summary} ${product.description} ${product.badges.join(" ")} ${Object.values(product.specs || {}).join(" ")}`.toLowerCase();

const useKeyword: Record<string, string[]> = {
  business: ["اداری", "شرکتی", "business", "حسابداری", "برنامه"],
  student: ["دانشجویی", "student", "سبک", "روزمره"],
  engineering: ["مهندسی", "workstation", "مهندس", "رندر", "طراحی", "تدوین"],
  gaming: ["گیمینگ", "gaming", "rtx", "بازی", "144"],
};

const normalizeFilterValue = (value: string) => value.trim().toLowerCase();

function productFilterTags(product: JsonStoreProduct) {
  const text = lowerSearchText(product);
  const tags = new Set<string>();
  const add = (key: string, value: string) =>
    tags.add(`${key}:${normalizeFilterValue(value)}`);

  if (text.includes("8gb")) add("ram", "8GB");
  if (text.includes("16gb")) add("ram", "16GB");
  if (text.includes("32gb")) add("ram", "32GB");
  if (text.includes("ips")) add("panel", "IPS");
  if (text.includes("full hd")) add("panel", "Full HD");
  if (text.includes("retina")) add("panel", "Retina");
  if (text.includes("144hz")) add("panel", "144Hz");
  if (text.includes("13.3") || text.includes("13 اینچ")) add("display", "13");
  if (text.includes("14 اینچ")) add("display", "14");
  if (text.includes("15.6") || text.includes("15.6 اینچ")) add("display", "15.6");
  if (text.includes("i5")) add("cpu", "i5");
  if (text.includes("i7")) add("cpu", "i7");
  if (text.includes("ryzen 7")) add("cpu", "Ryzen 7");
  if (text.includes("m1")) add("cpu", "M1");
  if (text.includes("256gb")) add("ssd", "256GB");
  if (text.includes("512gb")) add("ssd", "512GB");
  if (text.includes("1tb")) add("ssd", "1TB");
  if (text.includes("استوک")) add("condition", "stock");
  if (text.includes("کارکرده")) add("condition", "used");

  const fixedTags: Record<string, string[]> = {
    "lp-thinkpad-t14-g3": [
      "cpuGen:12",
      "gpuType:integrated",
      "gpu:iris",
      "hdd:none",
      "touch:no",
      "cover:matte",
      "cardReader:yes",
      "optical:no",
      "webcam:yes",
      "fingerprint:yes",
      "rotate:no",
      "sim:no",
      "battery:good",
      "battery:long",
      "series:thinkpad",
      "use:business",
      "generationModel:pro",
      "color:black",
      "custom:ssd-upgrade",
      "condition:stock",
    ],
    "lp-dell-latitude-7420": [
      "cpuGen:11",
      "gpuType:integrated",
      "gpu:iris",
      "hdd:none",
      "touch:no",
      "cover:matte",
      "cardReader:yes",
      "optical:no",
      "webcam:yes",
      "fingerprint:yes",
      "rotate:no",
      "sim:no",
      "battery:good",
      "series:latitude",
      "use:business",
      "generationModel:pro",
      "color:gray",
      "condition:stock",
    ],
    "lp-hp-elitebook-840-g8": [
      "cpuGen:11",
      "gpuType:integrated",
      "gpu:iris",
      "hdd:none",
      "touch:no",
      "cover:matte",
      "cardReader:yes",
      "optical:no",
      "webcam:yes",
      "fingerprint:yes",
      "rotate:no",
      "sim:no",
      "battery:good",
      "series:elitebook",
      "use:student",
      "use:business",
      "generationModel:midrange",
      "color:silver",
      "condition:stock",
    ],
    "lp-asus-tuf-f15-rtx3050": [
      "cpuGen:12",
      "gpuType:dedicated",
      "gpuType:rtx",
      "gpu:3050",
      "hdd:none",
      "touch:no",
      "cover:matte",
      "cardReader:no",
      "optical:no",
      "webcam:yes",
      "fingerprint:no",
      "rotate:no",
      "sim:no",
      "battery:good",
      "series:tuf",
      "use:gaming",
      "use:engineering",
      "generationModel:pro",
      "color:black",
      "condition:new",
    ],
    "lp-macbook-air-m1": [
      "cpuGen:apple",
      "gpuType:integrated",
      "gpu:apple-gpu",
      "hdd:none",
      "touch:no",
      "cover:glossy",
      "cardReader:no",
      "optical:no",
      "webcam:yes",
      "fingerprint:yes",
      "rotate:no",
      "sim:no",
      "battery:long",
      "series:macbook",
      "use:student",
      "generationModel:midrange",
      "color:silver",
      "condition:new",
    ],
    "lp-lenovo-legion-5": [
      "cpuGen:ryzen",
      "gpuType:dedicated",
      "gpuType:rtx",
      "gpu:3060",
      "hdd:none",
      "touch:no",
      "cover:matte",
      "cardReader:no",
      "optical:no",
      "webcam:yes",
      "fingerprint:no",
      "rotate:no",
      "sim:no",
      "battery:good",
      "series:legion",
      "use:gaming",
      "use:engineering",
      "generationModel:pro",
      "color:black",
      "custom:ram-upgrade",
      "condition:used",
    ],
  };

  for (const tag of fixedTags[product.id] || []) tags.add(tag.toLowerCase());
  return tags;
}

function matchesFilter(product: JsonStoreProduct, params: ShopSearchParams) {
  const text = lowerSearchText(product);
  const brand = getParam(params, "brand");
  const use = getParam(params, "use");
  const minPrice = Number(getParam(params, "minPrice") || 0);
  const maxPrice = Number(getParam(params, "maxPrice") || 0);
  const tags = productFilterTags(product);

  if (getParam(params, "available") === "1" && product.stock <= 0) return false;
  if (brand && product.brand !== brand) return false;
  if (use) {
    const keywords = useKeyword[use] || [];
    const useTagMatched = tags.has(`use:${normalizeFilterValue(use)}`);
    if (
      !useTagMatched &&
      keywords.length &&
      !keywords.some((keyword) => text.includes(keyword.toLowerCase()))
    )
      return false;
  }

  const tagFilterKeys = [
    "ram",
    "cpu",
    "cpuGen",
    "gpuType",
    "gpu",
    "ssd",
    "hdd",
    "display",
    "panel",
    "touch",
    "cover",
    "cardReader",
    "optical",
    "webcam",
    "fingerprint",
    "rotate",
    "sim",
    "battery",
    "condition",
    "series",
    "generationModel",
    "color",
    "custom",
  ];
  for (const key of tagFilterKeys) {
    const value = getParam(params, key);
    if (value && !tags.has(`${key.toLowerCase()}:${normalizeFilterValue(value)}`))
      return false;
  }

  if (minPrice && product.price < minPrice) return false;
  if (maxPrice && product.price > maxPrice) return false;
  return true;
}

function buildHref(
  params: ShopSearchParams,
  key: string,
  value: string,
  options?: { clearKeys?: string[] },
) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([paramKey, rawValue]) => {
    if (paramKey === key || options?.clearKeys?.includes(paramKey)) return;
    const valueToKeep = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (valueToKeep) query.set(paramKey, valueToKeep);
  });
  if (getParam(params, key) !== value && value) query.set(key, value);
  const payload = query.toString();
  return payload ? `/shop?${payload}` : "/shop";
}

const ramOptions: FilterOption[] = [
  { label: "۸ گیگابایت", value: "8GB" },
  { label: "۱۶ گیگابایت", value: "16GB" },
  { label: "۳۲ گیگابایت", value: "32GB" },
];
const panelOptions: FilterOption[] = [
  { label: "IPS", value: "IPS" },
  { label: "Full HD", value: "Full HD" },
  { label: "Retina", value: "Retina" },
  { label: "144Hz", value: "144Hz" },
];
const displayOptions: FilterOption[] = [
  { label: "۱۳ اینچ", value: "13" },
  { label: "۱۴ اینچ", value: "14" },
  { label: "۱۵.۶ اینچ", value: "15.6" },
];
const cpuOptions: FilterOption[] = [
  { label: "Core i5", value: "i5" },
  { label: "Core i7", value: "i7" },
  { label: "Ryzen 7", value: "Ryzen 7" },
  { label: "Apple M1", value: "M1" },
];
const gpuOptions: FilterOption[] = [
  { label: "Intel Iris Xe", value: "Iris" },
  { label: "NVIDIA RTX", value: "RTX" },
  { label: "RTX 3050", value: "3050" },
  { label: "RTX 3060", value: "3060" },
];
const ssdOptions: FilterOption[] = [
  { label: "۲۵۶ گیگابایت SSD", value: "256GB" },
  { label: "۵۱۲ گیگابایت SSD", value: "512GB" },
  { label: "۱ ترابایت SSD", value: "1TB" },
];
const useOptions: FilterOption[] = [
  { label: "اداری و شرکتی", value: "business" },
  { label: "دانشجویی و سبک", value: "student" },
  { label: "مهندسی و طراحی", value: "engineering" },
  { label: "گیمینگ و تدوین", value: "gaming" },
];
const seriesOptions: FilterOption[] = [
  { label: "ThinkPad", value: "ThinkPad" },
  { label: "Latitude", value: "Latitude" },
  { label: "EliteBook", value: "EliteBook" },
  { label: "TUF Gaming", value: "TUF" },
  { label: "Legion", value: "Legion" },
  { label: "MacBook", value: "MacBook" },
];

const seoFilterLabels: Record<string, Record<string, string>> = {
  brand: {
    Lenovo: "لپ‌تاپ لنوو",
    HP: "لپ‌تاپ اچ‌پی",
    Dell: "لپ‌تاپ دل",
    Asus: "لپ‌تاپ ایسوس",
    Apple: "مک‌بوک اپل",
  },
  use: Object.fromEntries(useOptions.map((option) => [option.value, option.label])),
  condition: {
    stock: "لپ‌تاپ استوک",
    used: "لپ‌تاپ کارکرده تمیز",
    new: "لپ‌تاپ نو",
  },
  ram: Object.fromEntries(ramOptions.map((option) => [option.value, option.label])),
  cpu: Object.fromEntries(cpuOptions.map((option) => [option.value, option.label])),
  gpuType: {
    rtx: "لپ‌تاپ با گرافیک RTX",
    dedicated: "لپ‌تاپ با گرافیک مجزا",
    integrated: "لپ‌تاپ با گرافیک مجتمع",
  },
  ssd: Object.fromEntries(ssdOptions.map((option) => [option.value, option.label])),
  display: Object.fromEntries(displayOptions.map((option) => [option.value, option.label])),
};

const canonicalShopKeys = [
  "brand",
  "use",
  "condition",
  "ram",
  "cpu",
  "gpuType",
  "ssd",
  "display",
  "minPrice",
  "maxPrice",
];

function canonicalShopPath(params: ShopSearchParams) {
  const query = new URLSearchParams();
  for (const key of canonicalShopKeys) {
    const value = getParam(params, key);
    if (value) query.set(key, value);
  }
  const payload = query.toString();
  return payload ? `/shop?${payload}` : "/shop";
}

function shopSeoSubject(params: ShopSearchParams) {
  const labels: string[] = [];
  for (const [key, values] of Object.entries(seoFilterLabels)) {
    const value = getParam(params, key);
    if (value && values[value]) labels.push(values[value]);
  }
  const minPrice = getParam(params, "minPrice");
  const maxPrice = getParam(params, "maxPrice");
  if (maxPrice && !minPrice) labels.push(`لپ‌تاپ تا ${Number(maxPrice).toLocaleString("fa-IR")} تومان`);
  if (minPrice && !maxPrice) labels.push(`لپ‌تاپ از ${Number(minPrice).toLocaleString("fa-IR")} تومان`);
  if (minPrice && maxPrice) {
    labels.push(
      `لپ‌تاپ ${Number(minPrice).toLocaleString("fa-IR")} تا ${Number(maxPrice).toLocaleString("fa-IR")} تومان`,
    );
  }
  return labels.slice(0, 2).join(" و ") || "لپ‌تاپ نو و استوک";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const subject = shopSeoSubject(params);
  const path = canonicalShopPath(params);
  const title =
    subject === "لپ‌تاپ نو و استوک"
      ? "فروشگاه لپ‌تاپ | خرید لپ‌تاپ نو، استوک و گیمینگ"
      : `خرید ${subject} | فروشگاه لپ‌تاپ OptiBid`;

  return buildSeoMetadata({
    title,
    description: `خرید و مقایسه ${subject} در فروشگاه OptiBid با مشخصات کامل، قیمت شفاف، مهلت تست، پشتیبانی خرید و امکان ثبت سفارش آنلاین.`,
    path,
    keywords: [subject, ...storeSeoKeywords].filter(Boolean),
  });
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const params = await searchParams;
  const products = await getJsonStoreProducts();
  const filteredProducts = products.filter((product) => matchesFilter(product, params));
  const brands = Array.from(new Set(products.map((product) => product.brand)));
  const currentShopPath = canonicalShopPath(params);
  const productListStructuredData = itemListJsonLd({
    name: shopSeoSubject(params),
    description: "لیست محصولات فروشگاه لپ‌تاپ OptiBid با قیمت، مشخصات فنی و امکان ثبت سفارش آنلاین.",
    url: currentShopPath,
    items: filteredProducts.slice(0, 24).map((product) => ({
      name: product.title,
      url: `/shop/${product.slug}`,
    })),
  });

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f8fa] pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(productListStructuredData) }}
      />
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

      <section className="mx-auto max-w-7xl px-4 pt-7 sm:px-6 lg:px-8">
        <div className="flex gap-3 overflow-x-auto rounded-[2rem] bg-white p-3 shadow-sm ring-1 ring-slate-200">
          {laptopCategoryItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group min-w-[126px] rounded-2xl border border-slate-100 bg-slate-50 px-3 py-4 text-center transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50"
            >
              <div className="mx-auto mb-3 w-20">
                <div className="mx-auto h-10 rounded-t-xl border-[6px] border-slate-700 bg-gradient-to-br from-[#003b5c] to-[#00a8e8] transition group-hover:border-rose-600" />
                <div className="mx-auto h-2 rounded-b-xl bg-slate-500 transition group-hover:bg-rose-500" />
              </div>
              {item.badge && (
                <span className="mb-1 inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-rose-600 shadow-sm">
                  {item.badge}
                </span>
              )}
              <span className="block text-xs font-black text-slate-700 group-hover:text-rose-600">
                {item.title}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
        <div className="hidden lg:block">
          <LaptopFilterSidebar products={products} params={params} />
        </div>
        <MobileLaptopFilterMenu
          products={products}
          params={params}
          title="فیلترهای فروشگاه"
          subtitle="برای نمایش فیلترهای کامل، این منو را لمس کنید"
        />

        <main className="min-w-0 flex-1">
          <div className="mb-5 flex flex-col gap-3 rounded-[1.5rem] bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {filteredProducts.length.toLocaleString("fa-IR")} کالا
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                فیلترهای سمت راست برای انتخاب دقیق‌تر لپ‌تاپ بر اساس برند، رم، پردازنده، گرافیک و کاربری هستند.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-600">
                ترتیب: پرفروش‌ترین
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-600">
                جدیدترین
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-600">
                کمترین قیمت
              </span>
              <span className="rounded-full bg-rose-50 px-3 py-2 text-rose-600">
                پیشنهاد OptiBid
              </span>
            </div>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              کالایی با این فیلتر پیدا نشد.
              <Link href="/shop" className="mt-4 block font-black text-rose-600">
                حذف فیلترها و مشاهده همه کالاها
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <StoreProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">
              راهنمای خرید لپ‌تاپ در OptiBid
            </h2>
            <div className="mt-3 grid gap-4 text-sm leading-8 text-slate-600 md:grid-cols-3">
              <p>
                در این فروشگاه می‌توانید مدل‌های مختلف لپ‌تاپ لنوو، اچ‌پی، دل، ایسوس و مک‌بوک را بر اساس برند، قیمت، رم، پردازنده، حافظه SSD و نوع کاربری مقایسه کنید.
              </p>
              <p>
                برای خرید لپ‌تاپ اداری، دانشجویی، مهندسی، گیمینگ یا لپ‌تاپ استوک، فیلترهای صفحه کمک می‌کند سریع‌تر به مدل مناسب بودجه و نیازتان برسید.
              </p>
              <p>
                هر محصول دارای صفحه اختصاصی با مشخصات فنی، قیمت، وضعیت موجودی، مهلت تست و پیشنهادهای مشابه است تا انتخاب نهایی مطمئن‌تر انجام شود.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function PriceFilter({ params }: { params: ShopSearchParams }) {
  const options = [
    { label: "تا ۴۵ میلیون تومان", maxPrice: "45000000" },
    { label: "۴۵ تا ۶۰ میلیون", minPrice: "45000000", maxPrice: "60000000" },
    { label: "۶۰ میلیون به بالا", minPrice: "60000000" },
  ];
  return (
    <details className="group border-b border-slate-100 py-3" open>
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-black text-slate-900 [&::-webkit-details-marker]:hidden">
        فیلتر براساس قیمت
        <span className="text-lg text-slate-500 transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="mt-3 grid gap-2">
        {options.map((option) => {
          const href = (() => {
            const query = new URLSearchParams();
            Object.entries(params).forEach(([key, rawValue]) => {
              if (["minPrice", "maxPrice"].includes(key)) return;
              const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
              if (value) query.set(key, value);
            });
            if (option.minPrice) query.set("minPrice", option.minPrice);
            if (option.maxPrice) query.set("maxPrice", option.maxPrice);
            return `/shop?${query.toString()}`;
          })();
          const active =
            getParam(params, "minPrice") === (option.minPrice || "") &&
            getParam(params, "maxPrice") === (option.maxPrice || "");
          return (
            <Link
              key={option.label}
              href={href}
              className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${active ? "border-rose-500 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50"}`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </details>
  );
}

function FilterGroup({
  title,
  queryKey,
  params,
  options,
  defaultOpen = false,
}: {
  title: string;
  queryKey: string;
  params: ShopSearchParams;
  options: FilterOption[];
  defaultOpen?: boolean;
}) {
  return (
    <details className="group border-b border-slate-100 py-3" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-black text-slate-900 [&::-webkit-details-marker]:hidden">
        {title}
        <span className="text-lg text-slate-500 transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = getParam(params, queryKey) === option.value;
          return (
            <Link
              key={`${queryKey}-${option.value}`}
              href={buildHref(params, queryKey, option.value)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${active ? "border-rose-500 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50"}`}
            >
              {option.label}
              {option.hint ? <span className="mr-1 text-slate-400">{option.hint}</span> : null}
            </Link>
          );
        })}
      </div>
    </details>
  );
}

function BooleanGroup({
  title,
  labels,
  defaultOpen = false,
}: {
  title: string;
  labels: string[];
  defaultOpen?: boolean;
}) {
  return (
    <details className="group border-b border-slate-100 py-3" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-black text-slate-900 [&::-webkit-details-marker]:hidden">
        {title}
        <span className="text-lg text-slate-500 transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="mt-3 flex flex-wrap gap-2">
        {labels.map((label) => (
          <span
            key={`${title}-${label}`}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600"
          >
            {label}
          </span>
        ))}
      </div>
    </details>
  );
}
