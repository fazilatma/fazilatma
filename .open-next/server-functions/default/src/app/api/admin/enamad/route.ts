import { NextResponse } from "next/server";
import { getOptiBidData, writeOptiBidData } from "@/lib/json-store";
import { removeProductImageFile, saveProductImageFile } from "@/lib/product-image-storage";

export const dynamic = "force-dynamic";

const asFile = (value: FormDataEntryValue | null) =>
  value instanceof File && value.size > 0 ? value : null;

function safeHttpUrl(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export async function GET() {
  const data = await getOptiBidData();
  return NextResponse.json({
    success: true,
    settings: {
      enamadEnabled: data.settings.enamadEnabled,
      enamadTitle: data.settings.enamadTitle,
      enamadVerificationUrl: data.settings.enamadVerificationUrl,
      enamadLogoUrl: data.settings.enamadLogoUrl,
      enamadLogoImage: data.settings.enamadLogoImage,
    },
  });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const data = await getOptiBidData();
    const verificationInput = String(form.get("verificationUrl") || "").trim();
    const logoUrlInput = String(form.get("logoUrl") || "").trim();
    const verificationUrl = safeHttpUrl(verificationInput);
    const logoUrl = safeHttpUrl(logoUrlInput);
    if (verificationInput && !verificationUrl) {
      return NextResponse.json({ success: false, message: "لینک اعتبارسنجی اینماد معتبر نیست." }, { status: 400 });
    }
    if (logoUrlInput && !logoUrl) {
      return NextResponse.json({ success: false, message: "آدرس اینترنتی لوگوی اینماد معتبر نیست." }, { status: 400 });
    }

    const logoFile = asFile(form.get("logoFile"));
    if (logoFile) {
      const previous = data.settings.enamadLogoImage;
      data.settings.enamadLogoImage = await saveProductImageFile(logoFile, "seller");
      if (previous?.storedName) await removeProductImageFile(previous.storedName);
    }
    if (String(form.get("removeUploadedLogo") || "") === "true") {
      const previous = data.settings.enamadLogoImage;
      data.settings.enamadLogoImage = undefined;
      if (previous?.storedName) await removeProductImageFile(previous.storedName);
    }

    data.settings.enamadEnabled = String(form.get("enabled") || "") === "true";
    data.settings.enamadTitle = String(form.get("title") || "نماد اعتماد الکترونیکی").trim().slice(0, 100) || "نماد اعتماد الکترونیکی";
    data.settings.enamadVerificationUrl = verificationUrl;
    data.settings.enamadLogoUrl = logoUrl;
    await writeOptiBidData(data);

    return NextResponse.json({
      success: true,
      settings: data.settings,
      message: "تنظیمات لوگو و لینک اینماد ذخیره شد.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "ذخیره تنظیمات اینماد ناموفق بود.",
        detail: error instanceof Error ? error.message : "Unknown eNamad settings error",
      },
      { status: 500 },
    );
  }
}
