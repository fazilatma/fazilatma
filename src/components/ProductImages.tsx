import {
  productImageUrl,
  type ProductImageAttachment,
} from "@/lib/product-image-shared";

export function ProductThumb({
  images,
  title,
  className = "h-20 w-20",
}: {
  images?: ProductImageAttachment[];
  title: string;
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
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-gray-50 to-gray-200 text-2xl text-gray-400">
          📦
        </div>
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
