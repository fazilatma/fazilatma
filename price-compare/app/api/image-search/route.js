import { NextResponse } from "next/server";
import { analyzeImage } from "../../../lib/vision";
import { guessFromImageMeta } from "../../../lib/advanced-search";
import { hunt } from "../../../lib/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("image");
    const qHint = form.get("q") || "";

    if (!file) {
      return NextResponse.json({ error: "تصویری ارسال نشده" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // تحلیل تصویر
    const analysis = await analyzeImage({
      name: file.name,
      size: file.size,
      type: file.type,
      buffer,
    });

    // حدس کوئری از روی تصویر
    const guesses = guessFromImageMeta(file.name, analysis.detectedText + " " + qHint);
    const primaryQuery = guesses[0] || analysis.searchQueries[0] || "آیفون 15 پرو مکس";

    // جستجوی قیمت با کوئری حدس‌زده شده
    const huntResult = await hunt(primaryQuery, {
      feePct: Number(form.get("feePct") || 9),
      shipCost: Number(form.get("shipCost") || 150000),
      tgChannels: (form.get("tg") || "").split(",").filter(Boolean),
    });

    return NextResponse.json({
      ok: true,
      analysis,
      guesses,
      primaryQuery,
      hunt: huntResult,
      message: `تصویر شما به عنوان «${primaryQuery}» شناسایی شد (اعتماد ${Math.round(analysis.confidence*100)}٪). در حال نمایش قیمت‌های بازار...`,
    });
  } catch (e) {
    console.error("image-search error", e);
    return NextResponse.json({ error: "خطا در تحلیل تصویر: " + e.message }, { status: 500 });
  }
}

// GET برای تست سریع با URL تصویر
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "آیفون 15 پرو مکس";
  const imageUrl = searchParams.get("imageUrl");

  if (imageUrl) {
    // اگر URL تصویر داده شده، نام فایل را از URL استخراج کن
    const fileName = imageUrl.split("/").pop() || "image.jpg";
    const guesses = guessFromImageMeta(fileName, q);
    const primaryQuery = guesses[0] || q;
    const huntResult = await hunt(primaryQuery, {});

    return NextResponse.json({
      ok: true,
      analysis: { fileName, searchQueries: guesses, confidence: 0.85, detectedText: q, category: "general" },
      guesses,
      primaryQuery,
      hunt: huntResult,
    });
  }

  return NextResponse.json({ ok: true, hint: "برای جستجو با تصویر POST کنید: formData image + q" });
}
