import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOptiBidData, writeOptiBidData } from "@/lib/json-store";
import { deriveProductUsage, ensureProductUsage } from "@/lib/store-product-usage";

export const dynamic = "force-dynamic";

/**
 * پرکردن یک‌بارهٔ «کاربری» همهٔ محصولات (اداری/دانشجویی/مهندسی/گیمینگ).
 * مقدارهایی که ادمین دستی گذاشته دست‌نخورده می‌مانند.
 */
export async function POST() {
  if ((await cookies()).get("optibid_admin")?.value !== "1") {
    return NextResponse.json({ success: false, message: "دسترسی مدیریت لازم است." }, { status: 403 });
  }
  const data = await getOptiBidData();
  let updated = 0;
  for (const product of data.storeProducts) {
    const before = String((product.specs || {})["کاربری"] || "");
    if (ensureProductUsage(product)) {
      updated += 1;
      continue;
    }
    // اگر کاربری خالی است ولی ensure چیزی ننوشت (مثلاً «عمومی»)، همچنان پر شود.
    if (!before.trim()) {
      product.specs = { ...(product.specs || {}), "کاربری": deriveProductUsage(product.title, product.specs) };
      updated += 1;
    }
  }
  if (updated) await writeOptiBidData(data);
  return NextResponse.json({ success: true, updated, total: data.storeProducts.length });
}
