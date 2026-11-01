import { NextResponse } from "next/server";
import { getEnamadSettings, saveEnamadSettings } from "@/lib/enamad-settings";
import { removeProductImageFile, saveProductImageFile } from "@/lib/product-image-storage";
import { normalizeProductImageAttachments } from "@/lib/product-image-shared";

export const dynamic = "force-dynamic";

const asFile = (value: FormDataEntryValue | null) =>
  value instanceof File && value.size > 0 ? value : null;

function decodeEmbedHtml(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&amp;/gi, "&");
}

function safeHttpUrl(value: unknown) {
  const raw = decodeEmbedHtml(value)
    .replace(/^\[|\]$/g, "")
    .trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function urlFromAttribute(html: string, attribute: "href" | "src") {
  const match = html.match(new RegExp(`${attribute}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
  if (!match?.[2]) return "";
  const embeddedUrl = match[2].match(/https?:\/\/[^\s"'<>\])]+/i)?.[0] || match[2];
  return safeHttpUrl(embeddedUrl);
}

function urlsFromText(value: string) {
  return [...value.matchAll(/https?:\/\/[^\s"'<>\])]+/gi)]
    .map((match) => safeHttpUrl(match[0]))
    .filter(Boolean);
}

function parseEnamadInputs(verificationInput: string, logoInput: string) {
  const combined = decodeEmbedHtml(`${verificationInput}\n${logoInput}`);
  const urls = urlsFromText(combined);
  const verificationUrl =
    safeHttpUrl(verificationInput) ||
    urlFromAttribute(decodeEmbedHtml(verificationInput), "href") ||
    urlFromAttribute(combined, "href") ||
    urls.find((url) => !/logo\.aspx/i.test(url)) ||
    "";
  const logoUrl =
    safeHttpUrl(logoInput) ||
    urlFromAttribute(decodeEmbedHtml(logoInput), "src") ||
    urlFromAttribute(combined, "src") ||
    urls.find((url) => /logo\.aspx/i.test(url)) ||
    "";
  return { verificationUrl, logoUrl };
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
    const { verificationUrl, logoUrl } = parseEnamadInputs(
      verificationInput,
      logoUrlInput,
    );
    if ((verificationInput || logoUrlInput) && !verificationUrl && !logoUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "کد اینماد قابل تشخیص نیست. کد کامل <a><img></a> یا لینک‌های رسمی را وارد کنید.",
        },
        { status: 400 },
      );
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
