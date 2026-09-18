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
  return value.slice(0, 4).map((item, index) => {
    const source = item && typeof item === "object" ? (item as any) : {};
    const image = normalizeProductImageAttachments(
      source.image ? [source.image] : [],
    )[0];
    return {
      id:
        String(source.id || `store-slide-${index + 1}`).trim() ||
        `store-slide-${index + 1}`,
      title: String(source.title || `اسلاید فروشگاهی ${index + 1}`)
        .trim()
        .slice(0, 140),
      subtitle: String(source.subtitle || "").trim().slice(0, 320),
      cta: String(source.cta || "مشاهده").trim().slice(0, 70),
      href: String(source.href || "/shop").trim().slice(0, 180),
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
      slides = data.settings.storeHeroSliderSlides || [];
    }

    for (let index = 0; index < Math.min(4, slides.length); index += 1) {
      const file = asFile(form.get(`slideImage-${index}`));
      if (file) slides[index].image = await saveProductImageFile(file, "seller");
    }

    data.settings.storeHeroSliderEnabled = text(form, "enabled") !== "false";
    data.settings.storeHeroSliderDurationSeconds = Math.max(
      3,
      Math.min(30, Number(text(form, "durationSeconds")) || 5),
    );
    data.settings.storeHeroSliderSlides = slides.slice(0, 4);

    await writeOptiBidData(data);
    return NextResponse.json({
      success: true,
      settings: data.settings,
      message: "اسلایدر فروشگاه لپ‌تاپ ذخیره شد.",
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unknown storefront slider error";
    return NextResponse.json(
      {
        success: false,
        message: "ذخیره اسلایدر فروشگاه لپ‌تاپ ناموفق بود.",
        detail,
      },
      { status: 500 },
    );
  }
}
