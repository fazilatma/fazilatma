import { NextResponse } from "next/server";
import {
  repairStoreProductCsvBytes,
  repairedCsvFileName,
} from "@/lib/store-product-csv-repair";

export const dynamic = "force-dynamic";

function stripTextBom(value: string) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const csvTextValue = formData.get("csvText");
    const sourceLabel = String(formData.get("sourceLabel") || (file instanceof File ? file.name : "easy-scraper"));
    const bytes = file instanceof File
      ? new Uint8Array(await file.arrayBuffer())
      : new TextEncoder().encode(stripTextBom(String(csvTextValue || "")));

    if (bytes.length === 0) {
      return NextResponse.json({ success: false, message: "فایل CSV یا متن CSV را ارسال کنید." }, { status: 400 });
    }

    const repaired = repairStoreProductCsvBytes(bytes, sourceLabel);
    if (!repaired.productCount) {
      return NextResponse.json(
        {
          success: false,
          message: "محصول معتبری برای ساخت CSV اصلاح‌شده پیدا نشد.",
          warnings: repaired.warnings,
          csvEncoding: repaired.encoding,
        },
        { status: 400 },
      );
    }

    const fileName = repairedCsvFileName(file instanceof File ? file.name : "digikala.csv");
    return new Response(repaired.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
        "X-Optibid-CSV-Encoding": repaired.encoding,
        "X-Optibid-Product-Count": String(repaired.productCount),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "ساخت فایل CSV اصلاح‌شده ناموفق بود.",
        detail: error instanceof Error ? error.message : "Unknown CSV repair error",
      },
      { status: 500 },
    );
  }
}
