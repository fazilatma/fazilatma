import { NextResponse } from "next/server";
import { getOptiBidData, writeOptiBidData } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const data = await getOptiBidData();
    const removed = data.storeProducts.length;
    data.storeProducts = [];
    await writeOptiBidData(data);
    return NextResponse.json({
      success: true,
      removed,
      message: `${removed.toLocaleString("fa-IR")} محصول از فروشگاه پاک شد. اکنون می‌توانید محصولات جدید را از لینک فروشگاه وارد کنید.`,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown clear products error";
    return NextResponse.json(
      { success: false, message: "پاک‌سازی محصولات ناموفق بود.", detail },
      { status: 500 },
    );
  }
}
