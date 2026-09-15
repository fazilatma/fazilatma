import { NextResponse } from "next/server";
import {
  getOptiBidData,
  writeOptiBidData,
  type HomepageImageSliderSlide,
} from "@/lib/json-store";
import { saveProductImageFile } from "@/lib/product-image-storage";
import { normalizeProductImageAttachments } from "@/lib/product-image-shared";

export const dynamic = "force-dynamic";

const asFile = (value: FormDataEntryValue | null) =>
  value instanceof File && value.size > 0 ? value : null;

function text(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

function normalizeSlides(value: unknown): HomepageImageSliderSlide[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 5).map((item, index) => {
    const source = item && typeof item === "object" ? (item as any) : {};
    const image = normalizeProductImageAttachments(
      source.image ? [source.image] : [],
    )[0];
    return {
      id: String(source.id || `slide-${index + 1}`).trim() || `slide-${index + 1}`,
      title: String(source.title || `اسلاید ${index + 1}`).trim().slice(0, 120),
      subtitle: String(source.subtitle || "").trim().slice(0, 260),
      cta: String(source.cta || "مشاهده").trim().slice(0, 60),
      href: String(source.href || "/requests").trim().slice(0, 180),
      isActive: source.isActive !== false,
      ...(image ? { image } : {}),
    };
  });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const data = await getOptiBidData();
    let slides: HomepageImageSliderSlide[] = [];

    try {
      slides = normalizeSlides(JSON.parse(text(form, "slides") || "[]"));
    } catch {
      slides = [];
    }

    if (slides.length === 0) {
      slides = data.settings.homepageImageSliderSlides || [];
    }

    for (let index = 0; index < Math.min(5, slides.length); index += 1) {
      const file = asFile(form.get(`slideImage-${index}`));
      if (file) {
        slides[index].image = await saveProductImageFile(file, "seller");
      }
    }

    data.settings.homepageImageSliderEnabled =
      text(form, "enabled") !== "false";
    data.settings.homepageImageSliderTitle =
      text(form, "title") || "اسلایدر ویژه درخواست‌های خرید";
    data.settings.homepageImageSliderSubtitle =
      text(form, "subtitle") ||
      "برای درآمدزایی از جایگاه تبلیغاتی، نردبان درخواست، آگهی ویژه و کمپین‌های مرتبط با لپ‌تاپ دست‌دوم";
    data.settings.homepageImageSliderDurationSeconds = Math.max(
      3,
      Math.min(30, Number(text(form, "durationSeconds")) || 5),
    );
    data.settings.homepageImageSliderSlides = slides.slice(0, 5);

    await writeOptiBidData(data);
    return NextResponse.json({
      success: true,
      settings: data.settings,
      message: "اسلایدر تصویری صفحه اصلی ذخیره شد.",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown slider error";
    return NextResponse.json(
      { success: false, message: "ذخیره اسلایدر تصویری ناموفق بود.", detail },
      { status: 500 },
    );
  }
}
