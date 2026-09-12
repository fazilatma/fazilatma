"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ProductImageStrip, ProductThumb } from "@/components/ProductImages";
import {
  productImageUrl,
  type ProductImageAttachment,
} from "@/lib/product-image-shared";

const defaultOfferSpecs = {
  brand: "",
  exactModel: "",
  serialOrConfig: "",
  cpu: "",
  cpuCores: "8",
  ram: "16GB",
  storage: "512GB SSD",
  gpu: "ندارد / نامرتبط",
  display: "14 inch FHD IPS / 60Hz",
  displaySizeInch: "14",
  refreshRateHz: "60",
  weightKg: "1.4",
  manufactureYear: "2021",
  productCondition: "used_good",
  warrantyStatus: "test",
  warrantyMonths: "1",
  partsHealth: "all_healthy",
  partsHealthPercent: "90",
  bodyHealthPercent: "90",
  cpuHealth: "healthy",
  motherboardHealth: "healthy",
  displayHealth: "healthy",
  storageHealth: "healthy",
  ramHealth: "healthy",
  gpuHealth: "not_applicable",
  keyboardTouchpadHealth: "healthy",
  bodyHingeHealth: "healthy",
  batteryHealthPercent: "85",
  appearanceGrade: "A",
  repairHistory: "none",
  usageLevel: "normal",
  accessoriesStatus: "complete",
  chargerStatus: "original",
  originalPackaging: "unknown",
  purchaseInvoiceAvailable: "unknown",
  testDeadlineDays: "7",
  returnPolicy:
    "در صورت مغایرت مشخصات یا خرابی اعلام‌نشده، مرجوعی پذیرفته می‌شود.",
  notes: "",
};

type OfferSpecs = typeof defaultOfferSpecs;

type SellerOffer = {
  id: number;
  requestId: number;
  sellerId: number;
  sellerName: string;
  amount: string;
  deliveryDays: number;
  message: string;
  status: "pending" | "accepted" | "rejected";
  productSpecs?: Partial<OfferSpecs>;
  productImages?: ProductImageAttachment[];
};

const money = (value: string | number) =>
  `${Number(String(value).replace(/\D/g, "") || 0).toLocaleString("fa-IR")} تومان`;
const toInputMoney = (value: string | number) => {
  const raw = String(value || "").replace(/\D/g, "");
  return raw ? Number(raw).toLocaleString("en-US") : "";
};

const numericFromText = (value: string | number | undefined, fallback: number) => {
  const text = String(value || "").replace(/,/g, ".").toLowerCase();
  const match = text.match(/\d+(?:\.\d+)?/);
  if (!match) return fallback;
  const parsed = Number(match[0]);
  if (!Number.isFinite(parsed)) return fallback;
  if (text.includes("tb") || text.includes("ترابایت")) return parsed * 1024;
  return parsed;
};

const formatSpecNumber = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");

const sellerHealthFromPercent = (value: number) => {
  if (value >= 85) return "healthy";
  if (value >= 55) return "minor_issue";
  return "needs_repair";
};

const sellerPartsHealthFromPercent = (value: number) => {
  if (value >= 85) return "all_healthy";
  if (value >= 55) return "minor_issue";
  return "needs_repair";
};

