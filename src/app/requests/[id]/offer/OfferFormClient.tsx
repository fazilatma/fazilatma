"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  ram: "",
  storage: "",
  gpu: "ندارد / نامرتبط",
  display: "",
  manufactureYear: "",
  productCondition: "used_good",
  warrantyStatus: "test",
  warrantyMonths: "",
  partsHealth: "all_healthy",
  cpuHealth: "healthy",
  motherboardHealth: "healthy",
  displayHealth: "healthy",
  storageHealth: "healthy",
  ramHealth: "healthy",
  gpuHealth: "not_applicable",
  keyboardTouchpadHealth: "healthy",
  bodyHingeHealth: "healthy",
  batteryHealthPercent: "",
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

const healthOptions = [
  ["healthy", "سالم"],
  ["minor_issue", "ایراد جزئی"],
  ["needs_repair", "نیازمند تعمیر"],
  ["not_applicable", "نامرتبط"],
] as const;

const money = (value: string | number) =>
  `${Number(String(value).replace(/\D/g, "") || 0).toLocaleString("fa-IR")} تومان`;
const toInputMoney = (value: string | number) => {
  const raw = String(value || "").replace(/\D/g, "");
  return raw ? Number(raw).toLocaleString("en-US") : "";
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
      payload.append("deliveryDays", String(Number(deliveryDays)));
      payload.append("message", message);
      payload.append("productSpecs", JSON.stringify(specs));
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
                  این فرم توسط فروشنده پر می‌شود و قبل از پرداخت به خریدار نمایش
                  داده می‌شود. خریدار فقط بعد از تأیید همین مشخصات می‌تواند وارد
                  مرحله پرداخت شود.
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
            چند عکس واقعی از همان کالایی که پیشنهاد می‌دهید بارگذاری کنید تا
            خریدار قبل از پرداخت، ظاهر، سلامت و جزئیات محصول را ببیند و سوءتفاهم
            به حداقل برسد.
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
    <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-4 text-right">
      <div className="mb-4 border-b border-blue-100 pb-3">
        <h3 className="font-bold text-[#003b5c]">
          مشخصات دقیق کالای پیشنهادی فروشنده
        </h3>
        <p className="mt-1 text-xs leading-6 text-gray-500">
          تمام فیلدهای اصلی باید پر شود تا خریدار بتواند این پیشنهاد را تأیید
          کند.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <SpecInput
          label="برند"
          value={specs.brand}
          onChange={(value) => onChange("brand", value)}
          placeholder="Lenovo"
        />
        <SpecInput
          label="مدل دقیق"
          value={specs.exactModel}
          onChange={(value) => onChange("exactModel", value)}
          placeholder="ThinkPad E14"
        />
        <SpecInput
          label="کد مدل / کانفیگ"
          value={specs.serialOrConfig}
          onChange={(value) => onChange("serialOrConfig", value)}
          placeholder="E14 Gen / 155H / 16/512"
        />
        <SpecInput
          label="پردازنده CPU"
          value={specs.cpu}
          onChange={(value) => onChange("cpu", value)}
          placeholder="Core Ultra 7 155H"
        />
        <SpecInput
          label="RAM"
          value={specs.ram}
          onChange={(value) => onChange("ram", value)}
          placeholder="16GB"
        />
        <SpecInput
          label="حافظه SSD/HDD"
          value={specs.storage}
          onChange={(value) => onChange("storage", value)}
          placeholder="512GB SSD"
        />
        <SpecInput
          label="GPU / گرافیک"
          value={specs.gpu}
          onChange={(value) => onChange("gpu", value)}
          placeholder="Intel Arc / ندارد"
        />
        <SpecInput
          label="نمایشگر"
          value={specs.display}
          onChange={(value) => onChange("display", value)}
          placeholder="14 inch FHD"
        />
        <SpecInput
          label="سال ساخت"
          value={specs.manufactureYear}
          onChange={(value) =>
            onChange("manufactureYear", value.replace(/\D/g, "").slice(0, 4))
          }
          placeholder="2023"
        />
        <SpecSelect
          label="وضعیت کالا"
          value={specs.productCondition}
          onChange={(value) => onChange("productCondition", value)}
          options={[
            ["new", "نو"],
            ["open_box", "اپن‌باکس"],
            ["refurbished", "ریفربیشد"],
            ["used_like_new", "دست‌دوم در حد نو"],
            ["used_good", "دست‌دوم سالم"],
            ["used_fair", "دست‌دوم معمولی"],
            ["for_parts", "قطعاتی/نیازمند تعمیر"],
          ]}
        />
        <SpecSelect
          label="گارانتی"
          value={specs.warrantyStatus}
          onChange={(value) => onChange("warrantyStatus", value)}
          options={[
            ["manufacturer", "رسمی/شرکتی"],
            ["seller", "گارانتی فروشنده"],
            ["test", "مهلت تست"],
            ["none", "بدون گارانتی"],
          ]}
        />
        <SpecInput
          label="مدت گارانتی/تست"
          value={specs.warrantyMonths}
          onChange={(value) =>
            onChange("warrantyMonths", value.replace(/\D/g, "").slice(0, 3))
          }
          placeholder="3"
        />
        <SpecSelect
          label="سلامت کلی قطعات"
          value={specs.partsHealth}
          onChange={(value) => onChange("partsHealth", value)}
          options={[
            ["all_healthy", "همه قطعات سالم"],
            ["minor_issue", "ایراد جزئی"],
            ["needs_repair", "نیازمند تعمیر"],
          ]}
        />
        <SpecSelect
          label="سلامت CPU"
          value={specs.cpuHealth}
          onChange={(value) => onChange("cpuHealth", value)}
          options={healthOptions}
        />
        <SpecSelect
          label="سلامت مادربرد"
          value={specs.motherboardHealth}
          onChange={(value) => onChange("motherboardHealth", value)}
          options={healthOptions}
        />
        <SpecSelect
          label="سلامت نمایشگر"
          value={specs.displayHealth}
          onChange={(value) => onChange("displayHealth", value)}
          options={healthOptions}
        />
        <SpecSelect
          label="سلامت SSD/HDD"
          value={specs.storageHealth}
          onChange={(value) => onChange("storageHealth", value)}
          options={healthOptions}
        />
        <SpecSelect
          label="سلامت RAM"
          value={specs.ramHealth}
          onChange={(value) => onChange("ramHealth", value)}
          options={healthOptions}
        />
        <SpecSelect
          label="سلامت GPU"
          value={specs.gpuHealth}
          onChange={(value) => onChange("gpuHealth", value)}
          options={healthOptions}
        />
        <SpecSelect
          label="کیبورد/تاچ‌پد"
          value={specs.keyboardTouchpadHealth}
          onChange={(value) => onChange("keyboardTouchpadHealth", value)}
          options={healthOptions}
        />
        <SpecSelect
          label="بدنه/لولا"
          value={specs.bodyHingeHealth}
          onChange={(value) => onChange("bodyHingeHealth", value)}
          options={healthOptions}
        />
        <SpecInput
          label="سلامت باتری (%)"
          value={specs.batteryHealthPercent}
          onChange={(value) =>
            onChange(
              "batteryHealthPercent",
              value.replace(/\D/g, "").slice(0, 3),
            )
          }
          placeholder="85"
        />
        <SpecSelect
          label="گرید ظاهری"
          value={specs.appearanceGrade}
          onChange={(value) => onChange("appearanceGrade", value)}
          options={[
            ["A", "A - بسیار تمیز"],
            ["B", "B - خط‌وخش جزئی"],
            ["C", "C - آسیب قابل مشاهده"],
          ]}
        />
        <SpecSelect
          label="سابقه تعمیر"
          value={specs.repairHistory}
          onChange={(value) => onChange("repairHistory", value)}
          options={[
            ["none", "بدون تعمیر"],
            ["minor", "تعمیر جزئی"],
            ["major", "تعمیر اساسی"],
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
        <SpecInput
          label="مهلت تست/مرجوعی (روز)"
          value={specs.testDeadlineDays}
          onChange={(value) =>
            onChange("testDeadlineDays", value.replace(/\D/g, "").slice(0, 3))
          }
          placeholder="7"
        />
      </div>
      <label className="mt-3 block text-xs font-bold text-gray-700">
        شرایط مرجوعی/تعهد فروشنده
        <textarea
          value={specs.returnPolicy}
          onChange={(e) => onChange("returnPolicy", e.target.value)}
          className="mt-1 min-h-16 w-full rounded-xl border p-2 font-normal outline-none focus:border-[#00a8e8]"
        />
      </label>
      <label className="mt-3 block text-xs font-bold text-gray-700">
        توضیحات تکمیلی مشخصات
        <textarea
          value={specs.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          placeholder="مثلاً شارژر اصل است، خط روی قاب دارد، باتری تست شده، پورت‌ها سالم هستند..."
          className="mt-1 min-h-16 w-full rounded-xl border p-2 font-normal outline-none focus:border-[#00a8e8]"
        />
      </label>
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
