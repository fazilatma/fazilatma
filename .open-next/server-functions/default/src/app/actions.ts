"use server";

import { revalidatePath } from "next/cache";
import { createJsonPurchaseRequest } from "@/lib/json-store";

export async function submitRequestToDB(data: {
  title: string;
  category: string;
  description: string;
  budget: string;
  deadline: string;
  quantity: string;
}) {
  try {
    await createJsonPurchaseRequest(data);
    revalidatePath("/");
    revalidatePath("/requests");
    revalidatePath("/buyer/dashboard");
    return { success: true };
  } catch (error) {
    console.error("JSON storage error:", error);
    return { success: false };
  }
}
