import RequestsListClient from "./RequestsListClient";
import { getJsonRequests } from "@/lib/json-store";

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
  }> = [];

  try {
    const requests = await getJsonRequests();
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
      deadline: request.deadline === "flexible" ? "انعطاف‌پذیر" : request.deadline,
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

  return <RequestsListClient initialRequests={allRequests} allCategories={allCategories} />;
}
