import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createJsonSellerOffer } from "@/lib/json-store";
import {
  maxProductImagesPerItem,
  removeProductImageFile,
  saveProductImageFile,
} from "@/lib/product-image-storage";
import {
  normalizeProductImageAttachments,
  type ProductImageAttachment,
} from "@/lib/product-image-shared";

export const dynamic = "force-dynamic";

const asFile = (value: FormDataEntryValue | null) =>
  value instanceof File && value.size > 0 ? value : null;

function parseJsonObject(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : undefined;
  } catch {
    return undefined;
  }
}

async function saveIncomingProductImages(form: FormData) {
  const files = form
    .getAll("productImages")
    .map(asFile)
    .filter((file): file is File => Boolean(file));
  const existing = normalizeProductImageAttachments(
    parseJsonObject(form.get("existingProductImages")),
  );
  if (existing.length + files.length > maxProductImagesPerItem) {
    throw new Error("Too many product images");
  }
  const saved: ProductImageAttachment[] = [];
  for (const file of files) {
    saved.push(await saveProductImageFile(file, "seller"));
  }
  return { allImages: [...existing, ...saved], newlySaved: saved };
}

export async function POST(request: Request) {
  const newlySavedImages: ProductImageAttachment[] = [];
  try {
    const contentType = request.headers.get("content-type") || "";
    const form = contentType.includes("multipart/form-data")
      ? await request.formData()
      : null;
    const body = form ? null : await request.json();

    if (form) {
      const sellerId = Number(form.get("sellerId"));
      const requestId = Number(form.get("requestId"));
      const deliveryDays = Number(form.get("deliveryDays"));
      const amount = String(form.get("amount") || "");

      if (!sellerId || !requestId || !amount || !deliveryDays) {
        return NextResponse.json(
          {
            success: false,
            message: "قیمت پیشنهادی و زمان تحویل الزامی هستند.",
          },
          { status: 400 },
        );
      }

      const { allImages: productImages, newlySaved } =
        await saveIncomingProductImages(form);
      newlySavedImages.push(...newlySaved);

      const offer = await createJsonSellerOffer({
        sellerId,
        requestId,
        amount,
        deliveryDays,
        message: String(form.get("message") || ""),
        productSpecs: parseJsonObject(form.get("productSpecs")),
        productImages,
      });

      revalidatePath("/");
      revalidatePath("/requests");
      revalidatePath(`/requests/${requestId}`);
      revalidatePath("/buyer/dashboard");
      revalidatePath("/seller/dashboard");

      return NextResponse.json({
        success: true,
        offer,
        message: "پیشنهاد قیمت با موفقیت ثبت شد.",
      });
    }

    const sellerId = Number(body.sellerId);
    const requestId = Number(body.requestId);
    const deliveryDays = Number(body.deliveryDays);

    if (!sellerId || !requestId || !body.amount || !deliveryDays) {
      return NextResponse.json(
        { success: false, message: "قیمت پیشنهادی و زمان تحویل الزامی هستند." },
        { status: 400 },
      );
    }

    const offer = await createJsonSellerOffer({
      sellerId,
      requestId,
      amount: String(body.amount),
      deliveryDays,
      message: String(body.message || ""),
      productSpecs:
        body.productSpecs && typeof body.productSpecs === "object"
          ? body.productSpecs
          : undefined,
      productImages: Array.isArray(body.productImages)
        ? body.productImages
        : undefined,
    });

    revalidatePath("/");
    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/buyer/dashboard");
    revalidatePath("/seller/dashboard");

    return NextResponse.json({
      success: true,
      offer,
      message: "پیشنهاد قیمت با موفقیت ثبت شد.",
    });
  } catch (error) {
    await Promise.all(
      newlySavedImages.map((image) => removeProductImageFile(image.storedName)),
    );
    const detail =
      error instanceof Error ? error.message : "Unknown offer error";
    const alreadyOffered = detail.includes("Offer already exists");
    const incompleteSpecs = detail.includes("Product specs incomplete");
    const imageError =
      detail.includes("Product image") ||
      detail.includes("Only JPG") ||
      detail.includes("Too many product images");
    return NextResponse.json(
      {
        success: false,
        message: alreadyOffered
          ? "شما قبلاً برای این درخواست پیشنهاد ثبت کرده‌اید."
          : incompleteSpecs
            ? `مشخصات کالا کامل نیست. ${detail.replace("Product specs incomplete:", "موارد ناقص:")}`
            : imageError
              ? "عکس محصول پیشنهادی باید JPG، PNG یا WEBP، حداکثر ۵ مگابایت و حداکثر ۸ عکس باشد."
              : "ثبت پیشنهاد قیمت ناموفق بود.",
        detail,
      },
      {
        status: alreadyOffered
          ? 409
          : imageError || incompleteSpecs
            ? 400
            : 500,
      },
    );
  }
}
