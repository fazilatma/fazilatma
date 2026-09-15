"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductHeroImage } from "@/components/ProductImages";
import type { ProductImageAttachment } from "@/lib/product-image-shared";

export type PersonalizedRequestItem = {
  id: number;
  title: string;
  description: string;
  category: string;
  budget: string;
  quantity: number;
  offers: number;
  productImages?: ProductImageAttachment[];
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

function readSearchHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem("optibid_search_history") || "[]");
    return Array.isArray(parsed)
      ? parsed.map(String).map(normalize).filter((term) => term.length >= 2).slice(0, 8)
      : [];
  } catch {
    return [];
  }
}

function PersonalizedRow({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: PersonalizedRequestItem[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-900">{title}</h2>
          <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        </div>
        <Link
          href="/requests"
          className="shrink-0 rounded-xl bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100"
        >
          مشاهده همه
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((item) => (
          <Link
            href={`/requests/${item.id}`}
            key={`${title}-${item.id}`}
            className="w-44 shrink-0 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <ProductHeroImage
              images={item.productImages}
              title={item.title}
              category={item.category}
              className="mx-auto h-24 w-24 rounded-xl"
            />
            <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-black leading-5 text-gray-900">
              {item.title}
            </h3>
            <p className="mt-2 text-sm font-black text-[#0b9c56]">{item.budget}</p>
            <p className="mt-1 text-[11px] text-gray-400">
              {item.offers.toLocaleString("fa-IR")} پیشنهاد · تعداد {item.quantity.toLocaleString("fa-IR")}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function PersonalizedRequestRows({
  requests,
  titles,
}: {
  requests: PersonalizedRequestItem[];
  titles?: {
    personalizedTitle?: string;
    personalizedSubtitle?: string;
    relatedTitle?: string;
    relatedSubtitle?: string;
  };
}) {
  const [terms, setTerms] = useState<string[]>([]);

  useEffect(() => {
    setTerms(readSearchHistory());
  }, []);

  const matched = useMemo(() => {
    if (terms.length === 0) return [];
    return requests
      .filter((request) => {
        const haystack = normalize(`${request.title} ${request.description} ${request.category}`);
        return terms.some((term) => haystack.includes(term));
      })
      .slice(0, 10);
  }, [requests, terms]);

  const related = useMemo(() => {
    if (matched.length === 0) return [];
    const categories = new Set(matched.map((request) => request.category));
    return requests
      .filter(
        (request) =>
          categories.has(request.category) &&
          !matched.some((matchedItem) => matchedItem.id === request.id),
      )
      .slice(0, 10);
  }, [matched, requests]);

  if (terms.length === 0 || (matched.length === 0 && related.length === 0)) return null;

  return (
    <section className="bg-gray-50 py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <PersonalizedRow
          title={titles?.personalizedTitle || "بر اساس جستجوهای اخیر شما"}
          subtitle={`${titles?.personalizedSubtitle || "کلیدواژه‌های اخیر"}: ${terms.slice(0, 4).join("، ")}`}
          items={matched}
        />
        <PersonalizedRow
          title={titles?.relatedTitle || "پیشنهادهای نزدیک به علاقه شما"}
          subtitle={titles?.relatedSubtitle || "آگهی‌های هم‌دسته با جستجوهای قبلی شما"}
          items={related}
        />
      </div>
    </section>
  );
}
