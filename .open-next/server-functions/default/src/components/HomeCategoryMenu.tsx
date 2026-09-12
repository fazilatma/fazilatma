"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { categoryHref, type CatalogCategory } from "@/lib/catalog-categories";

type CategoryWithCount = CatalogCategory & { count?: number };

export default function HomeCategoryMenu({
  categories,
}: {
  categories: CategoryWithCount[];
}) {
  const activeCategories = useMemo(
    () => categories.filter((category) => category.isActive !== false),
    [categories],
  );
  const [activeId, setActiveId] = useState(activeCategories[0]?.id || "");
  const activeCategory =
    activeCategories.find((category) => category.id === activeId) ||
    activeCategories[0];

  if (activeCategories.length === 0) return null;

  return (
    <div className="relative rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {activeCategories.map((category) => {
          const active = category.id === activeCategory?.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveId(category.id)}
              onMouseEnter={() => setActiveId(category.id)}
              className={`flex min-w-24 flex-col items-center gap-2 rounded-2xl px-3 py-3 text-center transition ${
                active
                  ? "bg-blue-50 text-[#003b5c] ring-1 ring-blue-100"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-inner">
                {category.icon}
              </span>
              <span className="line-clamp-2 text-xs font-black leading-5">
                {category.name}
              </span>
            </button>
          );
        })}
      </div>

      {activeCategory && (
        <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
                {activeCategory.icon}
              </span>
              <div>
                <h3 className="font-black text-gray-900">{activeCategory.name}</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {(activeCategory.count || 0).toLocaleString("fa-IR")} درخواست فعال
                </p>
              </div>
            </div>
            <Link
              href={categoryHref(activeCategory)}
              className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#00a8e8] shadow-sm hover:bg-blue-50"
            >
              مشاهده همه
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeCategory.subcategories.length === 0 ? (
              <div className="rounded-2xl bg-white p-4 text-sm text-gray-500">
                هنوز زیردسته‌ای برای این دسته ثبت نشده است.
              </div>
            ) : (
              activeCategory.subcategories.map((group) => (
                <div key={group.id} className="rounded-2xl bg-white p-4 shadow-sm">
                  <Link
                    href={categoryHref(activeCategory)}
                    className="mb-3 block border-r-2 border-red-500 pr-2 text-sm font-black text-gray-900 hover:text-[#00a8e8]"
                  >
                    {group.title}
                  </Link>
                  <div className="grid gap-2">
                    {group.items.slice(0, 8).map((item) => (
                      <Link
                        key={item}
                        href={categoryHref(activeCategory)}
                        className="text-xs leading-6 text-gray-500 hover:text-[#00a8e8]"
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
