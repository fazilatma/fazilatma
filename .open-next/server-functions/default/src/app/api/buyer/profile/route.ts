import { NextResponse } from "next/server";
import { updateJsonBuyerProfile } from "@/lib/json-store";
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
      const avatar = asFile(form.get("avatar"));
      if (avatar) savedAvatarName = await saveAvatarFile(avatar);

      const categoriesRaw = String(form.get("categories") || "[]");
      let categories: string[] | undefined;
      try {
        const parsed = JSON.parse(categoriesRaw);
        categories = Array.isArray(parsed) ? parsed.map(String) : undefined;
      } catch {
        categories = undefined;
      }

      const buyer = await updateJsonBuyerProfile(Number(form.get("buyerId")), {
        fullName: typeof form.get("fullName") === "string" ? String(form.get("fullName")) : undefined,
        bio: typeof form.get("bio") === "string" ? String(form.get("bio")) : undefined,
        defaultAddress: typeof form.get("defaultAddress") === "string" ? String(form.get("defaultAddress")) : undefined,
        categories,
        avatarName: savedAvatarName || undefined,
      });
      return NextResponse.json({ success: true, buyer, message: "پروفایل خریدار ذخیره شد." });
    }

    const body = await request.json();
    const buyer = await updateJsonBuyerProfile(Number(body.buyerId), {
      fullName: typeof body.fullName === "string" ? body.fullName : undefined,
      bio: typeof body.bio === "string" ? body.bio : undefined,
      defaultAddress: typeof body.defaultAddress === "string" ? body.defaultAddress : undefined,
      categories: Array.isArray(body.categories) ? body.categories : undefined,
    });
    return NextResponse.json({ success: true, buyer, message: "پروفایل خریدار ذخیره شد." });
  } catch (error) {
    if (savedAvatarName) await removeAvatarFile(savedAvatarName);
    const detail = error instanceof Error ? error.message : "Unknown buyer profile error";
    const message = detail.includes("Profile image") || detail.includes("Only JPG")
      ? "تصویر پروفایل باید JPG، PNG یا WEBP و حداکثر ۳ مگابایت باشد."
      : "ذخیره پروفایل خریدار ناموفق بود.";
    return NextResponse.json({ success: false, message, detail }, { status: 400 });
  }
}
