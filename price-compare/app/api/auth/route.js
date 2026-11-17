import { NextResponse } from "next/server";
import { createUser, validateUser, findUserByEmailOrMobile } from "../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, email, mobile, password, name } = body;

    if (action === "register") {
      if (!password || (!email && !mobile)) {
        return NextResponse.json({ error: "ایمیل یا موبایل و رمز عبور الزامی است" }, { status: 400 });
      }
      // اعتبارسنجی ساده
      if (email && !email.includes("@")) {
        return NextResponse.json({ error: "ایمیل نامعتبر" }, { status: 400 });
      }
      if (mobile && !/^09\d{9}$/.test(mobile) && !/^\+98\d+$/.test(mobile)) {
        // اجازه فرمت‌های مختلف
        if (mobile.length < 10) return NextResponse.json({ error: "موبایل نامعتبر - مثلا 09123456789" }, { status: 400 });
      }
      const user = createUser({ email, mobile, password, name });
      const token = Buffer.from(`${user.id}:${user.email || user.mobile}`).toString("base64");
      return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, mobile: user.mobile, name: user.name, plan: user.plan }, token });
    }

    if (action === "login") {
      const identifier = email || mobile;
      if (!identifier || !password) {
        return NextResponse.json({ error: "ایمیل/موبایل و رمز عبور الزامی است" }, { status: 400 });
      }
      const user = validateUser(identifier, password);
      if (!user) {
        return NextResponse.json({ error: "ایمیل/موبایل یا رمز عبور اشتباه است" }, { status: 400 });
      }
      const token = Buffer.from(`${user.id}:${user.email || user.mobile}`).toString("base64");
      return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, mobile: user.mobile, name: user.name, plan: user.plan }, token });
    }

    return NextResponse.json({ error: "action نامعتبر" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "POST with action register/login" });
}
