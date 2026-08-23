"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RequestPurchasePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    budget: "",
    budgetType: "fixed",
    deadline: "",
    quantity: "1",
    attachments: null as File | null,
    valuationFactors: {
      productCondition: "used_good",
      sameNewProductPrice: "",
      manufactureYear: "",
      warrantyStatus: "unknown",
      warrantyMonths: "",
      partsHealth: "unknown",
      batteryHealthPercent: "",
      appearanceGrade: "unknown",
      repairHistory: "unknown",
      usageLevel: "unknown",
      accessoriesStatus: "unknown",
      originalPackaging: "unknown",
      purchaseInvoiceAvailable: "unknown",
      marketAvailability: "unknown",
      valuationNotes: "",
    },
  });

  const categories = [
    "کالای دیجیتال",
    "مد و پوشاک",
    "خانه و آشپزخانه",
    "زیبایی و سلامت",
    "کتاب و لوازم تحریر",
    "ورزش و سفر",
    "اسباب‌بازی و کودک",
    "خودرو و موتور",
    "صنعتی و اداری",
    "سایر",
  ];

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const updateValuationFactor = (key: keyof typeof formData.valuationFactors, value: string) => {
    setFormData((current) => ({
      ...current,
      valuationFactors: { ...current.valuationFactors, [key]: value },
    }));
  };

  const formatMoneyInput = (value: string) => {
    const rawValue = value.replace(/\D/g, "");
    return rawValue ? Number(rawValue).toLocaleString("en-US") : "";
  };

  const formatCurrency = (value: number | string) => `${Number(value || 0).toLocaleString("fa-IR")} تومان`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...filesArray]);

      // Create previews for images
      const newPreviews = filesArray.map(file => {
        if (file.type.startsWith('image/')) {
          return URL.createObjectURL(file);
        }
        return '/document-icon.png'; // Fallback for non-images
      });
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // بازیابی اطلاعات فرم در صورت وجود در حافظه موقت (بعد از بازگشت از صفحه لاگین)
  useEffect(() => {
    const savedData = sessionStorage.getItem("pendingRequestData");
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
        // پاک کردن حافظه پس از بازیابی موفق
        sessionStorage.removeItem("pendingRequestData");
      } catch (e) {
        console.error("Error parsing saved form data");
      }
    }
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<any | null>(null);

  const closeEstimateModal = () => setSubmittedRequest(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // بررسی لاگین بودن کاربر
    const userRole = localStorage.getItem("userRole");
    if (!userRole) {
      // ذخیره اطلاعات متنی فرم در حافظه
      sessionStorage.setItem("pendingRequestData", JSON.stringify(formData));
      // تعیین مسیر بازگشت پس از لاگین
      sessionStorage.setItem("redirectAfterAuth", "/request-purchase");
      
      alert("برای ثبت نهایی درخواست، لطفاً ابتدا وارد حساب کاربری خود شوید یا ثبت‌نام کنید.\nاطلاعات فرم شما محفوظ می‌ماند.");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/submit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          imageNames: uploadedFiles.map((file) => file.name),
          buyerName: localStorage.getItem("userDisplayName") || "خریدار OptiBid",
          buyerId: Number(localStorage.getItem("userId")) || undefined,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSubmittedRequest(result.request || null);
        setUploadedFiles([]);
        setPreviews([]);
      } else {
        alert(result.message || result.error || "خطا در ثبت درخواست در پایگاه داده!");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "خطای ناشناخته";
      alert(`ارتباط با سرور برقرار نشد. جزئیات: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {submittedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl ring-1 ring-black/10">
            <div className="relative overflow-hidden rounded-t-[2rem] bg-gradient-to-l from-[#003b5c] via-[#005e94] to-[#00a8e8] p-6 text-white">
              <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
              <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-blue-50">درخواست با موفقیت ثبت شد</span>
                  <h2 className="mt-3 text-2xl font-bold">گزارش تخمین قیمت هوشمند</h2>
                  <p className="mt-2 text-sm leading-7 text-blue-50">این تخمین بر اساس قیمت مرجع بازار مثل ترب، وضعیت کالا، سال ساخت، گارانتی، سلامت قطعات و سایر فاکتورهای ارزش‌گذاری محاسبه شده است.</p>
                </div>
                <button type="button" onClick={closeEstimateModal} className="rounded-full bg-white/15 px-3 py-1 text-lg font-bold transition hover:bg-white/25">×</button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-bold text-gray-500">عنوان درخواست</p>
                <h3 className="mt-1 text-xl font-bold text-[#003b5c]">{submittedRequest.title}</h3>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                  <span className="rounded-full bg-white px-3 py-1">دسته: {submittedRequest.category}</span>
                  <span className="rounded-full bg-white px-3 py-1">تعداد: {submittedRequest.quantity}</span>
                  <span className="rounded-full bg-white px-3 py-1">بودجه ثبت‌شده: {formatCurrency(submittedRequest.budget)}</span>
                </div>
              </div>

              {submittedRequest.aiPriceEstimate ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-center">
                      <p className="text-xs font-bold text-green-700">قیمت منصفانه هر واحد</p>
                      <p className="mt-2 text-2xl font-bold text-[#0b9c56]">{formatCurrency(submittedRequest.aiPriceEstimate.estimatedUnitFair)}</p>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-center">
                      <p className="text-xs font-bold text-blue-700">بازه هر واحد</p>
                      <p className="mt-2 text-lg font-bold text-[#003b5c]">{formatCurrency(submittedRequest.aiPriceEstimate.estimatedUnitMin)} تا {formatCurrency(submittedRequest.aiPriceEstimate.estimatedUnitMax)}</p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-center">
                      <p className="text-xs font-bold text-purple-700">اعتماد تخمین</p>
                      <p className="mt-2 text-2xl font-bold text-purple-700">{Number(submittedRequest.aiPriceEstimate.confidence || 0).toLocaleString("fa-IR")}٪</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 p-4">
                      <p className="text-sm font-bold text-gray-800">بازه کل برای {submittedRequest.quantity} عدد</p>
                      <p className="mt-2 text-xl font-bold text-[#003b5c]">{formatCurrency(submittedRequest.aiPriceEstimate.estimatedTotalMin)} تا {formatCurrency(submittedRequest.aiPriceEstimate.estimatedTotalMax)}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 p-4">
                      <p className="text-sm font-bold text-gray-800">افت نسبت به کالای نو</p>
                      <p className="mt-2 text-xl font-bold text-amber-600">{Number(submittedRequest.aiPriceEstimate.depreciationPercent || 0).toLocaleString("fa-IR")}٪</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="font-bold text-blue-900">جمع‌بندی هوش مصنوعی</p>
                    <p className="mt-2 text-sm leading-7 text-blue-800">{submittedRequest.aiPriceEstimate.summary}</p>
                  </div>

                  {submittedRequest.aiPriceEstimate.factors?.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-gray-100 p-4">
                      <p className="mb-3 font-bold text-gray-900">عوامل مؤثر روی قیمت</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {submittedRequest.aiPriceEstimate.factors.map((factor: string, index: number) => (
                          <div key={index} className="rounded-xl bg-gray-50 px-3 py-2 text-sm leading-6 text-gray-700">✓ {factor}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-center text-sm text-amber-800">تخمین قیمت برای این درخواست در دسترس نیست.</div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href={`/requests/${submittedRequest.id}`} className="flex-1 rounded-xl bg-[#003b5c] px-5 py-3 text-center font-bold text-white transition hover:bg-[#002d46]">مشاهده صفحه درخواست</Link>
                <Link href="/requests" className="flex-1 rounded-xl border border-[#00a8e8] px-5 py-3 text-center font-bold text-[#00a8e8] transition hover:bg-blue-50">مشاهده همه درخواست‌ها</Link>
                <button type="button" onClick={() => { closeEstimateModal(); window.location.href = "/request-purchase"; }} className="flex-1 rounded-xl bg-gray-100 px-5 py-3 font-bold text-gray-700 transition hover:bg-gray-200">ثبت درخواست جدید</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-green-600 hover:text-green-700 flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            بازگشت به خانه
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ثبت درخواست خرید</h1>
          <p className="text-gray-600">
            درخواست خرید خود را ثبت کنید تا فروشندگان مرتبط به شما پیشنهاد دهند
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            چگونه کار می‌کند؟
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700 text-sm mr-4">
            <li>درخواست خرید خود را با جزئیات ثبت می‌کنید</li>
            <li>درخواست برای فروشندگان دسته‌بندی مرتبط ارسال می‌شود</li>
            <li>فروشندگان پیشنهاد قیمت و زمان ارسال می‌دهند</li>
            <li>شما بهترین پیشنهاد را انتخاب می‌کنید</li>
            <li>پرداخت امن انجام می‌دهید (وجه نزد پلتفرم امانت می‌ماند)</li>
            <li>پس از تحویل کالا و تایید شما، پرداخت به فروشنده انجام می‌شود</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">عنوان درخواست</h2>
            <input
              type="text"
              placeholder="مثال: خرید ۵ عدد لپ‌تاپ استوک برای شرکت"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <p className="text-sm text-gray-500 mt-2">عنوانی واضح و جذاب انتخاب کنید که ماهیت خرید را به خوبی نشان دهد</p>
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">دسته‌بندی کالا</h2>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">انتخاب دسته‌بندی</option>
              {categories.map((cat, i) => (
                <option key={i} value={cat}>{cat}</option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-2">فروشندگانی که این دسته‌بندی را انتخاب کرده‌اند، درخواست شما را می‌بینند</p>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">توضیحات درخواست</h2>
            <textarea
              placeholder="توضیحات کامل خرید، مشخصات مورد نیاز، تعداد، برند مورد نظر و هر اطلاعات دیگری که فروشنده باید بداند..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[200px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
            <p className="text-sm text-gray-500 mt-2">هرچه توضیحات کامل‌تری ارائه دهید، پیشنهادهای بهتری دریافت خواهید کرد</p>
          </div>

          {/* Budget */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">بودجه مورد نظر</h2>
            
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="مثال: ۱۰,۰۰۰,۰۰۰"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent pl-20"
                value={formData.budget}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, "");
                  if (!rawValue) {
                    setFormData({ ...formData, budget: "" });
                    return;
                  }
                  const formattedValue = Number(rawValue).toLocaleString('en-US');
                  setFormData({ ...formData, budget: formattedValue });
                }}
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">تومان</span>
            </div>

            <p className="text-sm text-gray-500">بودجه تقریبی خود را وارد کنید. فروشندگان می‌توانند پیشنهاد قیمت اصلاحی بدهند</p>
          </div>

          {/* Quantity */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">تعداد</h2>
            <input
              type="number"
              placeholder="۱"
              min="1"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>

          {/* Deadline */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">مهلت تحویل مورد انتظار</h2>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            >
              <option value="">انتخاب مهلت</option>
              <option value="1">۱ روز</option>
              <option value="3">۳ روز</option>
              <option value="7">۱ هفته</option>
              <option value="14">۲ هفته</option>
              <option value="30">۱ ماه</option>
              <option value="flexible">انعطاف‌پذیر</option>
            </select>
          </div>

          {/* Valuation Factors */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="mb-5 flex flex-col gap-2 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold">فاکتورهای تشخیص قیمت واقعی کالا</h2>
              <p className="text-sm leading-7 text-gray-500">
                این اطلاعات برای ارزش‌گذاری کالای دست‌دوم/استوک استفاده می‌شود. اگر قیمت مرجع بازار مثل ترب را وارد کنید، هوش مصنوعی OptiBid آن را معیار اصلی قرار می‌دهد و با وضعیت واقعی کالا تعدیل می‌کند.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-bold text-gray-700">
                وضعیت کالا
                <select value={formData.valuationFactors.productCondition} onChange={(e) => updateValuationFactor("productCondition", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-green-500">
                  <option value="new">نو</option>
                  <option value="open_box">اپن‌باکس</option>
                  <option value="refurbished">ریفربیشد / بازسازی‌شده</option>
                  <option value="used_like_new">دست‌دوم در حد نو</option>
                  <option value="used_good">دست‌دوم سالم</option>
                  <option value="used_fair">دست‌دوم معمولی</option>
                  <option value="for_parts">نیازمند تعمیر / قطعاتی</option>
                  <option value="unknown">نامشخص</option>
                </select>
              </label>

              <label className="block text-sm font-bold text-gray-700">
                قیمت مرجع بازار/ترب یا قیمت نوی همان کالا (هر واحد)
                <div className="relative mt-2">
                  <input type="text" value={formData.valuationFactors.sameNewProductPrice} onChange={(e) => updateValuationFactor("sameNewProductPrice", formatMoneyInput(e.target.value))} placeholder="مثال: ۲۶۲,۳۴۹,۹۹۰" className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-20 font-normal outline-none focus:ring-2 focus:ring-green-500" />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">تومان</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-amber-700">برای دقت بالا، قیمت ترب/بازار یا قیمت نوی همان مدل را وارد کنید؛ بودجه خریدار معیار قطعی قیمت واقعی نیست.</p>
              </label>

              <label className="block text-sm font-bold text-gray-700">
                سال ساخت / تولید
                <input type="text" value={formData.valuationFactors.manufactureYear} onChange={(e) => updateValuationFactor("manufactureYear", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="مثال: 2021" className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-green-500" />
              </label>

              <label className="block text-sm font-bold text-gray-700">
                وضعیت گارانتی
                <select value={formData.valuationFactors.warrantyStatus} onChange={(e) => updateValuationFactor("warrantyStatus", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-green-500">
                  <option value="manufacturer">گارانتی رسمی / شرکتی</option>
                  <option value="seller">گارانتی فروشنده</option>
                  <option value="test">مهلت تست کوتاه</option>
                  <option value="none">بدون گارانتی</option>
                  <option value="unknown">نامشخص</option>
                </select>
              </label>

              <label className="block text-sm font-bold text-gray-700">
                مدت گارانتی باقی‌مانده (ماه)
                <input type="text" value={formData.valuationFactors.warrantyMonths} onChange={(e) => updateValuationFactor("warrantyMonths", e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="مثال: ۶" className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-green-500" />
              </label>

              <label className="block text-sm font-bold text-gray-700">
                سلامت قطعات اصلی
                <select value={formData.valuationFactors.partsHealth} onChange={(e) => updateValuationFactor("partsHealth", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-green-500">
                  <option value="all_healthy">همه قطعات سالم</option>
                  <option value="minor_issue">ایراد جزئی</option>
                  <option value="needs_repair">نیازمند تعمیر</option>
                  <option value="unknown">نامشخص</option>
                </select>
              </label>

              <label className="block text-sm font-bold text-gray-700">
                سلامت باتری (درصد، اگر مرتبط است)
                <input type="text" value={formData.valuationFactors.batteryHealthPercent} onChange={(e) => updateValuationFactor("batteryHealthPercent", e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="مثال: ۸۵" className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-green-500" />
              </label>

              <label className="block text-sm font-bold text-gray-700">
                گرید ظاهری
                <select value={formData.valuationFactors.appearanceGrade} onChange={(e) => updateValuationFactor("appearanceGrade", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-green-500">
                  <option value="A">A - بسیار تمیز</option>
                  <option value="B">B - خط‌وخش جزئی</option>
                  <option value="C">C - خط‌وخش/آسیب ظاهری قابل مشاهده</option>
                  <option value="unknown">نامشخص</option>
                </select>
              </label>

              <label className="block text-sm font-bold text-gray-700">
                سابقه تعمیر
                <select value={formData.valuationFactors.repairHistory} onChange={(e) => updateValuationFactor("repairHistory", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-green-500">
                  <option value="none">بدون تعمیر</option>
                  <option value="minor">تعمیر جزئی</option>
                  <option value="major">تعمیر اساسی / تعویض قطعه اصلی</option>
                  <option value="unknown">نامشخص</option>
                </select>
              </label>

              <label className="block text-sm font-bold text-gray-700">
                میزان کارکرد
                <select value={formData.valuationFactors.usageLevel} onChange={(e) => updateValuationFactor("usageLevel", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-green-500">
                  <option value="low">کم‌کارکرد</option>
                  <option value="normal">کارکرد معمولی</option>
                  <option value="heavy">پرکارکرد</option>
                  <option value="unknown">نامشخص</option>
                </select>
              </label>

              <label className="block text-sm font-bold text-gray-700">
                لوازم جانبی همراه
                <select value={formData.valuationFactors.accessoriesStatus} onChange={(e) => updateValuationFactor("accessoriesStatus", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-green-500">
                  <option value="complete">کامل</option>
                  <option value="missing_minor">کسری جزئی</option>
                  <option value="missing_key">کسری مهم مثل شارژر/کابل/ریموت</option>
                  <option value="unknown">نامشخص</option>
                </select>
              </label>

              <label className="block text-sm font-bold text-gray-700">
                جعبه اصلی
                <select value={formData.valuationFactors.originalPackaging} onChange={(e) => updateValuationFactor("originalPackaging", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-green-500">
                  <option value="yes">دارد</option>
                  <option value="no">ندارد</option>
                  <option value="unknown">نامشخص</option>
                </select>
              </label>

              <label className="block text-sm font-bold text-gray-700">
                فاکتور خرید / اصالت
                <select value={formData.valuationFactors.purchaseInvoiceAvailable} onChange={(e) => updateValuationFactor("purchaseInvoiceAvailable", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-green-500">
                  <option value="yes">فاکتور یا مدرک اصالت دارد</option>
                  <option value="no">ندارد</option>
                  <option value="unknown">نامشخص</option>
                </select>
              </label>

              <label className="block text-sm font-bold text-gray-700">
                وضعیت موجودی در بازار
                <select value={formData.valuationFactors.marketAvailability} onChange={(e) => updateValuationFactor("marketAvailability", e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-green-500">
                  <option value="available">موجود و رایج</option>
                  <option value="rare">کمیاب</option>
                  <option value="discontinued">توقف تولید / قدیمی</option>
                  <option value="unknown">نامشخص</option>
                </select>
              </label>
            </div>

            <label className="mt-4 block text-sm font-bold text-gray-700">
              توضیحات تکمیلی ارزش‌گذاری
              <textarea value={formData.valuationFactors.valuationNotes} onChange={(e) => updateValuationFactor("valuationNotes", e.target.value)} placeholder="مثلاً: خط روی بدنه، تعویض باتری، شارژر غیر اصل، تست سلامت، شماره سریال، وضعیت پلمب و ..." className="mt-2 min-h-24 w-full rounded-lg border border-gray-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-green-500" />
            </label>
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">پیوست‌ها (اختیاری)</h2>
            <p className="text-sm text-gray-500 mb-4">می‌توانید عکس محصول مورد نظر یا مستندات مربوطه را آپلود کنید تا فروشندگان بهتر شما را راهنمایی کنند.</p>
            
            <div className="border-2 border-dashed border-green-300 bg-green-50/50 hover:bg-green-50 rounded-lg p-8 text-center transition relative">
              <input 
                type="file" 
                multiple 
                accept="image/*,.pdf,.doc,.docx,.zip"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="برای انتخاب فایل کلیک کنید"
              />
              <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m0-3v12" />
              </svg>
              <p className="text-green-800 font-bold mb-2">برای آپلود کلیک کنید یا فایل‌ها را اینجا بکشید و رها کنید</p>
              <button type="button" className="mt-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-bold pointer-events-none relative z-10">
                انتخاب فایل / تصاویر
              </button>
              <p className="text-gray-400 text-sm mt-4">حداکثر حجم: ۱۰ مگابایت | فرمت‌ها: PDF, DOC, DOCX, ZIP, JPG, PNG</p>
            </div>

            {/* Preview Section */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6 border-t border-gray-100 pt-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  فایل‌های آپلود شده ({uploadedFiles.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {previews.map((src, index) => (
                    <div key={index} className="relative group rounded-xl border border-gray-200 bg-gray-50 overflow-hidden aspect-square flex flex-col items-center justify-center p-2">
                      {uploadedFiles[index].type.startsWith('image/') ? (
                        <img src={src} alt="preview" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                          <span className="text-xs text-gray-500 font-mono truncate w-full text-center px-2">{uploadedFiles[index].name}</span>
                        </div>
                      )}
                      
                      {/* Delete Overlay */}
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); removeFile(index); }}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="حذف فایل"
                      >
                        <svg className="w-8 h-8 text-white hover:text-red-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Security Info */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              پرداخت امن با سیستم امانت‌داری
            </h3>
            <p className="text-green-700 text-sm">
              پس از انتخاب پیشنهاد فروشنده، مبلغ پرداختی شما نزد پلتفرم امانت می‌ماند. 
              پس از تحویل کالا و تایید نهایی شما، وجه (با کسر کمیسیون پلتفرم) به فروشنده واریز می‌شود.
            </p>
          </div>

          {/* Submit */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-600 text-sm">
                با ثبت درخواست، شما <Link href="/rules" className="text-green-600 hover:underline">قوانین و مقررات</Link> OptiBid را می‌پذیرید
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`text-white px-8 py-3 rounded-lg font-bold transition w-full sm:w-auto ${
                  isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isSubmitting ? "در حال ذخیره در دیتابیس..." : "ثبت درخواست خرید در پایگاه داده"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
