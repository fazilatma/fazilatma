import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createJsonPurchaseRequest } from "@/lib/json-store";
import {
  maxProductImagesPerItem,
  removeProductImageFile,
  saveProductImageFile,
} from "@/lib/product-image-storage";
import type { ProductImageAttachment } from "@/lib/product-image-shared";

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
  if (files.length > maxProductImagesPerItem) {
    throw new Error("Too many product images");
  }
  const saved: ProductImageAttachment[] = [];
  for (const file of files) {
    saved.push(await saveProductImageFile(file, "buyer"));
  }
  return saved;
}

export async function POST(request: Request) {
  const savedImages: ProductImageAttachment[] = [];
  try {
    const contentType = request.headers.get("content-type") || "";
    const data = contentType.includes("multipart/form-data")
      ? null
      : await request.json();
    const form = contentType.includes("multipart/form-data")
      ? await request.formData()
      : null;

    if (form) {
      const title = String(form.get("title") || "").trim();
      const category = String(form.get("category") || "").trim();
      const description = String(form.get("description") || "").trim();

      if (!title || !category || !description) {
        return NextResponse.json(
          {
            success: false,
            message: "عنوان، دسته‌بندی و توضیحات درخواست الزامی هستند.",
          },
          { status: 400 },
        );
      }

      const productImages = await saveIncomingProductImages(form);
      savedImages.push(...productImages);

      const savedRequest = await createJsonPurchaseRequest({
        title,
        description,
        category,
        budget: String(form.get("budget") || ""),
        quantity: String(form.get("quantity") || "1"),
        deadline: String(form.get("deadline") || "flexible"),
        imageNames: productImages.map((image) => image.originalName),
        productImages,
        buyerName: String(form.get("buyerName") || ""),
        buyerId: Number(form.get("buyerId")) || undefined,
        valuationFactors: parseJsonObject(form.get("valuationFactors")),
      });

      revalidatePath("/");
      revalidatePath("/requests");
      revalidatePath("/buyer/dashboard");

      return NextResponse.json({
        success: true,
        request: savedRequest,
        message: "درخواست با موفقیت ذخیره شد.",
      });
    }

    if (!data.title || !data.category || !data.description) {
      return NextResponse.json(
        {
          success: false,
          message: "عنوان، دسته‌بندی و توضیحات درخواست الزامی هستند.",
        },
        { status: 400 },
      );
    }

    const savedRequest = await createJsonPurchaseRequest({
      title: data.title,
      description: data.description,
      category: data.category,
      budget: data.budget,
      quantity: data.quantity,
      deadline: data.deadline,
      imageNames: Array.isArray(data.imageNames) ? data.imageNames : [],
      productImages: Array.isArray(data.productImages)
        ? data.productImages
        : [],
      buyerName: data.buyerName,
      buyerId: Number(data.buyerId) || undefined,
      valuationFactors:
        data.valuationFactors && typeof data.valuationFactors === "object"
          ? data.valuationFactors
          : undefined,
    });

    revalidatePath("/");
    revalidatePath("/requests");
    revalidatePath("/buyer/dashboard");

    return NextResponse.json({
      success: true,
      request: savedRequest,
      message: "درخواست با موفقیت در فایل JSON ذخیره شد.",
    });
  } catch (error) {
    await Promise.all(
      savedImages.map((image) => removeProductImageFile(image.storedName)),
    );
    const detail =
      error instanceof Error ? error.message : "Unknown JSON storage error";
    console.error("JSON submit-request error:", error);

    const imageError =
      detail.includes("Product image") ||
      detail.includes("Only JPG") ||
      detail.includes("Too many product images");

    return NextResponse.json(
      {
        success: false,
        message: imageError
          ? "عکس محصول باید JPG، PNG یا WEBP، حداکثر ۵ مگابایت و حداکثر ۸ عکس باشد."
          : "خطا در ذخیره‌سازی درخواست. لطفاً دوباره تلاش کنید.",
        detail,
      },
      { status: imageError ? 400 : 500 },
    );
  }
}
