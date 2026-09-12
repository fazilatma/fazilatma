import {
  productImageUrl,
  type ProductImageAttachment,
} from "@/lib/product-image-shared";

type ProductFallbackKind =
  | "laptop"
  | "phone"
  | "car"
  | "book"
  | "clothes"
  | "home"
  | "health"
  | "sport"
  | "toy"
  | "industrial"
  | "generic";

function detectProductKind(title: string, category = ""): ProductFallbackKind {
  const text = `${title} ${category}`.toLowerCase();
  if (/لپ|لب تاب|لپتاپ|laptop|notebook|thinkpad|vostro|latitude|dell|lenovo|asus|rog|hp|macbook|acer/.test(text)) return "laptop";
  if (/موبایل|گوشی|mobile|phone|iphone|samsung|xiaomi|tablet|تبلت/.test(text)) return "phone";
  if (/خودرو|ماشین|موتور|car|auto/.test(text)) return "car";
  if (/کتاب|تحریر|book|stationery/.test(text)) return "book";
  if (/پوشاک|لباس|کفش|مد|clothes|fashion/.test(text)) return "clothes";
  if (/خانه|آشپزخانه|home|kitchen/.test(text)) return "home";
  if (/زیبایی|سلامت|آرایشی|health|beauty/.test(text)) return "health";
  if (/ورزش|سفر|sport|travel/.test(text)) return "sport";
  if (/اسباب|کودک|toy|baby/.test(text)) return "toy";
  if (/صنعتی|اداری|industrial|office/.test(text)) return "industrial";
  if (/دیجیتال|digital|ssd|ram|cpu|gpu|monitor/.test(text)) return "laptop";
  return "generic";
}

function ProductFallbackVisual({
  title,
  category,
  compact = false,
}: {
  title: string;
  category?: string;
  compact?: boolean;
}) {
  const kind = detectProductKind(title, category);
  const labelByKind: Record<ProductFallbackKind, string> = {
    laptop: "تصویر لپ‌تاپ",
    phone: "تصویر موبایل",
    car: "تصویر خودرو",
    book: "تصویر کتاب",
    clothes: "تصویر پوشاک",
    home: "تصویر کالای خانه",
    health: "تصویر سلامت",
    sport: "تصویر ورزشی",
    toy: "تصویر کودک",
    industrial: "تصویر صنعتی",
    generic: "تصویر کالا",
  };
  const emojiByKind: Record<ProductFallbackKind, string> = {
    laptop: "💻",
    phone: "📱",
    car: "🚗",
    book: "📚",
    clothes: "👕",
    home: "🏠",
    health: "💄",
    sport: "⚽",
    toy: "🧸",
    industrial: "🏭",
    generic: "🛍️",
  };

  if (kind === "laptop") {
    return (
      <div className="relative grid h-full w-full place-items-center overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50 to-blue-100">
        <div className="absolute right-3 top-3 rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold text-[#003b5c] shadow-sm">
          Laptop
        </div>
        <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-[#00a8e8]/15" />
        <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-[#0b9c56]/15" />
        <div className={`${compact ? "w-4/5" : "w-3/4 max-w-64"}`}>
          <div className="rounded-t-2xl border-[6px] border-slate-700 bg-slate-900 p-1 shadow-2xl">
            <div className="aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-sky-300 via-indigo-300 to-emerald-200">
              <div className="h-full w-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,.85),transparent_18%),linear-gradient(135deg,rgba(255,255,255,.35),transparent_45%)]" />
            </div>
          </div>
          <div className="mx-auto h-3 w-[92%] rounded-b-2xl bg-slate-300 shadow-lg" />
          <div className="mx-auto mt-1 h-2 w-[62%] rounded-b-full bg-slate-400/70" />
        </div>
        {!compact && (
          <div className="absolute bottom-3 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
            {labelByKind[kind]}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative grid h-full w-full place-items-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-200">
      <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-[#00a8e8]/10" />
      <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-[#0b9c56]/10" />
      <div className="text-center">
        <div className={compact ? "text-3xl" : "text-6xl"}>{emojiByKind[kind]}</div>
        {!compact && (
          <p className="mt-3 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-gray-600 shadow-sm">
            {labelByKind[kind]}
          </p>
        )}
      </div>
    </div>
  );
}

export function ProductHeroImage({
  images,
  title,
  category,
  className = "h-52 w-full",
}: {
  images?: ProductImageAttachment[];
  title: string;
  category?: string;
  className?: string;
}) {
  const firstImage = images?.[0];
  return (
    <div
      className={`overflow-hidden border border-gray-100 bg-gray-50 shadow-inner ${className}`}
    >
      {firstImage ? (
        <img
          src={productImageUrl(firstImage)}
          alt={`عکس محصول ${title}`}
          className="h-full w-full object-contain p-1 transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <ProductFallbackVisual title={title} category={category} />
      )}
    </div>
  );
}

export function ProductThumb({
  images,
  title,
  category,
  className = "h-20 w-20",
}: {
  images?: ProductImageAttachment[];
  title: string;
  category?: string;
  className?: string;
}) {
  const firstImage = images?.[0];
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 ${className}`}
    >
      {firstImage ? (
        <img
          src={productImageUrl(firstImage)}
          alt={`عکس محصول ${title}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <ProductFallbackVisual title={title} category={category} compact />
      )}
    </div>
  );
}

export function ProductImageStrip({
  images,
  title,
  label = "عکس‌های محصول",
  emptyText,
}: {
  images?: ProductImageAttachment[];
  title: string;
  label?: string;
  emptyText?: string;
}) {
  if (!images || images.length === 0) {
    return emptyText ? (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        {emptyText}
      </div>
    ) : null;
  }

  return (
    <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-bold text-gray-900">{label}</h3>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-500">
          {images.length.toLocaleString("fa-IR")} عکس
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((image) => (
          <a
            key={image.id || image.storedName}
            href={productImageUrl(image)}
            target="_blank"
            rel="noreferrer"
            className="group overflow-hidden rounded-2xl border border-white bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="aspect-square overflow-hidden bg-gray-100">
              <img
                src={productImageUrl(image)}
                alt={`${title} - ${image.originalName}`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <p className="truncate px-3 py-2 text-xs text-gray-500">
              {image.uploadedByRole === "seller"
                ? "فروشنده"
                : image.uploadedByRole === "buyer"
                  ? "خریدار"
                  : "محصول"}{" "}
              · {image.originalName}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}

export function InlineProductTitle({
  title,
  images,
  subtitle,
  titleClassName = "font-bold text-[#003b5c]",
}: {
  title: string;
  images?: ProductImageAttachment[];
  subtitle?: string;
  titleClassName?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <ProductThumb
        images={images}
        title={title}
        className="h-14 w-14 rounded-xl"
      />
      <div className="min-w-0">
        <p className={titleClassName}>{title}</p>
        {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}
