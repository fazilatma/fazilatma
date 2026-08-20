import Link from "next/link";
import { notFound } from "next/navigation";
import SellerStars from "@/components/SellerStars";
import { getJsonBuyerRankings, getOptiBidData } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export default async function BuyerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, rankings] = await Promise.all([getOptiBidData(), getJsonBuyerRankings()]);
  const entry = rankings.find((item) => item.buyer.id === Number(id));
  if (!entry) notFound();
  const reviews = data.reviews.filter((review) => review.revieweeId === entry.buyer.id && review.reviewerRole === "seller");

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <nav className="mb-6 text-sm text-gray-500"><Link href="/buyers">خریداران</Link><span className="mx-2">/</span>{entry.buyer.fullName}</nav>
        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="bg-gradient-to-l from-[#003b5c] to-[#005e94] p-8 text-white"><div className="flex items-center gap-5"><div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 text-4xl font-bold">{entry.buyer.fullName.charAt(0)}</div><div><h1 className="text-3xl font-bold">{entry.buyer.fullName}</h1><p className="mt-2 text-blue-100">{entry.buyer.city || "موقعیت ثبت نشده"}</p></div></div></div>
          <div className="grid gap-6 p-8 md:grid-cols-3"><div className="rounded-2xl bg-blue-50 p-6 text-center"><p className="text-sm text-gray-600">امتیاز فروشندگان</p><div className="mt-3"><SellerStars score={entry.rating * 20} size="lg" /></div><p className="mt-2 text-xs text-gray-500">{entry.rankingEligible ? "واجد شرایط رتبه‌بندی" : "در حال ارزیابی"}</p></div><div className="rounded-2xl bg-gray-50 p-6 text-center"><p className="text-3xl font-bold text-[#003b5c]">{entry.completedOrders}</p><p className="mt-2 text-sm text-gray-500">معامله موفق</p></div><div className="rounded-2xl bg-gray-50 p-6 text-center"><p className="text-3xl font-bold text-[#003b5c]">{entry.reviewsCount}</p><p className="mt-2 text-sm text-gray-500">نظر فروشنده</p></div></div>
          <div className="border-t p-8"><h2 className="mb-3 text-xl font-bold text-gray-900">درباره خریدار</h2><p className="leading-8 text-gray-600">{entry.buyer.bio || "خریدار هنوز توضیحی درباره خود ثبت نکرده است."}</p></div>
        </section>
        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm"><h2 className="mb-5 text-xl font-bold">نظرات فروشندگان</h2>{reviews.length === 0 ? <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">هنوز نظری ثبت نشده است.</p> : <div className="space-y-4">{reviews.map((review) => <article key={review.id} className="rounded-2xl border border-gray-100 p-5"><SellerStars score={review.overall * 20} size="sm" /><p className="mt-3 text-sm leading-7 text-gray-600">{review.comment || "بدون توضیح"}</p><p className="mt-2 text-xs text-gray-400">سفارش {review.orderId}</p></article>)}</div>}</section>
      </div>
    </div>
  );
}
