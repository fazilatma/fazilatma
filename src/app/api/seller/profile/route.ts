import { NextResponse } from "next/server";
import { updateJsonSellerProfile } from "@/lib/json-store";
import { removeAvatarFile, saveAvatarFile } from "@/lib/avatar-storage";

export const dynamic = "force-dynamic";

const asFile = (value: FormDataEntryValue | null) =>
  value instanceof File && value.size > 0 ? value : null;

export async function PATCH(request: Request) {
  let savedAvatarName = "";
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const sellerId = Number(form.get("sellerId"));
      if (!sellerId) {
        return NextResponse.json({ success: false, message: "شناسه فروشنده معتبر نیست." }, { status: 400 });
      }

      const avatar = asFile(form.get("avatar"));
      if (avatar) savedAvatarName = await saveAvatarFile(avatar);

      let categories: string[] | undefined;
      try {
        const parsed = JSON.parse(String(form.get("categories") || "[]"));
        categories = Array.isArray(parsed) ? parsed.map(String) : undefined;
      } catch {
        categories = undefined;
      }

      const seller = await updateJsonSellerProfile(sellerId, {
        fullName: typeof form.get("fullName") === "string" ? String(form.get("fullName")) : undefined,
        bio: typeof form.get("bio") === "string" ? String(form.get("bio")) : undefined,
        categories,
        avatarName: savedAvatarName || undefined,
      });

      return NextResponse.json({ success: true, seller, message: "پروفایل فروشنده ذخیره شد." });
    }

    const body = await request.json();
    const sellerId = Number(body.sellerId);

    if (!sellerId) {
      return NextResponse.json({ success: false, message: "شناسه فروشنده معتبر نیست." }, { status: 400 });
    }

    const seller = await updateJsonSellerProfile(sellerId, {
      fullName: typeof body.fullName === "string" ? body.fullName : undefined,
      bio: typeof body.bio === "string" ? body.bio : undefined,
      categories: Array.isArray(body.categories) ? body.categories : undefined,
    });

    return NextResponse.json({ success: true, seller, message: "پروفایل فروشنده ذخیره شد." });
  } catch (error) {
    if (savedAvatarName) await removeAvatarFile(savedAvatarName);
    const detail = error instanceof Error ? error.message : "Unknown seller profile error";
    const message = detail.includes("Profile image") || detail.includes("Only JPG")
      ? "لوگوی فروشگاه باید JPG، PNG یا WEBP و حداکثر ۳ مگابایت باشد."
      : "ذخیره پروفایل فروشنده ناموفق بود.";
    return NextResponse.json({ success: false, message, detail }, { status: 500 });
  }
}
