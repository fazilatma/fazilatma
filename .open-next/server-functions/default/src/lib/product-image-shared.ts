export type ProductImageAttachment = {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedByRole?: "buyer" | "seller";
};

export function normalizeProductImageAttachments(
  value: unknown,
): ProductImageAttachment[] {
  if (!Array.isArray(value)) return [];
  const result: ProductImageAttachment[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const source = item as Partial<ProductImageAttachment>;
    const storedName = String(source.storedName || "").trim();
    if (!storedName || !/^[a-zA-Z0-9._-]+$/.test(storedName)) continue;
    const mimeType = String(source.mimeType || "image/jpeg");
    if (!mimeType.startsWith("image/")) continue;
    const normalized: ProductImageAttachment = {
      id: String(source.id || storedName),
      originalName: String(source.originalName || "عکس محصول"),
      storedName,
      mimeType,
      size: Number(source.size || 0),
      uploadedAt: String(source.uploadedAt || new Date().toISOString()),
    };
    if (
      source.uploadedByRole === "seller" ||
      source.uploadedByRole === "buyer"
    ) {
      normalized.uploadedByRole = source.uploadedByRole;
    }
    result.push(normalized);
  }
  return result;
}

export function productImageUrl(
  image?: Pick<ProductImageAttachment, "storedName" | "id"> | null,
) {
  if (!image?.storedName) return "";
  const version = image.id || image.storedName;
  return `/api/product-image?name=${encodeURIComponent(image.storedName)}&v=${encodeURIComponent(version)}`;
}
