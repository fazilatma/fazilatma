import Link from "next/link";
import { categoryHref } from "@/lib/catalog-categories";
import { getJsonCatalogCategories, getJsonRequests } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const [categories, requests] = await Promise.all([
    getJsonCatalogCategories(),
    getJsonRequests().catch(() => []),
  ]);

  const countByCategory = new Map<string, number>();
  for (const request of requests) {
    countByCategory.set(
      request.category,
      (countByCategory.get(request.category) || 0) + 1,
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">دسته‌بندی‌ها</h1>
          <p className="mx-auto max-w-3xl text-xl text-gray-600">
            دسته‌های اصلی و زیردسته‌های قابل مدیریت از پنل ادمین
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={categoryHref(category)}
              className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#003b5c] to-[#00a8e8] text-3xl transition group-hover:scale-110">
                  {category.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {(countByCategory.get(category.name) || 0).toLocaleString("fa-IR")} درخواست
                  </p>
                </div>
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                {category.subcategories.slice(0, 5).map((group) => (
                  <span
                    key={group.id}
                    className="rounded-full bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600"
                  >
                    {group.title}
                  </span>
                ))}
              </div>
              <span className="font-bold text-[#00a8e8]">مشاهده درخواست‌ها ←</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
