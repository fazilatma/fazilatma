import type { ProductValuationFactors } from "@/lib/request-valuation";

type Specs = Partial<ProductValuationFactors> | null | undefined;

const conditionLabels: Record<string, string> = {
  new: "کاملاً نو",
  open_box: "اپن‌باکس",
  refurbished: "ریفربیشد",
  used_like_new: "در حد نو",
  used_good: "دست‌دوم سالم",
  used_fair: "کارکرده معمولی",
  for_parts: "نیازمند تعمیر/قطعاتی",
  unknown: "نامشخص",
};

const warrantyLabels: Record<string, string> = {
  manufacturer: "گارانتی رسمی",
  seller: "گارانتی فروشنده",
  test: "مهلت تست",
  none: "بدون گارانتی",
  unknown: "نامشخص",
};

const partsHealthLabels: Record<string, string> = {
  all_healthy: "همه قطعات سالم",
  minor_issue: "ایراد جزئی",
  needs_repair: "نیازمند تعمیر",
  unknown: "نامشخص",
};

const appearanceLabels: Record<string, string> = {
  A: "A - بسیار تمیز",
  B: "B - خط‌وخش جزئی",
  C: "C - آسیب قابل مشاهده",
  unknown: "نامشخص",
};

const repairLabels: Record<string, string> = {
  none: "بدون تعمیر",
  minor: "تعمیر جزئی",
  major: "تعمیر اساسی",
  unknown: "نامشخص",
};

const usageLabels: Record<string, string> = {
  low: "کم‌کارکرد",
  normal: "کارکرد معمولی",
  heavy: "پرکارکرد",
  unknown: "نامشخص",
};

const accessoryLabels: Record<string, string> = {
  complete: "کامل",
  missing_minor: "کسری جزئی",
  missing_key: "کسری مهم",
  unknown: "نامشخص",
};

const yesNoLabels: Record<string, string> = {
  yes: "دارد",
  no: "ندارد",
  unknown: "نامشخص",
};

const marketLabels: Record<string, string> = {
  available: "موجود و رایج",
  rare: "کمیاب",
  discontinued: "توقف تولید / قدیمی",
  unknown: "نامشخص",
};

function faNumber(value?: string | number) {
  const text = String(value || "").trim();
  if (!text) return "";
  const number = Number(text.replace(/,/g, ""));
  return Number.isFinite(number) ? number.toLocaleString("fa-IR") : text;
}

function money(value?: string | number) {
  const raw = String(value || "").replace(/\D/g, "");
  return raw ? `${Number(raw).toLocaleString("fa-IR")} تومان` : "";
}

function label(map: Record<string, string>, value?: string) {
  const key = String(value || "");
  return map[key] || key;
}

function buildSpecRows(factors: Specs) {
  const f = factors || {};
  return [
    ["قیمت مرجع بازار/ترب", money(f.sameNewProductPrice)],
    ["تعداد هسته CPU", f.cpuCores ? `${faNumber(f.cpuCores)} هسته` : ""],
    ["RAM موردنیاز", f.ramGb ? `${faNumber(f.ramGb)} گیگابایت` : ""],
    ["حافظه ذخیره‌سازی", f.storageGb ? `${faNumber(f.storageGb)} گیگابایت` : ""],
    ["اندازه نمایشگر", f.displaySizeInch ? `${faNumber(f.displaySizeInch)} اینچ` : ""],
    ["نرخ نوسازی نمایشگر", f.refreshRateHz ? `${faNumber(f.refreshRateHz)} هرتز` : ""],
    ["وزن تقریبی قابل قبول", f.weightKg ? `${faNumber(f.weightKg)} کیلوگرم` : ""],
    ["سال ساخت / تولید", f.manufactureYear ? faNumber(f.manufactureYear) : ""],
    ["وضعیت کالا", label(conditionLabels, f.productCondition)],
    ["وضعیت گارانتی", label(warrantyLabels, f.warrantyStatus)],
    ["مدت گارانتی", f.warrantyMonths ? `${faNumber(f.warrantyMonths)} ماه` : ""],
    [
      "سلامت قطعات اصلی",
      f.partsHealthPercent
        ? `${faNumber(f.partsHealthPercent)}٪`
        : label(partsHealthLabels, f.partsHealth),
    ],
    ["سلامت بدنه/لولا/درگاه‌ها", f.bodyHealthPercent ? `${faNumber(f.bodyHealthPercent)}٪` : ""],
    ["سلامت باتری", f.batteryHealthPercent ? `${faNumber(f.batteryHealthPercent)}٪` : ""],
    ["گرید ظاهری", label(appearanceLabels, f.appearanceGrade)],
    ["سابقه تعمیر", label(repairLabels, f.repairHistory)],
    ["میزان کارکرد", label(usageLabels, f.usageLevel)],
    ["لوازم جانبی همراه", label(accessoryLabels, f.accessoriesStatus)],
    ["جعبه اصلی", label(yesNoLabels, f.originalPackaging)],
    ["فاکتور خرید / اصالت", label(yesNoLabels, f.purchaseInvoiceAvailable)],
    ["وضعیت موجودی در بازار", label(marketLabels, f.marketAvailability)],
  ].filter(([, value]) => value && value !== "نامشخص");
}

export function RequestSpecsDetails({
  factors,
  description,
  dense = false,
}: {
  factors?: Specs;
  description?: string;
  dense?: boolean;
}) {
  const rows = buildSpecRows(factors);

  if (rows.length === 0 && !description) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        برای این آگهی هنوز مشخصات فنی جداگانه‌ای ثبت نشده است.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.length > 0 ? (
        <div className={`grid gap-2 ${dense ? "text-xs md:grid-cols-2" : "text-sm md:grid-cols-2"}`}>
          {rows.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2"
            >
              <span className="text-gray-500">{key}</span>
              <b className="text-left text-gray-900" dir="rtl">
                {value}
              </b>
            </div>
          ))}
        </div>
      ) : null}
      {factors?.valuationNotes ? (
        <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-7 text-amber-900">
          <b>توضیحات تکمیلی مشخصات:</b> {factors.valuationNotes}
        </div>
      ) : null}
      {description ? (
        <div className="rounded-2xl bg-blue-50 p-4 text-sm leading-7 text-blue-900">
          <b>توضیحات خریدار:</b> {description}
        </div>
      ) : null}
    </div>
  );
}
