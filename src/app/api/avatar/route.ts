import { NextResponse } from "next/server";
import { getOptiBidData } from "@/lib/json-store";
import { avatarContentType, readAvatarFile } from "@/lib/avatar-storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("userId"));
    if (!userId) {
      return NextResponse.json({ success: false, message: "شناسه کاربر لازم است." }, { status: 400 });
    }

    const data = await getOptiBidData();
    const user = data.users.find((item) => item.id === userId);
    if (!user?.avatarName) {
      return NextResponse.json({ success: false, message: "تصویر پروفایل ثبت نشده است." }, { status: 404 });
    }

    const file = await readAvatarFile(user.avatarName);
    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": avatarContentType(user.avatarName),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown avatar error";
    return NextResponse.json({ success: false, message: "نمایش تصویر پروفایل ناموفق بود.", detail }, { status: 404 });
  }
}
