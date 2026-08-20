import Link from "next/link";
import { notFound } from "next/navigation";
import { getJsonRequests } from "@/lib/json-store";

interface CategoryDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const { id } = await params;

  // لیست دسته‌بندی‌ها (معادل دیتابیس)
  const categoriesDb = [
    { id: 1, nameFa: "کالای دیجیتال", icon: "📱", desc: "تجهیزات الکترونیکی، موبایل، لپ‌تاپ و سرور" },
    { id: 2, nameFa: "مد و پوشاک", icon: "👕", desc: "خرید عمده پوشاک، کیف و کفش و اکسسوری" },
    { id: 3, nameFa: "خانه و آشپزخانه", icon: "🏠", desc: "تجهیزات خانگی، دکوراسیون و ظروف صنعتی" },
    { id: 4, nameFa: "زیبایی و سلامت", icon: "💄", desc: "محصولات آرایشی، بهداشتی و تجهیزات پزشکی" },
    { id: 5, nameFa: "کتاب و لوازم تحریر", icon: "📚", desc: "کتب آموزشی، نوشت‌افزار و تجهیزات اداری" },
    { id: 6, nameFa: "ورزش و سفر", icon: "⚽", desc: "لوازم ورزشی، کمپینگ و پوشاک ورزشی" },
    { id: 7, nameFa: "اسباب‌بازی و کودک", icon: "🧸", desc: "خرید اسباب‌بازی، سیسمونی و لباس کودک" },
    { id: 8, nameFa: "خودرو و موتور", icon: "🚗", desc: "لوازم یدکی، تجهیزات خودرو و ابزار" },
  ];

  const category = categoriesDb.find(c => c.id === parseInt(id));

  if (!category) {
    notFound();
  }

  // دریافت درخواست‌های واقعی ذخیره‌شده در JSON و محدود کردن به دسته فعلی
  const allRequests = await getJsonRequests();
  const categoryRequests = allRequests
    .filter((request) => request.category.trim() === category.nameFa)
    .map((request) => ({
      id: request.id,
      title: request.title,
      budget: Number(request.budget || 0).toLocaleString("fa-IR") + " تومان",
      buyer: request.buyerName || "خریدار",
      buyerRating: 0,
      timeAgo: "جدید",
      offers: request.offersCount,
      quantity: request.quantity,
      description: request.description,
    }));

  // فروشندگان واقعی بعداً از داده‌های ثبت‌نام JSON خوانده می‌شوند.
  const categorySellers: Array<{ id: number; name: string; rating: number; sales: number }> = [];

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-20">
      {/* Header Banner */}
      <div className="bg-[#003b5c] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-4">{category.icon}</div>
          <h1 className="text-4xl font-bold mb-4">{category.nameFa}</h1>
          <p className="text-[#00a8e8] text-lg max-w-2xl mx-auto">{category.desc}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Main Content - Requests */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900">آخرین درخواست‌های خرید ({category.nameFa})</h2>
                <Link href={`/requests?category=${category.nameFa}`} className="text-sm text-[#00a8e8] font-bold hover:underline">مشاهده همه</Link>
              </div>

              <div className="space-y-4">
                {categoryRequests.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
                    <div className="mb-3 text-4xl">📭</div>
                    <h3 className="font-bold text-gray-700">هنوز درخواستی در این دسته ثبت نشده است</h3>
                    <p className="mt-2 text-sm text-gray-500">اولین درخواست واقعی این دسته را ثبت کنید.</p>
                  </div>
                ) : (
                  categoryRequests.map((req) => (
                    <Link href={`/requests/${req.id}`} key={req.id} className="block rounded-xl border border-gray-100 p-5 transition hover:border-[#00a8e8]">
                      <div className="mb-2 flex justify-between">
                        <h3 className="text-lg font-bold text-gray-900">{req.title}</h3>
                        <span className="text-xs text-gray-500">{req.timeAgo}</span>
                      </div>
                      <p className="line-clamp-2 text-sm leading-7 text-gray-600">{req.description}</p>
                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <div className="mb-1 text-sm text-gray-500">بودجه خرید:</div>
                          <div className="font-bold text-[#00a8e8]">{req.budget}</div>
                        </div>
                        <div className="text-left text-sm text-gray-500">
                          <div>خریدار: {req.buyer}</div>
                          <div className="mt-1 font-bold text-[#0b9c56]">{req.offers} پیشنهاد ثبت شده</div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Actions & Top Sellers */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
              <h3 className="font-bold text-gray-900 mb-4">آیا در حوزه {category.nameFa} فعالیت دارید؟</h3>
              <p className="text-sm text-gray-500 mb-6">درخواست خود را برای تامین کالا ثبت کنید یا به عنوان فروشنده وارد شوید.</p>
              <div className="space-y-3">
                <Link href="/request-purchase" className="block w-full bg-[#00a8e8] hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition">
                  ثبت درخواست خرید
                </Link>
                <Link href="/become-seller" className="block w-full bg-[#003b5c] hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition">
                  شروع فروشندگی در این دسته
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">تامین‌کنندگان برتر این دسته</h3>
              <div className="space-y-4">
                {categorySellers.length === 0 ? (
                  <p className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">
                    هنوز تامین‌کننده تاییدشده‌ای در این دسته ثبت نشده است.
                  </p>
                ) : (
                  categorySellers.map((seller) => (
                    <Link href={`/sellers/${seller.id}`} key={seller.id} className="group flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-500">
                          {seller.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-800 transition group-hover:text-[#00a8e8]">{seller.name}</div>
                          <div className="text-xs text-gray-500">⭐ {seller.rating} | {seller.sales} فروش</div>
                        </div>
                      </div>
                      <svg className="h-4 w-4 text-gray-300 group-hover:text-[#00a8e8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
