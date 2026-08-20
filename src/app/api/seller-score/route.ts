import { NextResponse } from "next/server";
import { getOptiBidData } from "@/lib/json-store";
import { calculateSellerScore, createDefaultSellerMetrics } from "@/lib/seller-rating";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sellerId = Number(searchParams.get("sellerId"));

  if (!sellerId) {
    return NextResponse.json(
      { success: false, message: "sellerId معتبر ارسال نشده است." },
      { status: 400 }
    );
  }

  const data = await getOptiBidData();
  const seller = data.users.find((user) => user.id === sellerId && user.role === "seller");

  if (!seller) {
    return NextResponse.json(
      { success: false, message: "فروشنده یافت نشد." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    seller: {
      id: seller.id,
      fullName: seller.fullName,
      bio: seller.bio || "",
      categories: seller.categories || [],
    },
    score: calculateSellerScore(seller.sellerMetrics || createDefaultSellerMetrics()),
  });
}
