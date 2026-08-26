import RequestsListClient from "./RequestsListClient";
import { getJsonRequests, getOptiBidData } from "@/lib/json-store";
import type { ProductImageAttachment } from "@/lib/product-image-shared";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  let allRequests: Array<{
    id: number;
    title: string;
    description: string;
    budget: string;
    category: string;
    timeAgo: string;
    offers: number;
    buyer: string;
    buyerRating: number;
    quantity: number;
    deadline: string;
    sellerOffers: any[];
    productImages?: ProductImageAttachment[];
  }> = [];

  try {
    const [requests, data] = await Promise.all([
      getJsonRequests(),
      getOptiBidData(),
    ]);
    const offersByRequest = new Map<number, any[]>();
    for (const offer of data.offers) {
      const list = offersByRequest.get(offer.requestId) || [];
      list.push({
        id: offer.id,
        sellerId: offer.sellerId,
        sellerName: offer.sellerName,
        amount: offer.amount,
        deliveryDays: offer.deliveryDays,
        status: offer.status,
        message: offer.message,
        productSpecs: offer.productSpecs,
        productImages: offer.productImages || [],
      });
      offersByRequest.set(offer.requestId, list);
    }
    allRequests = requests.map((request) => ({
      id: request.id,
      title: request.title,
      description: request.description,
      budget: Number(request.budget || 0).toLocaleString("fa-IR") + " تومان",
      category: request.category || "سایر",
      timeAgo: "جدید (ثبت‌شده)",
      offers: request.offersCount,
      buyer: request.buyerName || "خریدار",
      buyerRating: 0,
      quantity: request.quantity,
      deadline:
        request.deadline === "flexible" ? "انعطاف‌پذیر" : request.deadline,
      sellerOffers: offersByRequest.get(request.id) || [],
      productImages: request.productImages || [],
    }));
  } catch (error) {
    console.error("JSON request list error:", error);
  }

  const allCategories = [
    "همه دسته‌بندی‌ها",
    "کالای دیجیتال",
    "مد و پوشاک",
    "خانه و آشپزخانه",
    "زیبایی و سلامت",
    "کتاب و لوازم تحریر",
    "ورزش و سفر",
    "اسباب‌بازی و کودک",
    "خودرو و موتور",
    "صنعتی و اداری",
    "سایر",
  ];

  return (
    <RequestsListClient
      initialRequests={allRequests}
      allCategories={allCategories}
    />
  );
}
