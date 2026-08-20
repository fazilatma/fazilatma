import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createJsonPurchaseRequest } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.title || !data.category || !data.description) {
      return NextResponse.json(
        {
          success: false,
          message: "عنوان، دسته‌بندی و توضیحات درخواست الزامی هستند.",
        },
        { status: 400 }
      );
    }

    const savedRequest = await createJsonPurchaseRequest({
      title: data.title,
      description: data.description,
      category: data.category,
      budget: data.budget,
      quantity: data.quantity,
      deadline: data.deadline,
      // نام فایل‌ها در JSON ذخیره می‌شوند؛ نگهداری واقعی فایل نیازمند فضای ذخیره‌سازی مستقل است.
      imageNames: Array.isArray(data.imageNames) ? data.imageNames : [],
      buyerName: data.buyerName,
      buyerId: Number(data.buyerId) || undefined,
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
    const detail = error instanceof Error ? error.message : "Unknown JSON storage error";
    console.error("JSON submit-request error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "خطا در ذخیره‌سازی فایل JSON. مجوز نوشتن پوشه /tmp یا OPTIBID_DATA_FILE را بررسی کنید.",
        detail,
      },
      { status: 500 }
    );
  }
}
