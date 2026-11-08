import Link from "next/link";

export type LaptopCatalogNoticeData = {
  total: number;
  laptops: number;
  laptopLook: number;
  missed: number;
  categoryLaptops: number;
  samples: Array<{ title: string; key: string }>;
};

const fa = (value: number) => value.toLocaleString("fa-IR");

/**
 * یادداشت کوچک عیب‌یابی، فقط برای ادمین و فقط در صفحهٔ دستهٔ لپ‌تاپ.
 * کاربران عادی (و بازدیدکننده‌های وارد‌نشده) این کادر را نمی‌بینند.
 */
export default function LaptopCatalogAdminNotice({ data }: { data: LaptopCatalogNoticeData }) {
  return (
    <div className="mb-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-6 text-amber-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-bold">
          یادداشت ادمین (کاربران عادی نمی‌بینند): {fa(data.laptops)} لپ‌تاپ از {fa(data.total)} کالا ·{" "}
          {fa(data.laptopLook)} کالا شبیه لپ‌تاپ · {fa(data.missed)} موردشان داخل این دسته نیست ·{" "}
          {fa(data.categoryLaptops)} کالا با دستهٔ ثبت‌شدهٔ «لپ‌تاپ»
        </div>
        <Link
          href="/admin/diagnostics/laptop-catalog"
          className="rounded-lg bg-amber-600 px-2.5 py-1 font-bold text-white"
        >
          گزارش کامل
        </Link>
      </div>
      {data.missed > 0 && (
        <details className="mt-1">
          <summary className="cursor-pointer font-bold text-amber-800">نمونه‌ها</summary>
          <ul className="mt-1 list-disc space-y-0.5 pr-5">
            {data.samples.map((sample) => (
              <li key={sample.title}>
                {sample.title} <span className="text-amber-700">[{sample.key}]</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
