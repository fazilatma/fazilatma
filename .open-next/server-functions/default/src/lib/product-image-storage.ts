import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import {
  getKvNamespace,
  kvDelete,
  kvGetBuffer,
  kvPutBuffer,
} from "@/lib/kv-storage";
import type { ProductImageAttachment } from "@/lib/product-image-shared";

const KV_PRODUCT_IMAGE_PREFIX = "optibid:product-image:";
const productImageRoot =
  process.env.OPTIBID_PRODUCT_IMAGE_DIR ||
  path.join(process.env.TMPDIR || "/tmp", "optibid-product-images");

const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

const contentTypeByExtension = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);

export const maxProductImageSize = 5 * 1024 * 1024;
export const maxProductImagesPerItem = 8;

export function validateProductImageFile(file: File) {
  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("Only JPG, PNG and WEBP product images are allowed");
  }
  if (file.size <= 0 || file.size > maxProductImageSize) {
    throw new Error("Product image must be between 1 byte and 5 MB");
  }
}

export async function saveProductImageFile(
  file: File,
  uploadedByRole: "buyer" | "seller",
): Promise<ProductImageAttachment> {
  validateProductImageFile(file);
  const extension = allowedMimeTypes.get(file.type)!;
  const id = `${Date.now().toString(36)}-${randomBytes(10).toString("hex")}`;
  const storedName = `${id}${extension}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  if (await getKvNamespace()) {
    await kvPutBuffer(`${KV_PRODUCT_IMAGE_PREFIX}${storedName}`, buffer);
  } else {
    await fs.mkdir(productImageRoot, { recursive: true });
    await fs.writeFile(path.join(productImageRoot, storedName), buffer, {
      mode: 0o644,
    });
  }

  return {
    id,
    originalName: file.name || "product-image",
    storedName,
    mimeType: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    uploadedByRole,
  };
}

export async function readProductImageFile(storedName: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(storedName)) {
    throw new Error("Invalid product image file name");
  }

  if (await getKvNamespace()) {
    const stored = await kvGetBuffer(`${KV_PRODUCT_IMAGE_PREFIX}${storedName}`);
    if (!stored) throw new Error("Product image file not found in KV");
    return Buffer.from(stored);
  }

  return fs.readFile(path.join(productImageRoot, storedName));
}

export async function removeProductImageFile(storedName?: string) {
  if (!storedName || !/^[a-zA-Z0-9._-]+$/.test(storedName)) return;
  if (await getKvNamespace()) {
    await kvDelete(`${KV_PRODUCT_IMAGE_PREFIX}${storedName}`);
    return;
  }
  await fs
    .unlink(path.join(productImageRoot, storedName))
    .catch(() => undefined);
}

export function productImageContentType(storedName: string) {
  const extension = path.extname(storedName).toLowerCase();
  return contentTypeByExtension.get(extension) || "application/octet-stream";
}

export function getProductImageUploadInfo() {
  return { productImageRoot, maxProductImageSize, maxProductImagesPerItem };
}
