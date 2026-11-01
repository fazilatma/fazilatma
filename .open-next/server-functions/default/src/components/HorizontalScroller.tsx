"use client";

import { type ReactNode, useRef } from "react";

type HorizontalScrollerProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  arrowClassName?: string;
  scrollAmount?: number;
};

export default function HorizontalScroller({
  children,
  className = "",
  contentClassName = "flex gap-3 overflow-x-auto scroll-smooth pb-2",
  arrowClassName = "bg-white/95 text-[#003b5c] hover:bg-white",
  scrollAmount = 360,
}: HorizontalScrollerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const move = (direction: "next" | "previous") => {
    scrollerRef.current?.scrollBy({
      // صفحه RTL است؛ برای رفتن به آیتم‌های بعدی باید محتوا به چپ حرکت کند.
      left: direction === "next" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => move("previous")}
        className={`absolute right-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-2xl font-black shadow-lg ring-1 ring-black/5 transition hover:scale-105 ${arrowClassName}`}
        aria-label="آیتم‌های قبلی"
      >
        ›
      </button>
      <button
        type="button"
        onClick={() => move("next")}
        className={`absolute left-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-2xl font-black shadow-lg ring-1 ring-black/5 transition hover:scale-105 ${arrowClassName}`}
        aria-label="آیتم‌های بعدی"
      >
        ‹
      </button>
      <div ref={scrollerRef} className={`${contentClassName} px-12`}>
        {children}
      </div>
    </div>
  );
}
