import Link from "next/link";
import SellerStars from "@/components/SellerStars";
import { getJsonBuyerRankings } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export default async function BuyersPage() {
  const rankings = await getJsonBuyerRankings();
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#003b5c]">اعتبار دوطرفه</span>
          <h1 className="mt-3 text-3xl font-bold text-[#003b5c]">خریداران OptiBid</h1>
          <p className="mt-2 text-gray-600">رتبه خریدار فقط از نظر فروشندگان در معاملات تکمیل‌شده محاسبه می‌شود.</p>
        </div>
        {rankings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-14 text-center text-gray-500">هنوز خریدار دارای سابقه نظرسنجی وجود ندارد.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rankings.map(({ buyer, rating, reviewsCount, completedOrders, rankingEligible }) => (
              <Link key={buyer.id} href={`/buyers/${buyer.id}`} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#00a8e8] hover:shadow-lg">
                <div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-bold text-[#003b5c]">{buyer.fullName.charAt(0)}</div><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-gray-900">{buyer.fullName}</h2><SellerStars score={rating * 20} size="sm" /></div><p className="mt-1 text-xs text-gray-500">{rankingEligible ? "واجد شرایط رتبه‌بندی" : "در حال ارزیابی"}</p></div></div>
                <div className="mt-5 rounded-2xl bg-gray-50 p-4"><SellerStars score={rating * 20} /><div className="mt-3 flex justify-between text-xs text-gray-500"><span>{completedOrders} معامله موفق</span><span>{reviewsCount} نظر فروشنده</span></div></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
