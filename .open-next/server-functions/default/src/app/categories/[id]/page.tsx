import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductThumb } from "@/components/ProductImages";
import { getJsonCatalogCategories, getJsonRequests } from "@/lib/json-store";

interface CategoryDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function CategoryDetailPage({
  params,
}: CategoryDetailPageProps) {
  const { id } = await params;
  const categories = await getJsonCatalogCategories();
  const category = categories.find(
    (item) => String(item.legacyId) === id || item.id === id,
  );
  if (!category) notFound();

  const allRequests = await getJsonRequests();
  const categoryRequests = allRequests
    .filter((request) => request.category.trim() === category.name)
    .map((request) => ({
      id: request.id,
      title: request.title,
      budget: Number(request.budget || 0).toLocaleString("fa-IR") + " تومان",
      buyer: request.buyerName || "خریدار",
      timeAgo: "جدید",
      offers: request.offersCount,
      quantity: request.quantity,
      description: request.description,
      productImages: request.productImages || [],
    }));

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-[#003b5c] py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 text-6xl">{category.icon}</div>
          <h1 className="mb-3 text-4xl font-bold">{category.name}</h1>
          <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2">
            {category.subcategories.slice(0, 8).map((group) => (
              <span
                key={group.id}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-blue-50"
              >
                {group.title}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <main className="space-y-6 md:col-span-2">
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  آخرین درخواست‌های خرید ({category.name})
                </h2>
                <Link
                  href={`/requests?category=${category.name}`}
                  className="text-sm font-bold text-[#00a8e8] hover:underline"
                >
                  مشاهده همه
                </Link>
              </div>

              <div className="space-y-4">
                {categoryRequests.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
                    <div className="mb-3 text-4xl">📭</div>
                    <h3 className="font-bold text-gray-700">
                      هنوز درخواستی در این دسته ثبت نشده است
                    </h3>
                  </div>
                ) : (
                  categoryRequests.map((req) => (
                    <Link
                      href={`/requests/${req.id}`}
                      key={req.id}
                      className="block rounded-xl border border-gray-100 p-5 transition hover:border-[#00a8e8]"
                    >
                      <div className="mb-3 flex justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <ProductThumb
                            images={req.productImages}
                            title={req.title}
                            category={category.name}
                            className="h-16 w-16"
                          />
                          <h3 className="text-lg font-bold text-gray-900">
                            {req.title}
                          </h3>
                        </div>
                        <span className="shrink-0 text-xs text-gray-500">
                          {req.timeAgo}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm leading-7 text-gray-600">
                        {req.description}
                      </p>
                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <div className="mb-1 text-sm text-gray-500">بودجه خرید:</div>
                          <div className="font-bold text-[#00a8e8]">{req.budget}</div>
                        </div>
                        <div className="text-left text-sm text-gray-500">
                          <div>خریدار: {req.buyer}</div>
                          <div className="mt-1 font-bold text-[#0b9c56]">
                            {req.offers} پیشنهاد ثبت شده
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </main>

          <aside className="space-y-6 md:col-span-1">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 border-b border-gray-100 pb-3 font-bold text-gray-900">
                زیردسته‌های {category.name}
              </h3>
              <div className="space-y-4">
                {category.subcategories.map((group) => (
                  <div key={group.id} className="rounded-2xl bg-gray-50 p-4">
                    <h4 className="font-bold text-[#003b5c]">{group.title}</h4>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.items.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-white px-3 py-1 text-xs text-gray-600"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
