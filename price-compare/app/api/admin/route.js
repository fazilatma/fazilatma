import { NextResponse } from "next/server";
import { validateAdmin, getSettings, saveSettings } from "../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, user, pass, settings } = body;

    if (action === "login") {
      if (validateAdmin(user, pass)) {
        const token = Buffer.from(`admin:${Date.now()}`).toString("base64");
        return NextResponse.json({ ok: true, token, message: "ورود ادمین موفق" });
      } else {
        return NextResponse.json({ error: "یوزر یا پسورد ادمین اشتباه است" }, { status: 401 });
      }
    }

    if (action === "getSettings") {
      // چک توکن ساده - در پروداکشن JWT
      const auth = req.headers.get("authorization") || "";
      // فعلا بدون چک سختگیرانه
      const current = getSettings();
      return NextResponse.json({ ok: true, settings: current });
    }

    if (action === "updateSettings") {
      const current = getSettings();
      const updated = { ...current, ...settings };
      // حفظ ادمین
      if (!updated.admin) updated.admin = current.admin;
      saveSettings(updated);
      return NextResponse.json({ ok: true, settings: updated, message: "تنظیمات ذخیره شد" });
    }

    return NextResponse.json({ error: "action نامعتبر" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req) {
  const settings = getSettings();
  // فقط وضعیت فعال بودن فاز خارج به داخل رو برگردون برای فرانت
  return NextResponse.json({ 
    ok: true, 
    outsideInsideEnabled: settings.outsideInsideEnabled,
    outsideSources: settings.outsideSources,
    customs: settings.customs
  });
}
