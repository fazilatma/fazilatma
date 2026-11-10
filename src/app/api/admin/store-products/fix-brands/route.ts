import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOptiBidData, writeOptiBidData } from "@/lib/json-store";
import { brandFromTitle } from "@/lib/store-product-import";

export const dynamic = "force-dynamic";

/** برند کالاها را از روی عنوان بازسازی می‌کند (اصلاح برندهای اشتباه مثل Apple برای Kingmax). */
export async function POST() {
  if ((await cookies()).get("optibid_admin")?.value !== "1") {
    return NextResponse.json({ success: false, message: "دسترسی مدیریت لازم است." }, { status: 403 });
  }
  const data = await getOptiBidData();
  const changes: Array<{ id: string; title: string; from: string; to: string }> = [];
  for (const product of data.storeProducts) {
    const detected = brandFromTitle(product.title, product.brand || "نامشخص");
    const titleHasStored = product.brand
      ? new RegExp(product.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(product.title)
      : false;
    if (detected && detected !== product.brand && !titleHasStored) {
      changes.push({ id: product.id, title: product.title, from: product.brand, to: detected });
      product.brand = detected;
    }
  }
  if (changes.length) await writeOptiBidData(data);
  return NextResponse.json({
    success: true,
    fixed: changes.length,
    details: changes.slice(0, 30),
    message: changes.length
      ? `برند ${changes.length.toLocaleString("fa-IR")} کالا از روی عنوان اصلاح شد.`
      : "برند همهٔ کالاها با عنوانشان هم‌خوان است.",
  });
}
