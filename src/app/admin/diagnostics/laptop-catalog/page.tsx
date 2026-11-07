import Link from "next/link";
import { getOptiBidData } from "@/lib/json-store";
import { productImportCategoryKey } from "@/lib/store-product-import";
import {
  isComputerPartsCatalogProduct,
  isLaptopCatalogProduct,
} from "@/lib/store-catalog-sections";
import { isSuspiciousStoreProductPrice } from "@/lib/store-pricing";
import { storeComputerPartKind } from "@/lib/store-computer-part-kind";

export const dynamic = "force-dynamic";

/** عنوان‌هایی که از نظر کاربر «لپ‌تاپ» به حساب می‌آیند. */
const laptopLook = /لپ ?تاپ|لپ‌تاپ|lپتاپ|laptop|notebook|ultrabook|macbook|مک ?بوک|thinkpad|thinkbook|ideapad|elitebook|probook|vivobook|zenbook|victus|legion|nitro|aspire|latitude|inspiron|pavilion|surface|galaxy ?book|lg ?gram|aorus|razer ?blade/i;

const fa = (value: number) => value.toLocaleString("fa-IR");

type Reason = { label: string; detail: string };

export default async function LaptopCatalogDiagnosticsPage() {
  const data = await getOptiBidData();
  const products = data.storeProducts;

  const laptopProducts = products.filter((product) => isLaptopCatalogProduct(product));
  const partProducts = products.filter((product) => isComputerPartsCatalogProduct(product));
  const keyCounts = new Map<string, number>();
  for (const product of products) {
    const key = productImportCategoryKey(product);
    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
  }

  const laptopLike = products.filter((product) =>
    laptopLook.test(`${product.title} ${product.category}`),
  );

  const hiddenLaptopLike = laptopLike
    .filter((product) => !isLaptopCatalogProduct(product))
    .map((product) => {
      const reasons: Reason[] = [];
      if (!product.isActive) reasons.push({ label: "غیرفعال", detail: "در پنل غیرفعال شده است" });
      if (!(product.stock > 0)) reasons.push({ label: "ناموجود", detail: "موجودی صفر" });
      if (isSuspiciousStoreProductPrice(product))
        reasons.push({ label: "قیمت مشکوک", detail: `${fa(product.price)} تومان` });
      if (!reasons.length)
        reasons.push({
          label: "دسته‌بندی اشتباه",
          detail: `کلید «${productImportCategoryKey(product) || "unknown"}» — قطعه: ${storeComputerPartKind(product) || "—"}`,
        });
      return { product, reasons };
    });

  const categoryCounts = products.reduce((map, product) => {
    const key = product.category || "(بدون دسته)";
    const bucket = map.get(key) ?? { total: 0, laptops: 0 };
    bucket.total += 1;
    if (isLaptopCatalogProduct(product)) bucket.laptops += 1;
    map.set(key, bucket);
    return map;
  }, new Map<string, { total: number; laptops: number }>());

  const reasonCounts = new Map<string, number>();
  for (const item of hiddenLaptopLike) {
    for (const reason of item.reasons) {
      reasonCounts.set(reason.label, (reasonCounts.get(reason.label) ?? 0) + 1);
    }
  }

  const stats = [
    { label: "کل محصولات ذخیره‌شده", value: products.length },
    { label: "فعال", value: products.filter((product) => product.isActive).length },
    { label: "موجود در انبار", value: products.filter((product) => product.stock > 0).length },
    { label: "لپ‌تاپ شناسایی‌شده", value: laptopProducts.length },
    { label: "قطعه کامپیوتر شناسایی‌شده", value: partProducts.length },
    {
      label: "شبیه لپ‌تاپ ولی لپ‌تاپ شناخته نشده",
      value: hiddenLaptopLike.length,
    },
    {
      label: "کل کالاهای شبیه لپ‌تاپ",
      value: laptopLike.length,
    },
    {
      label: "قیمت مشکوک (کل کاتالوگ)",
      value: products.filter((product) => isSuspiciousStoreProductPrice(product)).length,
    },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-black text-slate-900">گزارش دسته‌بندی لپ‌تاپ</h1>
            <div className="flex gap-2 text-xs font-bold">
              <Link href="/admin/dashboard" className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700">
                بازگشت به داشبورد
              </Link>
              <Link href="/shop?category=laptop" className="rounded-xl bg-rose-600 px-3 py-2 text-white">
                صفحهٔ لپ‌تاپ
              </Link>
              <a
                href="/api/admin/laptop-catalog-report"
                className="rounded-xl bg-slate-900 px-3 py-2 text-white"
              >
                دانلود گزارش JSON
              </a>
            </div>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            این صفحه نشان می‌دهد از کل محصولاتِ واردشده، چند مورد لپ‌تاپ شناخته شده و کدام
            محصولاتِ شبیه لپ‌تاپ بیرون مانده‌اند؛ همراه با دلیل هر مورد.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="text-2xl font-black text-slate-900">{fa(item.value)}</div>
              <div className="mt-1 text-xs font-bold text-slate-500">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-black text-slate-900">دستهٔ ثبت‌شده در ورود کالا</h2>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {Array.from(categoryCounts.entries())
              .sort((a, b) => b[1].total - a[1].total)
              .slice(0, 24)
              .map(([category, bucket]) => (
                <span key={category} className="rounded-full bg-slate-100 px-3 py-2 text-slate-700">
                  {category} : {fa(bucket.total)} کالا / {fa(bucket.laptops)} لپ‌تاپ
                </span>
              ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-black text-slate-900">توزیع دسته‌بندی خودکار</h2>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {Array.from(keyCounts.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([key, count]) => (
                <span key={key} className="rounded-full bg-slate-100 px-3 py-2 text-slate-700">
                  {key} : {fa(count)}
                </span>
              ))}
          </div>
          {reasonCounts.size > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
              {Array.from(reasonCounts.entries()).map(([label, count]) => (
                <span key={label} className="rounded-full bg-rose-50 px-3 py-2 text-rose-700">
                  {label} : {fa(count)}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-sm font-black text-slate-900">
            محصولات شبیه لپ‌تاپ که لپ‌تاپ شناخته نشده‌اند ({fa(hiddenLaptopLike.length)})
          </h2>
          <div className="space-y-2">
            {hiddenLaptopLike.slice(0, 120).map(({ product, reasons }) => (
              <div
                key={product.id}
                className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs md:flex-row md:items-center md:justify-between"
              >
                <span className="font-bold text-slate-800">{product.title}</span>
                <span className="flex flex-wrap gap-2">
                  {reasons.map((reason) => (
                    <span
                      key={reason.label}
                      className="rounded-full bg-white px-2 py-1 font-bold text-rose-600 ring-1 ring-rose-100"
                    >
                      {reason.label}: {reason.detail}
                    </span>
                  ))}
                </span>
              </div>
            ))}
            {hiddenLaptopLike.length === 0 && (
              <p className="text-xs text-slate-500">همهٔ کالاهای شبیه لپ‌تاپ در دستهٔ لپ‌تاپ هستند.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-sm font-black text-slate-900">
            نمونهٔ لپ‌تاپ‌های شناسایی‌شده ({fa(laptopProducts.length)})
          </h2>
          <div className="space-y-1 text-xs text-slate-600">
            {laptopProducts.slice(0, 40).map((product) => (
              <div key={product.id} className="rounded-lg bg-slate-50 px-3 py-2">
                {product.title}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
