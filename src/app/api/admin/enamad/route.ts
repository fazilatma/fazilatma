import { NextResponse } from "next/server";
import { getEnamadSettings, saveEnamadSettings } from "@/lib/enamad-settings";
import { removeProductImageFile, saveProductImageFile } from "@/lib/product-image-storage";
import { normalizeProductImageAttachments } from "@/lib/product-image-shared";

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
  return NextResponse.json({ success: true, settings: await getEnamadSettings() });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const current = await getEnamadSettings();
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

    let logoImage = current.logoImage;
    if (!logoImage) {
      try {
        const existing = JSON.parse(String(form.get("existingLogoImage") || "null"));
        logoImage = normalizeProductImageAttachments(existing ? [existing] : [])[0];
      } catch {
        logoImage = undefined;
      }
    }
    const logoFile = asFile(form.get("logoFile"));
    if (logoFile) {
      const previous = logoImage;
      logoImage = await saveProductImageFile(logoFile, "seller");
      if (previous?.storedName) await removeProductImageFile(previous.storedName);
    }
    if (String(form.get("removeUploadedLogo") || "") === "true") {
      const previous = logoImage;
      logoImage = undefined;
      if (previous?.storedName) await removeProductImageFile(previous.storedName);
    }

    const settings = await saveEnamadSettings({
      enabled: String(form.get("enabled") || "") === "true",
      title: String(form.get("title") || "نماد اعتماد الکترونیکی").trim().slice(0, 100) || "نماد اعتماد الکترونیکی",
      verificationUrl,
      logoUrl,
      ...(logoImage ? { logoImage } : {}),
    });

    return NextResponse.json({
      success: true,
      settings: {
        enamadEnabled: settings.enabled,
        enamadTitle: settings.title,
        enamadVerificationUrl: settings.verificationUrl,
        enamadLogoUrl: settings.logoUrl,
        enamadLogoImage: settings.logoImage,
      },
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