export default function OfferFormClient({
  request,
  existingOffers,
}: {
  request: any;
  existingOffers: SellerOffer[];
}) {
  const [sellerId, setSellerId] = useState(0);
  const [sellerRole, setSellerRole] = useState<string | null>(null);
  const existingOffer = useMemo(
    () => existingOffers.find((offer) => offer.sellerId === sellerId),
    [existingOffers, sellerId],
  );
  const [amount, setAmount] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("3");
  const [message, setMessage] = useState("");
  const [specs, setSpecs] = useState<OfferSpecs>({ ...defaultOfferSpecs });
  const [existingImages, setExistingImages] = useState<
    ProductImageAttachment[]
  >([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const id = Number(localStorage.getItem("userId") || 0);
    const role = localStorage.getItem("userRole");
    setSellerId(id);
    setSellerRole(role);
  }, []);

  useEffect(() => {
    if (!existingOffer) return;
    setAmount(toInputMoney(existingOffer.amount));
    setDeliveryDays(String(existingOffer.deliveryDays || 3));
    setMessage(existingOffer.message || "");
    setSpecs({ ...defaultOfferSpecs, ...(existingOffer.productSpecs || {}) });
    setExistingImages(existingOffer.productImages || []);
  }, [existingOffer]);

  const updateSpec = (key: keyof OfferSpecs, value: string) =>
    setSpecs((current) => ({ ...current, [key]: value }));

  const buildCompleteSpecsForSubmit = (): OfferSpecs => {
    const displaySize = specs.displaySizeInch || "14";
    const refreshRate = specs.refreshRateHz || "60";
    return {
      ...defaultOfferSpecs,
      ...specs,
      cpuCores: specs.cpuCores || defaultOfferSpecs.cpuCores,
      ram: specs.ram || defaultOfferSpecs.ram,
      storage: specs.storage || defaultOfferSpecs.storage,
      displaySizeInch: displaySize,
      refreshRateHz: refreshRate,
      weightKg: specs.weightKg || defaultOfferSpecs.weightKg,
      display: specs.display || `${displaySize} inch FHD IPS / ${refreshRate}Hz`,
      manufactureYear: specs.manufactureYear || defaultOfferSpecs.manufactureYear,
      warrantyMonths: specs.warrantyMonths || defaultOfferSpecs.warrantyMonths,
      partsHealthPercent:
        specs.partsHealthPercent || defaultOfferSpecs.partsHealthPercent,
      bodyHealthPercent: specs.bodyHealthPercent || defaultOfferSpecs.bodyHealthPercent,
      batteryHealthPercent:
        specs.batteryHealthPercent || defaultOfferSpecs.batteryHealthPercent,
    };
  };

  const handleProductImageChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (!allowedTypes.includes(file.type)) {
        alert(
          "فقط عکس‌های JPG، PNG یا WEBP برای کالای پیشنهادی قابل بارگذاری هستند.",
        );
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("حجم هر عکس محصول نباید بیشتر از ۵ مگابایت باشد.");
        continue;
      }
      validFiles.push(file);
    }
    if (existingImages.length + imageFiles.length + validFiles.length > 8) {
      alert("حداکثر ۸ عکس برای کالای پیشنهادی قابل ثبت است.");
      return;
    }
    setImageFiles((current) => [...current, ...validFiles]);
    setImagePreviews((current) => [
      ...current,
      ...validFiles.map((file) => URL.createObjectURL(file)),
    ]);
  };

  const removeNewImage = (index: number) => {
    setImageFiles((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
    setImagePreviews((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const removeExistingImage = (storedName: string) => {
    setExistingImages((current) =>
      current.filter((image) => image.storedName !== storedName),
    );
  };

  const submitOffer = async () => {
    if (sellerRole !== "seller" || !sellerId) {
      alert("برای ثبت پیشنهاد باید با حساب فروشنده وارد شوید.");
      return;
    }
    const numericAmount = amount.replace(/\D/g, "");
    if (!numericAmount) {
      alert("قیمت پیشنهادی را وارد کنید.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("sellerId", String(sellerId));
      payload.append("requestId", String(request.id));
      payload.append("amount", numericAmount);
      const specsForSubmit = buildCompleteSpecsForSubmit();
      payload.append("deliveryDays", String(Number(deliveryDays)));
      payload.append("message", message);
      payload.append("productSpecs", JSON.stringify(specsForSubmit));
      payload.append("existingProductImages", JSON.stringify(existingImages));
      imageFiles.forEach((file) => payload.append("productImages", file));

      const response = await fetch("/api/submit-offer", {
        method: "POST",
        body: payload,
      });
      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || "ثبت پیشنهاد ناموفق بود.");
      alert(
        existingOffer
          ? "پیشنهاد و مشخصات کالا با موفقیت به‌روزرسانی شد."
          : result.message,
      );
      window.location.href = `/requests/${request.id}`;
    } catch (error) {
      alert(error instanceof Error ? error.message : "ثبت پیشنهاد ناموفق بود.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/requests" className="hover:text-[#00a8e8]">
            درخواست‌های خرید
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/requests/${request.id}`}
            className="hover:text-[#00a8e8]"
          >
            {request.title}
          </Link>
          <span className="mx-2">/</span>
          مشخصات کالای پیشنهادی
        </nav>

        <div className="grid gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <div className="sticky top-24 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                {request.category}
              </span>
              <div className="mt-4 flex items-start gap-3">
                <ProductThumb
                  images={request.productImages}
                  title={request.title}
                  className="h-20 w-20"
                />
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-[#003b5c]">
                    {request.title}
                  </h1>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-600">
                    {request.description}
                  </p>
                </div>
              </div>
              <ProductImageStrip
                images={request.productImages}
                title={request.title}
                label="عکس‌های ثبت‌شده توسط خریدار"
              />
              <div className="mt-5 space-y-3 rounded-2xl bg-gray-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">بودجه خریدار:</span>
                  <b className="text-[#0b9c56]">{money(request.budget)}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">تعداد:</span>
                  <b>{request.quantity}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">مهلت:</span>
                  <b>
                    {request.deadline === "flexible"
                      ? "انعطاف‌پذیر"
                      : `${request.deadline} روز`}
                  </b>
                </div>
              </div>
              {existingOffer && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800">
                  شما قبلاً برای این درخواست پیشنهاد ثبت کرده‌اید. می‌توانید
                  قیمت یا مشخصات کالای پیشنهادی را در همین صفحه تکمیل/ویرایش
                  کنید.
                </div>
              )}
            </div>
          </aside>

          <main className="lg:col-span-8">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-[#003b5c]">
                  ثبت پیشنهاد قیمت و مشخصات کامل محصول پیشنهادی
                </h2>
                <p className="mt-2 text-sm leading-7 text-gray-500">
                  این فرم توسط فروشنده پر می‌شود و قبل از هماهنگی نهایی به خریدار نمایش
                  داده می‌شود. خریدار بعد از بررسی همین مشخصات، مستقیماً با فروشنده برای
                  پرداخت، تست و تحویل هماهنگ می‌کند.
                </p>
              </div>

              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-bold text-gray-700">
                  قیمت پیشنهادی کل ({request.quantity} عدد)
                  <div className="relative mt-2">
                    <input
                      value={amount}
                      onChange={(e) => setAmount(toInputMoney(e.target.value))}
                      placeholder="مثال: ۵۷۰,۰۰۰,۰۰۰"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 pl-20 font-normal outline-none focus:border-[#00a8e8]"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                      تومان
                    </span>
                  </div>
                </label>
                <label className="block text-sm font-bold text-gray-700">
                  زمان تحویل
                  <select
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-normal outline-none focus:border-[#00a8e8]"
                  >
                    <option value="1">۱ روزه</option>
                    <option value="2">۲ روزه</option>
                    <option value="3">۳ روزه</option>
                    <option value="5">۵ روزه</option>
                    <option value="7">۷ روزه</option>
                    <option value="14">۱۴ روزه</option>
                  </select>
                </label>
              </div>

              <OfferSpecsForm specs={specs} onChange={updateSpec} />

              <ProductImagesUploader
                existingImages={existingImages}
                imagePreviews={imagePreviews}
                imageFiles={imageFiles}
                onPickImages={handleProductImageChange}
                onRemoveExisting={removeExistingImage}
                onRemoveNew={removeNewImage}
              />

              <label className="mt-4 block text-sm font-bold text-gray-700">
                توضیحات فروشنده
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="هر نکته‌ای درباره موجودی، ارسال، تست، گارانتی یا شرایط فروش دارید بنویسید..."
                  className="mt-2 min-h-24 w-full rounded-xl border border-gray-300 p-3 font-normal outline-none focus:border-[#00a8e8]"
                />
              </label>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={submitOffer}
                  disabled={isSubmitting}
                  className="flex-[2] rounded-xl bg-[#0b9c56] px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isSubmitting
                    ? "در حال ثبت..."
                    : existingOffer
                      ? "به‌روزرسانی پیشنهاد و مشخصات"
                      : "ثبت پیشنهاد قیمت و مشخصات کالا"}
                </button>
                <Link
                  href={`/requests/${request.id}`}
                  className="flex-1 rounded-xl bg-gray-100 px-6 py-3 text-center font-bold text-gray-700 transition hover:bg-gray-200"
                >
                  بازگشت به درخواست
                </Link>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function ProductImagesUploader({
  existingImages,
  imagePreviews,
  imageFiles,
  onPickImages,
  onRemoveExisting,
  onRemoveNew,
}: {
  existingImages: ProductImageAttachment[];
  imagePreviews: string[];
  imageFiles: File[];
  onPickImages: (files: FileList | null) => void;
  onRemoveExisting: (storedName: string) => void;
  onRemoveNew: (index: number) => void;
}) {
  const total = existingImages.length + imagePreviews.length;
  return (
    <div className="mt-4 rounded-2xl border border-green-100 bg-green-50/40 p-4">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-bold text-[#0b9c56]">
            عکس‌های کالای پیشنهادی فروشنده
          </h3>
          <p className="mt-1 text-xs leading-6 text-gray-500">
            چند عکس واقعی از همان کالایی که پیشنهاد می‌دهید بارگذاری کنید؛ نمای روبه‌رو،
            پشت دستگاه، برچسب مدل و هر ایراد ظاهری مهم بهتر است مشخص باشد.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-green-700">
            {total.toLocaleString("fa-IR")} از ۸ عکس
          </span>
          <label className="cursor-pointer rounded-xl bg-[#0b9c56] px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700">
            افزودن چند عکس
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(event) => {
                onPickImages(event.target.files);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </div>

      <div className="mb-4 grid gap-2 text-xs text-gray-600 sm:grid-cols-2 md:grid-cols-4">
        {[
          "نمای روبه‌رو",
          "پشت و کناره‌ها",
          "برچسب مدل/سریال یا کانفیگ",
          "خط‌وخش، ایراد یا تست سلامت",
        ].map((item) => (
          <div key={item} className="rounded-xl bg-white px-3 py-2">
            📷 {item}
          </div>
        ))}
      </div>

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-green-200 bg-white p-6 text-center text-sm leading-7 text-gray-500">
          هنوز عکسی برای کالای پیشنهادی انتخاب نشده است. برای کاهش خطا، بهتر است
          حداقل ۳ عکس واقعی از زاویه‌های مختلف کالا بارگذاری شود.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {existingImages.map((image) => (
            <div
              key={image.storedName}
              className="group relative overflow-hidden rounded-2xl border border-white bg-white shadow-sm"
            >
              <div className="aspect-square bg-gray-100">
                <img
                  src={productImageUrl(image)}
                  alt={image.originalName}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="truncate px-3 py-2 text-xs text-gray-500">
                ثبت‌شده · {image.originalName}
              </p>
              <button
                type="button"
                onClick={() => onRemoveExisting(image.storedName)}
                className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100"
              >
                حذف
              </button>
            </div>
          ))}
          {imagePreviews.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="group relative overflow-hidden rounded-2xl border border-white bg-white shadow-sm"
            >
              <div className="aspect-square bg-gray-100">
                <img
                  src={src}
                  alt={imageFiles[index]?.name || "عکس جدید محصول"}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="truncate px-3 py-2 text-xs text-gray-500">
                جدید · {imageFiles[index]?.name}
              </p>
              <button
                type="button"
                onClick={() => onRemoveNew(index)}
                className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100"
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-gray-400">
        امکان انتخاب چندتایی وجود دارد؛ حداکثر ۸ عکس، هر عکس حداکثر ۵ مگابایت،
        فرمت مجاز JPG/PNG/WEBP.
      </p>
    </div>
  );
}

function OfferSpecsForm({
  specs,
  onChange,
}: {
  specs: OfferSpecs;
  onChange: (key: keyof OfferSpecs, value: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-blue-100 bg-blue-50/30 p-4 text-right">
      <div className="mb-4 border-b border-blue-100 pb-3">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h3 className="font-bold text-[#003b5c]">
              مشخصات اسکرولی کالای پیشنهادی فروشنده
            </h3>
            <p className="mt-1 text-xs leading-6 text-gray-500">
              مخصوص شروع با لپ‌تاپ: مثل نمونه‌ای که فرستادید، بخش‌های Body، Platform،
              Memory و Display داریم و RAM، حافظه، اندازه نمایشگر، سلامت قطعات، باتری، وزن و سال ساخت
              با اسلایدر واقعی تنظیم می‌شود.
            </p>
          </div>
          <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700">
            فرم مرحله‌ای / Scroll Specs
          </div>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 text-xs font-bold text-gray-600">
          {[
            "هویت کالا",
            "پلتفرم",
            "حافظه",
            "نمایشگر",
            "بدنه",
            "سلامت",
            "گارانتی",
            "لوازم",
          ].map((item) => (
            <span
              key={item}
              className="shrink-0 rounded-full bg-white px-3 py-1 shadow-sm"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-blue-100 bg-white/70 p-3 pr-4">
        <SpecSection
          title="۱. هویت کالا و مدل دقیق"
          subtitle="اطلاعاتی که جلوی اشتباه مدل و کانفیگ را می‌گیرد"
        >
          <div className="grid gap-3 md:grid-cols-3">
            <SpecInput
              label="برند"
              value={specs.brand}
              onChange={(value) => onChange("brand", value)}
              placeholder="Lenovo / Dell / HP"
            />
            <SpecInput
              label="مدل دقیق"
              value={specs.exactModel}
              onChange={(value) => onChange("exactModel", value)}
              placeholder="ThinkPad E14 Gen 5"
            />
            <SpecInput
              label="کد مدل / کانفیگ"
              value={specs.serialOrConfig}
              onChange={(value) => onChange("serialOrConfig", value)}
              placeholder="E14 / 155H / 16/512"
            />
          </div>
          <SpecDiscreteRange
            label="وضعیت ظاهری/بازاری کالا"
            value={specs.productCondition}
            lowLabel="نیازمند تعمیر"
            highLabel="کاملاً نو"
            onChange={(value) => onChange("productCondition", value)}
            options={[
              ["for_parts", "قطعاتی/نیازمند تعمیر"],
              ["used_fair", "کارکرده معمولی"],
              ["used_good", "دست‌دوم سالم"],
              ["used_like_new", "در حد نو"],
              ["open_box", "اپن‌باکس"],
              ["refurbished", "ریفربیشد"],
              ["new", "کاملاً نو"],
            ]}
          />
        </SpecSection>

        <SpecSection
          title="۲. پلتفرم و پردازنده"
          subtitle="CPU، GPU، سال ساخت و سیستم عامل پیشنهادی"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <SpecInput
              label="پردازنده CPU"
              value={specs.cpu}
              onChange={(value) => onChange("cpu", value)}
              placeholder="Core i5 1235U / Ryzen 7"
            />
            <SpecInput
              label="GPU / گرافیک"
              value={specs.gpu}
              onChange={(value) => onChange("gpu", value)}
              placeholder="Intel Iris Xe / RTX 3050"
            />
            <SpecRangeInput
              label="تعداد هسته CPU"
              value={numericFromText(specs.cpuCores, 8)}
              min={2}
              max={24}
              step={2}
              unit="هسته"
              helper="مثل فیلتر CPU Cores؛ عدد را با کشیدن اسلایدر ثبت کنید."
              onChange={(value) => onChange("cpuCores", String(value))}
            />
            <SpecRangeInput
              label="سال ساخت / تولید"
              value={numericFromText(specs.manufactureYear, 2021)}
              min={2015}
              max={2026}
              step={1}
              unit="سال"
              helper="به‌جای تایپ دستی، سال تولید را اسکرولی انتخاب کنید."
              onChange={(value) => onChange("manufactureYear", String(value))}
            />
          </div>
          <SpecChipGroup
            label="سلامت پردازنده و مادربرد"
            value={`${specs.cpuHealth}|${specs.motherboardHealth}`}
            onChange={(value) => {
              const [cpu, motherboard] = value.split("|");
              onChange("cpuHealth", cpu);
              onChange("motherboardHealth", motherboard);
            }}
            options={[
              ["healthy|healthy", "CPU و مادربرد سالم"],
              ["minor_issue|healthy", "CPU ایراد جزئی"],
              ["healthy|minor_issue", "مادربرد ایراد جزئی"],
              ["needs_repair|needs_repair", "نیازمند بررسی/تعمیر"],
            ]}
          />
        </SpecSection>

        <SpecSection
          title="۳. حافظه و ذخیره‌سازی"
          subtitle="RAM و SSD/HDD جزو مهم‌ترین عوامل قیمت هستند"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <SpecRangeInput
              label="RAM"
              value={numericFromText(specs.ram, 16)}
              min={2}
              max={128}
              step={2}
              unit="GB"
              helper="مانند نمونه، RAM با کشیدن اسلایدر انتخاب می‌شود."
              onChange={(value) => onChange("ram", `${value}GB`)}
            />
            <SpecRangeInput
              label="حافظه ذخیره‌سازی SSD/HDD"
              value={numericFromText(specs.storage, 512)}
              min={128}
              max={4096}
              step={128}
              unit="GB"
              helper="برای 1TB عدد 1024 و برای 2TB عدد 2048 را انتخاب کنید."
              onChange={(value) => onChange("storage", `${value}GB SSD`)}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <SpecDiscreteRange
              label="سلامت RAM"
              value={specs.ramHealth}
              lowLabel="نیازمند تعمیر"
              highLabel="سالم"
              onChange={(value) => onChange("ramHealth", value)}
              options={[
                ["needs_repair", "نیازمند تعمیر"],
                ["minor_issue", "ایراد جزئی"],
                ["healthy", "سالم"],
              ]}
            />
            <SpecDiscreteRange
              label="سلامت SSD/HDD"
              value={specs.storageHealth}
              lowLabel="نیازمند تعمیر"
              highLabel="سالم"
              onChange={(value) => onChange("storageHealth", value)}
              options={[
                ["needs_repair", "نیازمند تعمیر"],
                ["minor_issue", "ایراد جزئی"],
                ["healthy", "سالم"],
              ]}
            />
          </div>
        </SpecSection>

        <SpecSection
          title="۴. نمایشگر"
          subtitle="اندازه، رزولوشن، پنل و سلامت صفحه را دقیق بنویسید"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <SpecRangeInput
              label="اندازه نمایشگر"
              value={numericFromText(specs.displaySizeInch || specs.display, 14)}
              min={11}
              max={18}
              step={0.1}
              unit="اینچ"
              helper="درست مثل فیلتر Display Size در نمونه، اندازه را اسکرولی انتخاب کنید."
              onChange={(value) => {
                const size = formatSpecNumber(value);
                onChange("displaySizeInch", size);
                onChange(
                  "display",
                  `${size} inch FHD IPS / ${specs.refreshRateHz || 60}Hz`,
                );
              }}
            />
            <SpecRangeInput
              label="نرخ نوسازی"
              value={numericFromText(specs.refreshRateHz, 60)}
              min={60}
              max={240}
              step={15}
              unit="Hz"
              helper="برای دستگاه‌های گیمینگ یا طراحی، مقدار بالاتر را انتخاب کنید."
              onChange={(value) => {
                onChange("refreshRateHz", String(value));
                onChange(
                  "display",
                  `${specs.displaySizeInch || 14} inch FHD IPS / ${value}Hz`,
                );
              }}
            />
            <SpecDiscreteRange
              label="سلامت نمایشگر"
              value={specs.displayHealth}
              lowLabel="نیازمند تعمیر"
              highLabel="سالم"
              onChange={(value) => onChange("displayHealth", value)}
              options={[
                ["needs_repair", "نیازمند تعمیر"],
                ["minor_issue", "ایراد جزئی"],
                ["healthy", "سالم"],
              ]}
            />
            <SpecInput
              label="توضیح تکمیلی نمایشگر"
              value={specs.display}
              onChange={(value) => onChange("display", value)}
              placeholder="14 inch FHD IPS / 120Hz"
            />
          </div>
        </SpecSection>

        <SpecSection
          title="۵. بدنه، ظاهر، لولا و ورودی‌ها"
          subtitle="مثل تصویر مرجع، بدنه و کیفیت ظاهری جداگانه ثبت می‌شود"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <SpecPercentRange
              label="سلامت بدنه/لولا"
              value={numericFromText(specs.bodyHealthPercent, 90)}
              helper="درصد سلامت فیزیکی، لولا، قاب و پورت‌ها را با اسلایدر تعیین کنید."
              onChange={(value) => {
                onChange("bodyHealthPercent", String(value));
                onChange("bodyHingeHealth", sellerHealthFromPercent(value));
              }}
            />
            <SpecRangeInput
              label="وزن تقریبی"
              value={numericFromText(specs.weightKg, 1.4)}
              min={0.8}
              max={4}
              step={0.1}
              unit="kg"
              helper="مثل Height/Width/Weight در نمونه، عدد با اسلایدر ثبت می‌شود."
              onChange={(value) => onChange("weightKg", formatSpecNumber(value))}
            />
            <SpecDiscreteRange
              label="گرید ظاهری"
              value={specs.appearanceGrade}
              lowLabel="آسیب قابل مشاهده"
              highLabel="بسیار تمیز"
              onChange={(value) => onChange("appearanceGrade", value)}
              options={[
                ["C", "C - آسیب قابل مشاهده"],
                ["B", "B - خط‌وخش جزئی"],
                ["A", "A - بسیار تمیز"],
              ]}
            />
            <SpecDiscreteRange
              label="کیبورد/تاچ‌پد"
              value={specs.keyboardTouchpadHealth}
              lowLabel="نیازمند تعمیر"
              highLabel="سالم"
              onChange={(value) => onChange("keyboardTouchpadHealth", value)}
              options={[
                ["needs_repair", "نیازمند تعمیر"],
                ["minor_issue", "ایراد جزئی"],
                ["healthy", "سالم"],
              ]}
            />
          </div>
        </SpecSection>

        <SpecSection
          title="۶. سلامت قطعات و باتری"
          subtitle="برای کاهش اختلاف، سلامت هر قطعه جداگانه ثبت شود"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <SpecPercentRange
              label="سلامت کلی قطعات"
              value={numericFromText(specs.partsHealthPercent, 90)}
              helper="این همان چیزی است که گفتید: به‌جای گزینه نامشخص/سالم، فروشنده درصد سلامت قطعات را می‌کشد."
              onChange={(value) => {
                onChange("partsHealthPercent", String(value));
                onChange("partsHealth", sellerPartsHealthFromPercent(value));
              }}
            />
            <SpecPercentRange
              label="سلامت باتری"
              value={numericFromText(specs.batteryHealthPercent, 85)}
              helper="عدد واقعی Battery Report یا تست فروشنده را اینجا ثبت کنید."
              onChange={(value) => onChange("batteryHealthPercent", String(value))}
            />
            <SpecDiscreteRange
              label="سلامت GPU"
              value={specs.gpuHealth}
              lowLabel="نامرتبط / نیازمند تعمیر"
              highLabel="سالم"
              onChange={(value) => onChange("gpuHealth", value)}
              options={[
                ["not_applicable", "نامرتبط"],
                ["needs_repair", "نیازمند تعمیر"],
                ["minor_issue", "ایراد جزئی"],
                ["healthy", "سالم"],
              ]}
            />
            <SpecDiscreteRange
              label="سابقه تعمیر"
              value={specs.repairHistory}
              lowLabel="بدون تعمیر"
              highLabel="تعمیر اساسی"
              onChange={(value) => onChange("repairHistory", value)}
              options={[
                ["none", "بدون تعمیر"],
                ["minor", "تعمیر جزئی"],
                ["major", "تعمیر اساسی"],
              ]}
            />
          </div>
        </SpecSection>

        <SpecSection
          title="۷. گارانتی، مهلت تست و سیاست مرجوعی"
          subtitle="شرایط تست و مرجوعی باید قبل از معامله مستقیم برای خریدار روشن باشد"
        >
          <div className="grid gap-3 md:grid-cols-3">
            <SpecDiscreteRange
              label="گارانتی"
              value={specs.warrantyStatus}
              lowLabel="بدون گارانتی"
              highLabel="رسمی/شرکتی"
              onChange={(value) => onChange("warrantyStatus", value)}
              options={[
                ["none", "بدون گارانتی"],
                ["test", "مهلت تست"],
                ["seller", "گارانتی فروشنده"],
                ["manufacturer", "رسمی/شرکتی"],
              ]}
            />
            <SpecRangeInput
              label="مدت گارانتی/تست"
              value={numericFromText(specs.warrantyMonths, 1)}
              min={0}
              max={36}
              step={1}
              unit="ماه"
              onChange={(value) => onChange("warrantyMonths", String(value))}
            />
            <SpecRangeInput
              label="مهلت تست/مرجوعی"
              value={numericFromText(specs.testDeadlineDays, 7)}
              min={0}
              max={30}
              step={1}
              unit="روز"
              onChange={(value) => onChange("testDeadlineDays", String(value))}
            />
          </div>
          <label className="block text-xs font-bold text-gray-700">
            شرایط مرجوعی/تعهد فروشنده
            <textarea
              value={specs.returnPolicy}
              onChange={(e) => onChange("returnPolicy", e.target.value)}
              className="mt-1 min-h-20 w-full rounded-xl border p-3 font-normal outline-none focus:border-[#00a8e8]"
            />
          </label>
        </SpecSection>

        <SpecSection
          title="۸. لوازم همراه، اصالت و توضیحات نهایی"
          subtitle="شارژر، فاکتور، جعبه و توضیحات ریز را اینجا کامل کنید"
        >
          <div className="grid gap-3 md:grid-cols-3">
            <SpecSelect
              label="لوازم جانبی"
              value={specs.accessoriesStatus}
              onChange={(value) => onChange("accessoriesStatus", value)}
              options={[
                ["complete", "کامل"],
                ["missing_minor", "کسری جزئی"],
                ["missing_key", "کسری مهم"],
              ]}
            />
            <SpecSelect
              label="شارژر/آداپتور"
              value={specs.chargerStatus}
              onChange={(value) => onChange("chargerStatus", value)}
              options={[
                ["original", "اصل"],
                ["compatible", "سازگار/غیراصل"],
                ["missing", "ندارد"],
                ["not_applicable", "نامرتبط"],
              ]}
            />
            <SpecSelect
              label="جعبه اصلی"
              value={specs.originalPackaging}
              onChange={(value) => onChange("originalPackaging", value)}
              options={[
                ["yes", "دارد"],
                ["no", "ندارد"],
                ["unknown", "نامشخص"],
              ]}
            />
            <SpecSelect
              label="فاکتور/اصالت"
              value={specs.purchaseInvoiceAvailable}
              onChange={(value) => onChange("purchaseInvoiceAvailable", value)}
              options={[
                ["yes", "دارد"],
                ["no", "ندارد"],
                ["unknown", "نامشخص"],
              ]}
            />
            <SpecSelect
              label="میزان کارکرد"
              value={specs.usageLevel}
              onChange={(value) => onChange("usageLevel", value)}
              options={[
                ["low", "کم‌کارکرد"],
                ["normal", "معمولی"],
                ["heavy", "پرکارکرد"],
              ]}
            />
          </div>
          <label className="block text-xs font-bold text-gray-700">
            توضیحات تکمیلی مشخصات
            <textarea
              value={specs.notes}
              onChange={(e) => onChange("notes", e.target.value)}
              placeholder="مثلاً شارژر اصل است، خط روی قاب دارد، باتری تست شده، پورت‌ها سالم هستند..."
              className="mt-1 min-h-24 w-full rounded-xl border p-3 font-normal outline-none focus:border-[#00a8e8]"
            />
          </label>
        </SpecSection>
      </div>
    </div>
  );
}

function SpecSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-blue-50/40 p-4">
      <div className="mb-3">
        <h4 className="font-bold text-[#003b5c]">{title}</h4>
        <p className="mt-1 text-xs leading-6 text-gray-500">{subtitle}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SpecChipGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <p className="mb-2 text-xs font-bold text-gray-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(([id, text]) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${value === id ? "border-[#00a8e8] bg-blue-50 text-[#003b5c]" : "border-gray-200 bg-gray-50 text-gray-600 hover:border-[#00a8e8]/50"}`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function SpecRangeInput({
  label,
  value,
  min,
  max,
  step,
  unit,
  helper,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  helper?: string;
  onChange: (value: number) => void;
}) {
  const safeValue = Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
  return (
    <div className="rounded-2xl bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-gray-700">
        <span>{label}</span>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-[#003b5c]" dir="ltr">
          {safeValue.toLocaleString("fa-IR")} {unit}
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-gray-500" dir="ltr">
        <span>{min}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={safeValue}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full accent-[#00a8e8]"
        />
        <span>{max}</span>
      </div>
      {helper && <p className="mt-2 text-[11px] leading-5 text-gray-500">{helper}</p>}
    </div>
  );
}

function SpecPercentRange({
  label,
  value,
  helper,
  onChange,
}: {
  label: string;
  value: number;
  helper?: string;
  onChange: (value: number) => void;
}) {
  const safeValue = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div className="rounded-2xl bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-gray-700">
        <span>{label}</span>
        <span className="rounded-full bg-green-50 px-3 py-1 text-[#0b9c56]" dir="ltr">
          {safeValue.toLocaleString("fa-IR")}٪
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-gray-500" dir="ltr">
        <span>0%</span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={safeValue}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full accent-[#0b9c56]"
        />
        <span>100%</span>
      </div>

      {helper && <p className="mt-2 text-[11px] leading-5 text-gray-500">{helper}</p>}
    </div>
  );
}

function SpecDiscreteRange({
  label,
  value,
  lowLabel,
  highLabel,
  options,
  onChange,
}: {
  label: string;
  value: string;
  lowLabel: string;
  highLabel: string;
  options: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
}) {
  const foundIndex = options.findIndex(([id]) => id === value);
  const sliderIndex = foundIndex >= 0 ? foundIndex : Math.floor((options.length - 1) / 2);
  const currentLabel = options[sliderIndex]?.[1] || "نامشخص";
  return (
    <div className="rounded-2xl bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-gray-700">
        <span>{label}</span>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-[#003b5c]">
          {currentLabel}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max={options.length - 1}
        step="1"
        value={sliderIndex}
        onChange={(event) => onChange(options[Number(event.target.value)][0])}
        className="w-full accent-[#00a8e8]"
      />
      <div className="mt-2 flex justify-between text-[11px] text-gray-500">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map(([id, text], index) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
              sliderIndex === index
                ? "border-[#00a8e8] bg-blue-50 text-[#003b5c]"
                : "border-gray-200 bg-gray-50 text-gray-600 hover:border-[#00a8e8]/50"
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function SpecInput({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-bold text-gray-700">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border p-2 font-normal outline-none focus:border-[#00a8e8]"
      />
    </label>
  );
}

function SpecSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <label className="block text-xs font-bold text-gray-700">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border bg-white p-2 font-normal outline-none focus:border-[#00a8e8]"
      >
        {options.map(([id, text]) => (
          <option key={id} value={id}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
