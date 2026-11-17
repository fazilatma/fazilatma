import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// نگاشت فارسی به انگلیسی برای تصویر بهتر
const faToEn = {
  "خودکار": "pen", "خودکار آبی": "blue pen", "خودکار مشکی": "black pen", "خودکار قرمز": "red pen",
  "مداد": "pencil", "دفتر": "notebook", "لیوان": "mug", "لیوان کاغذی": "paper cup",
  "سوزن خیاطی": "sewing needle", "سوزن": "needle", "خیاطی": "sewing",
  "اسکوتر برقی": "electric scooter", "اسکوتر": "scooter",
  "دمپایی": "slippers", "کفش": "shoes", "صندل": "sandal",
  "پیاز": "onion", "سیب زمینی": "potato", "گوجه": "tomato",
  "مبل": "sofa", "صندلی": "chair", "میز": "table", "کیف": "bag",
  "تلویزیون": "tv", "یخچال": "refrigerator", "جارو": "vacuum",
};

function getEnglishQuery(q) {
  const ql = q.toLowerCase();
  for (const [fa, en] of Object.entries(faToEn)) {
    if (ql.includes(fa)) return en;
  }
  return q.slice(0, 20);
}

export async function GET(request) {
  const localRedirect = (p) => {
    // سرو مستقیم فایل لوکال (نه ریدایرکت به 0.0.0.0 که تو مرورگر کاربر خراب میشه)
    try {
      const fp = path.join(process.cwd(), "public", p.replace(/^\//, ""));
      if (fs.existsSync(fp)) {
        return new NextResponse(fs.readFileSync(fp), { headers: { "Content-Type": p.endsWith(".png") ? "image/png" : "image/jpeg", "Cache-Control": "public, max-age=86400" } });
      }
    } catch {}
    return NextResponse.redirect(new URL(p, request.url), 302);
  };
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "product").trim();
  if (!q) return NextResponse.json({ error: "q required" }, { status: 400 });

  const hash = crypto.createHash("md5").update(q).digest("hex").slice(0, 12);
  const fileName = `auto-${hash}.jpg`;
  const dir = path.join(process.cwd(), "public", "images", "auto");
  const filePath = path.join(dir, fileName);
  const publicPath = `/images/auto/${fileName}`;

  // اگر تصویر خودکار قبلا تولید شده، همونو برگردون
  try {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      if (stat.size > 1000) {
        return localRedirect(publicPath);
      }
    }
  } catch {}

  // نگاشت لوکال سریع برای محصولات شناخته شده - بدون نیاز به تولید
  const ql = q.toLowerCase();
  if (ql.includes("خودکار آبی")) return localRedirect("/images/pen-blue.jpg");
  if (ql.includes("خودکار مشکی")) return localRedirect("/images/pen-black.jpg");
  if (ql.includes("خودکار قرمز")) return localRedirect("/images/pen-red.jpg");
  if (ql.includes("خودکار") || ql.includes("pen")) return localRedirect("/images/pen-blue.jpg");
  if (ql.includes("مداد")) return localRedirect("/images/pencil-hb.jpg");
  if (ql.includes("دفتر")) return localRedirect("/images/notebook-100.jpg");
  if (ql.includes("لیوان")) return localRedirect("/images/paper-cup.jpg");
  if (ql.includes("سوزن") || ql.includes("خیاطی")) return localRedirect("/images/sewing-needle.jpg");
  if (ql.includes("اسکوتر")) return localRedirect("/images/scooter-electric.jpg");
  if (ql.includes("دمپایی") || ql.includes("کفش") || ql.includes("slippers")) return localRedirect("/images/slippers.jpg");
  if (ql.includes("رم کامپیوتر") || ql.includes("رم دسکتاپ") || ql.includes("رم لپ") || ql.includes("ddr4") || ql.includes("ddr5")) return localRedirect("/images/ram-memory.jpg");
  if (ql.includes("پردازنده") || ql.includes("cpu") || ql.includes("سی پی یو") || ql.includes("ryzen") || ql.includes("رایزن")) return localRedirect("/images/cpu-processor.jpg");
  if (ql.includes("ماینینگ") || ql.includes("ماینر") || ql.includes("miner") || ql.includes("mining")) return localRedirect("/images/mining-asic.jpg");
  if (ql.includes("مینی کامپیوتر") || ql.includes("مینی پی سی") || ql.includes("mini pc") || ql.includes("mac mini") || ql.includes("مک مینی")) return localRedirect("/images/mini-pc.jpg");
  if (ql.includes("all in one") || ql.includes("آل این وان") || ql.includes("imac") || ql.includes("آی مک")) return localRedirect("/images/all-in-one.jpg");
  if (ql.includes("مانیتور")) return localRedirect("/images/monitor-27.jpg");
  if (ql.includes("اپیلاتور")) return localRedirect("/images/epilator.jpg");
  if (ql.includes("ماشین اصلاح") || ql.includes("ریش تراش")) return localRedirect("/images/shaver-trimmer.jpg");
  if (ql.includes("اتو مو") || ql.includes("فر کننده") || ql.includes("برس حرارتی")) return localRedirect("/images/hair-straightener.jpg");
  if (ql.includes("سشوار") || ql.includes("زیبایی") || ql.includes("آرایشی")) return localRedirect("/images/hair-dryer.jpg");
  if (ql.includes("کیسه زباله")) return localRedirect("/images/trash-bag.jpg");
  if (ql.includes("کیسه فریزر") || ql.includes("freezer") || ql.includes("زیپ کیپ") || ql.includes("سلفون") || ql.includes("فویل")) return localRedirect("/images/freezer-bag.jpg");
  if (ql.includes("پیاز سفید")) return localRedirect("/images/onion-white.jpg");
  if (ql.includes("پیاز قرمز")) return localRedirect("/images/onion-red.jpg");
  if (ql.includes("پیاز")) return localRedirect("/images/onion-white.jpg");
  if (ql.includes("سیب زمینی") || ql.includes("potato")) return localRedirect("/images/potato.jpg");

  // برای محصولات کاملا جدید - از placehold.co با متن محصول (100% مطمئن، فیلتر نیست)
  // این تصویر تقریبی خودکاره، نیاز به تولید دستی نیست
  const enQuery = getEnglishQuery(q);
  const placeholderUrl = `https://placehold.co/400x400/EFEFEF/333?text=${encodeURIComponent(enQuery.slice(0,20))}`;

  // سعی کن تصویر را دانلود و کش کن برای دفعه بعد
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    // برای سرعت، فعلا ریدایرکت به placehold، ولی در بک‌گراند میشه با AI جایگزین کرد
    return NextResponse.redirect(placeholderUrl, 302);
  } catch {
    return NextResponse.redirect(placeholderUrl, 302);
  }
}
