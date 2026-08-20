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
        alert("درخواست خرید شما با موفقیت در دیتابیس ثبت شد!\n\nاکنون می‌توانید آن را در صفحه اصلی و صفحه درخواست‌ها مشاهده کنید.");
        window.location.href = "/requests";
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
