import Link from "next/link";
import { notFound } from "next/navigation";
import { getOptiBidData } from "@/lib/json-store";

interface RequestDetailPageProps { params: Promise<{ id: string }> }

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({ params }: RequestDetailPageProps) {
  const { id } = await params;
  const data = await getOptiBidData();
  const request = data.requests.find((item) => item.id === Number(id));
  if (!request) notFound();

  const offers = data.offers.filter((item) => item.requestId === request.id);
  const sellerById = new Map(data.users.filter((user) => user.role === "seller").map((user) => [user.id, user]));

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <nav className="mb-6 text-sm text-gray-500"><Link href="/" className="hover:text-[#00a8e8]">خانه</Link><span className="mx-2">/</span><Link href="/requests" className="hover:text-[#00a8e8]">درخواست‌های خرید</Link><span className="mx-2">/</span><span>{request.title}</span></nav>
        <div className="grid gap-6 md:grid-cols-3">
          <main className="space-y-6 md:col-span-2">
            <section className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="mb-4 flex flex-wrap gap-2"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{request.category}</span><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">تعداد: {request.quantity}</span><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">{request.status}</span></div>
              <h1 className="text-3xl font-bold text-[#003b5c]">{request.title}</h1>
              <p className="mt-5 whitespace-pre-line leading-8 text-gray-700">{request.description}</p>
              {request.aiPriceEstimate && <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5"><h2 className="mb-3 font-bold text-[#003b5c]">🤖 تخمین قیمت هوشمند OptiBid</h2><div className="grid gap-3 text-sm md:grid-cols-2"><div className="rounded-xl bg-white p-3"><span className="text-gray-500">قیمت منصفانه هر واحد:</span><b className="mt-1 block text-[#0b9c56]">{request.aiPriceEstimate.estimatedUnitFair.toLocaleString("fa-IR")} تومان</b></div><div className="rounded-xl bg-white p-3"><span className="text-gray-500">بازه کل:</span><b className="mt-1 block text-[#0b9c56]">{request.aiPriceEstimate.estimatedTotalMin.toLocaleString("fa-IR")} تا {request.aiPriceEstimate.estimatedTotalMax.toLocaleString("fa-IR")} تومان</b></div><div className="rounded-xl bg-white p-3"><span className="text-gray-500">اعتماد تخمین:</span><b className="mt-1 block">{request.aiPriceEstimate.confidence.toLocaleString("fa-IR")}٪</b></div><div className="rounded-xl bg-white p-3"><span className="text-gray-500">افت نسبت به نو:</span><b className="mt-1 block">{request.aiPriceEstimate.depreciationPercent.toLocaleString("fa-IR")}٪</b></div></div><p className="mt-3 text-xs leading-6 text-blue-800">{request.aiPriceEstimate.summary}</p></div>}
              {request.valuationFactors && <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-5"><h2 className="mb-3 font-bold text-gray-800">فاکتورهای ثبت‌شده برای ارزش‌گذاری</h2><div className="grid gap-2 text-xs text-gray-600 md:grid-cols-2"><span>قیمت نو مشابه: <b>{request.valuationFactors.sameNewProductPrice || "—"}</b></span><span>سال ساخت: <b>{request.valuationFactors.manufactureYear || "—"}</b></span><span>گارانتی: <b>{request.valuationFactors.warrantyStatus}</b></span><span>سلامت قطعات: <b>{request.valuationFactors.partsHealth}</b></span><span>گرید ظاهری: <b>{request.valuationFactors.appearanceGrade}</b></span><span>سابقه تعمیر: <b>{request.valuationFactors.repairHistory}</b></span></div></div>}
              {request.imageNames.length > 0 && <div className="mt-6 border-t pt-5"><h2 className="mb-3 font-bold">پیوست‌های درخواست</h2><div className="flex flex-wrap gap-2">{request.imageNames.map((name) => <span key={name} className="rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-600">📎 {name}</span>)}</div></div>}
            </section>
            <section className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">پیشنهادهای واقعی فروشندگان ({offers.length})</h2><span className="text-sm text-gray-500">به‌روزرسانی از JSON</span></div>
              {offers.length === 0 ? <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-500">هنوز فروشنده‌ای برای این درخواست پیشنهاد ثبت نکرده است.</div> : <div className="space-y-4">{offers.map((offer) => { const seller = sellerById.get(offer.sellerId); return <div key={offer.id} className="rounded-2xl border border-gray-200 p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><h3 className="font-bold text-[#003b5c]">{offer.sellerName}</h3><p className="mt-1 text-xs text-gray-500">زمان تحویل: {offer.deliveryDays} روز · وضعیت پیشنهاد: {offer.status}</p><p className="mt-3 text-sm text-gray-700">{offer.message || "توضیحی ثبت نشده است."}</p>{seller && <Link href={`/sellers/${seller.id}`} className="mt-3 inline-block text-sm font-bold text-[#00a8e8]">مشاهده پروفایل فروشنده</Link>}</div><div className="text-left"><p className="text-2xl font-bold text-[#0b9c56]">{Number(offer.amount).toLocaleString("fa-IR")} تومان</p>{offer.status === "pending" && <Link href="/buyer/dashboard" className="mt-3 inline-block rounded-xl bg-[#003b5c] px-4 py-2 text-sm font-bold text-white">انتخاب از داشبورد خریدار</Link>}</div></div></div>; })}</div>}
            </section>
          </main>
          <aside className="space-y-5"><div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="mb-4 font-bold">خلاصه درخواست</h2><div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-gray-500">بودجه:</span><b className="text-[#0b9c56]">{Number(request.budget).toLocaleString("fa-IR")} تومان</b></div><div className="flex justify-between"><span className="text-gray-500">پیشنهادها:</span><b>{request.offersCount}</b></div><div className="flex justify-between"><span className="text-gray-500">مهلت:</span><b>{request.deadline === "flexible" ? "انعطاف‌پذیر" : `${request.deadline} روز`}</b></div></div></div><div className="rounded-3xl bg-gradient-to-l from-[#003b5c] to-[#005e94] p-6 text-white"><h2 className="font-bold">سیستم پرداخت امانی</h2><p className="mt-3 text-sm leading-7 text-blue-100">خریدار پس از انتخاب پیشنهاد و پرداخت، وجه را تا تایید دریافت کالا در امانت OptiBid نگه می‌دارد.</p></div></aside>
        </div>
      </div>
    </div>
  );
}
