import Link from "next/link";
import type { JsonStoreProduct } from "@/lib/json-store";

export type LaptopFilterParams = Record<string, string | string[] | undefined>;

type FilterOption = {
  label: string;
  value: string;
};

const getParam = (params: LaptopFilterParams, key: string) => {
  const value = params[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
};

function buildHref(params: LaptopFilterParams, key: string, value: string) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([paramKey, rawValue]) => {
    if (paramKey === key) return;
    const valueToKeep = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (valueToKeep) query.set(paramKey, valueToKeep);
  });
  if (getParam(params, key) !== value && value) query.set(key, value);
  const payload = query.toString();
  return payload ? `/shop?${payload}` : "/shop";
}

function priceHref(
  params: LaptopFilterParams,
  option: { minPrice?: string; maxPrice?: string },
) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, rawValue]) => {
    if (["minPrice", "maxPrice"].includes(key)) return;
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (value) query.set(key, value);
  });
  if (option.minPrice) query.set("minPrice", option.minPrice);
  if (option.maxPrice) query.set("maxPrice", option.maxPrice);
  const payload = query.toString();
  return payload ? `/shop?${payload}` : "/shop";
}

function activeCount(params: LaptopFilterParams) {
  return [
    "available",
    "brand",
    "use",
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
    "minPrice",
    "maxPrice",
  ].filter((key) => Boolean(getParam(params, key))).length;
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

const cpuSeriesOptions: FilterOption[] = [
  { label: "Core i5", value: "i5" },
  { label: "Core i7", value: "i7" },
  { label: "Ryzen 7", value: "Ryzen 7" },
  { label: "Apple M1", value: "M1" },
];

const cpuGenerationOptions: FilterOption[] = [
  { label: "نسل ۱۱", value: "11" },
  { label: "نسل ۱۲", value: "12" },
  { label: "Ryzen", value: "Ryzen" },
  { label: "Apple Silicon", value: "Apple" },
];

const gpuTypeOptions: FilterOption[] = [
  { label: "گرافیک مجتمع", value: "integrated" },
  { label: "گرافیک مجزا", value: "dedicated" },
  { label: "NVIDIA RTX", value: "rtx" },
];

const gpuModelOptions: FilterOption[] = [
  { label: "Intel Iris Xe", value: "iris" },
  { label: "RTX 3050", value: "3050" },
  { label: "RTX 3060", value: "3060" },
  { label: "Apple GPU", value: "apple-gpu" },
];

const hddOptions: FilterOption[] = [
  { label: "بدون HDD", value: "none" },
  { label: "۱ ترابایت HDD", value: "1tb-hdd" },
];

const ssdOptions: FilterOption[] = [
  { label: "۲۵۶ گیگابایت SSD", value: "256GB" },
  { label: "۵۱۲ گیگابایت SSD", value: "512GB" },
  { label: "۱ ترابایت SSD", value: "1TB" },
];

const batteryOptions: FilterOption[] = [
  { label: "سلامت بالای ۸۰٪", value: "good" },
  { label: "شارژدهی مناسب", value: "long" },
];

const seriesOptions: FilterOption[] = [
  { label: "ThinkPad", value: "thinkpad" },
  { label: "Latitude", value: "latitude" },
  { label: "EliteBook", value: "elitebook" },
  { label: "TUF Gaming", value: "tuf" },
  { label: "Legion", value: "legion" },
  { label: "MacBook", value: "macbook" },
];

const useOptions: FilterOption[] = [
  { label: "اداری و شرکتی", value: "business" },
  { label: "دانشجویی و سبک", value: "student" },
  { label: "مهندسی و طراحی", value: "engineering" },
  { label: "گیمینگ و تدوین", value: "gaming" },
];

const generationModelOptions: FilterOption[] = [
  { label: "اقتصادی", value: "economy" },
  { label: "میان‌رده", value: "midrange" },
  { label: "حرفه‌ای", value: "pro" },
];

const colorOptions: FilterOption[] = [
  { label: "مشکی", value: "black" },
  { label: "نقره‌ای", value: "silver" },
  { label: "خاکستری", value: "gray" },
];

const customOptions: FilterOption[] = [
  { label: "ارتقا رم", value: "ram-upgrade" },
  { label: "ارتقا SSD", value: "ssd-upgrade" },
];

export default function LaptopFilterSidebar({
  products,
  params = {},
  sticky = true,
}: {
  products: JsonStoreProduct[];
  params?: LaptopFilterParams;
  sticky?: boolean;
}) {
  const brands = Array.from(new Set(products.map((product) => product.brand)));
  const appliedFilters = activeCount(params);

  return (
    <aside
      className={`h-fit rounded-[1.75rem] border border-slate-200 bg-white shadow-sm ${sticky ? "lg:sticky lg:top-24" : ""} lg:w-[318px] lg:flex-none`}
      aria-label="فیلترهای فروشگاه لپ‌تاپ"
    >
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <h2 className="text-lg font-black text-slate-900">فیلترها</h2>
          <p className="mt-1 text-xs text-slate-500">
            {appliedFilters
              ? `${appliedFilters.toLocaleString("fa-IR")} فیلتر فعال`
              : "مشخصات کامل لپ‌تاپ"}
          </p>
        </div>
        <Link
          href="/shop"
          className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-600 hover:bg-rose-50 hover:text-rose-600"
        >
          حذف همه
        </Link>
      </div>

      <div className="max-h-[calc(100vh-150px)] overflow-y-auto p-5 pt-2">
        <Link
          href={buildHref(params, "available", "1")}
          className="mb-2 flex items-center justify-between rounded-2xl px-2 py-3 text-sm font-black text-slate-800 hover:bg-slate-50"
        >
          <span>فقط کالاهای موجود</span>
          <span
            className={`relative h-5 w-10 rounded-full border transition ${getParam(params, "available") === "1" ? "border-rose-500 bg-rose-500" : "border-slate-300 bg-white"}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${getParam(params, "available") === "1" ? "right-5" : "right-0.5 bg-slate-200"}`}
            />
          </span>
        </Link>

        <PriceFilter params={params} />
        <FilterGroup title="برندها" queryKey="brand" params={params} options={brands.map((brand) => ({ label: brand, value: brand }))} />
        <FilterGroup title="ظرفیت حافظه RAM" queryKey="ram" params={params} options={ramOptions} />
        <FilterGroup title="نوع پنل" queryKey="panel" params={params} options={panelOptions} />
        <FilterGroup title="ابعاد نمایشگر" queryKey="display" params={params} options={displayOptions} />
        <FilterGroup title="صفحه نمایش لمسی" queryKey="touch" params={params} options={[{ label: "دارد", value: "yes" }, { label: "ندارد", value: "no" }]} />
        <FilterGroup title="پوشش نمایشگر" queryKey="cover" params={params} options={[{ label: "مات", value: "matte" }, { label: "براق", value: "glossy" }]} />
        <FilterGroup title="سری پردازنده مرکزی" queryKey="cpu" params={params} options={cpuSeriesOptions} />
        <FilterGroup title="نسل پردازنده مرکزی" queryKey="cpuGen" params={params} options={cpuGenerationOptions} />
        <FilterGroup title="نوع پردازنده گرافیکی" queryKey="gpuType" params={params} options={gpuTypeOptions} />
        <FilterGroup title="مدل پردازنده گرافیکی" queryKey="gpu" params={params} options={gpuModelOptions} />
        <FilterGroup title="ظرفیت حافظه HDD" queryKey="hdd" params={params} options={hddOptions} />
        <FilterGroup title="ظرفیت حافظه SSD" queryKey="ssd" params={params} options={ssdOptions} />
        <FilterGroup title="درگاه کارت خوان" queryKey="cardReader" params={params} options={[{ label: "دارد", value: "yes" }, { label: "ندارد", value: "no" }]} defaultOpen />
        <FilterGroup title="درایو نوری" queryKey="optical" params={params} options={[{ label: "دارد", value: "yes" }, { label: "ندارد", value: "no" }]} />
        <FilterGroup title="وب کم" queryKey="webcam" params={params} options={[{ label: "دارد", value: "yes" }, { label: "ندارد", value: "no" }]} />
        <FilterGroup title="حسگر اثر انگشت" queryKey="fingerprint" params={params} options={[{ label: "دارد", value: "yes" }, { label: "ندارد", value: "no" }]} />
        <FilterGroup title="امکان چرخش ۳۶۰ درجه" queryKey="rotate" params={params} options={[{ label: "دارد", value: "yes" }, { label: "ندارد", value: "no" }]} />
        <FilterGroup title="پشتیبانی از سیم کارت" queryKey="sim" params={params} options={[{ label: "دارد", value: "yes" }, { label: "ندارد", value: "no" }]} />
        <FilterGroup title="باتری" queryKey="battery" params={params} options={batteryOptions} />
        <FilterGroup title="وضعیت کالا" queryKey="condition" params={params} options={[{ label: "لپ‌تاپ استوک", value: "stock" }, { label: "کارکرده تمیز", value: "used" }, { label: "نو", value: "new" }]} />
        <FilterGroup title="سری لپ‌تاپ" queryKey="series" params={params} options={seriesOptions} />
        <FilterGroup title="نوع کاربری" queryKey="use" params={params} options={useOptions} />
        <FilterGroup title="نسل و مدل" queryKey="generationModel" params={params} options={generationModelOptions} />
        <FilterGroup title="رنگ‌ها" queryKey="color" params={params} options={colorOptions} />
        <FilterGroup title="کاستوم شده" queryKey="custom" params={params} options={customOptions} />
      </div>
    </aside>
  );
}

function PriceFilter({ params }: { params: LaptopFilterParams }) {
  const options = [
    { label: "تا ۴۵ میلیون تومان", maxPrice: "45000000" },
    { label: "۴۵ تا ۶۰ میلیون", minPrice: "45000000", maxPrice: "60000000" },
    { label: "۶۰ میلیون به بالا", minPrice: "60000000" },
  ];
  return (
    <details className="group border-b border-slate-100 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-black text-slate-900 [&::-webkit-details-marker]:hidden">
        فیلتر براساس قیمت
        <span className="text-lg text-slate-500 transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="mt-3 grid gap-2">
        {options.map((option) => {
          const active =
            getParam(params, "minPrice") === (option.minPrice || "") &&
            getParam(params, "maxPrice") === (option.maxPrice || "");
          return (
            <Link
              key={option.label}
              href={priceHref(params, option)}
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
  params: LaptopFilterParams;
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
            </Link>
          );
        })}
      </div>
    </details>
  );
}
