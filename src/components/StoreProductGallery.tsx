"use client";

import { useMemo, useState } from "react";

type StoreProductGalleryProps = {
  title: string;
  brand: string;
  imageUrls: string[];
};

export default function StoreProductGallery({
  title,
  brand,
  imageUrls,
}: StoreProductGalleryProps) {
  const images = useMemo(
    () => imageUrls.map((url) => String(url || "").trim()).filter(Boolean).filter((url, index, urls) => urls.indexOf(url) === index).slice(0, 8),
    [imageUrls],
  );
  const [selected, setSelected] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const availableImages = images.filter((url) => !failed.includes(url));
  const selectedUrl = availableImages[Math.min(selected, Math.max(0, availableImages.length - 1))] || "";

  const markFailed = (url: string) => {
    setFailed((current) => current.includes(url) ? current : [...current, url]);
    setSelected(0);
  };

  return (
    <div className="space-y-3" aria-label={`گالری تصاویر ${title}`}>
      <div className="relative grid h-72 place-items-center overflow-hidden rounded-[1.75rem] border border-slate-100 bg-gradient-to-br from-slate-100 via-white to-blue-50 sm:h-80">
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-sky-400/10" />
        <div className="absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-rose-400/10" />
        {selectedUrl ? (
          <img
            key={selectedUrl}
            src={selectedUrl}
            alt={`عکس ${title}`}
            className="relative z-10 h-full w-full bg-white object-contain p-3"
            decoding="async"
            onError={() => markFailed(selectedUrl)}
          />
        ) : (
          <div className="relative z-10 text-center text-slate-500">
            <div className="text-5xl">🖼️</div>
            <p className="mt-3 text-sm font-bold">تصویر محصول در دسترس نیست</p>
          </div>
        )}
        <span className="absolute right-4 top-4 z-20 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[#003b5c] shadow-sm">
          {brand}
        </span>
      </div>

      {availableImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="انتخاب تصویر محصول">
          {availableImages.map((url, index) => (
            <button
              key={url}
              type="button"
              role="listitem"
              onClick={() => setSelected(index)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1 transition ${selectedUrl === url ? "border-rose-500 shadow-md" : "border-slate-200 hover:border-sky-400"}`}
              aria-label={`نمایش تصویر ${(index + 1).toLocaleString("fa-IR")}`}
            >
              <img
                src={url}
                alt=""
                className="h-full w-full object-contain"
                loading="lazy"
                decoding="async"
                onError={() => markFailed(url)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
