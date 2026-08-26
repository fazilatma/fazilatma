import { NextResponse } from "next/server";
import {
  productImageContentType,
  readProductImageFile,
} from "@/lib/product-image-storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const storedName = url.searchParams.get("name") || "";
    if (!storedName) {
      return NextResponse.json(
        { success: false, message: "نام عکس محصول ارسال نشده است." },
        { status: 400 },
      );
    }

    const file = await readProductImageFile(storedName);
    return new Response(file, {
      headers: {
        "Content-Type": productImageContentType(storedName),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unknown product image error";
    return NextResponse.json(
      { success: false, message: "عکس محصول پیدا نشد.", detail },
      { status: 404 },
    );
  }
}
