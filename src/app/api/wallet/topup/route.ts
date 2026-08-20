import { NextResponse } from "next/server";
import { topUpJsonWallet } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await topUpJsonWallet(Number(body.userId), Number(String(body.amount || "").replace(/\D/g, "")));
    return NextResponse.json({ success: true, walletBalance: user.walletBalance, message: "کیف پول با موفقیت شارژ شد." });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown topup error";
    return NextResponse.json({ success: false, message: "شارژ کیف پول ناموفق بود.", detail }, { status: 400 });
  }
}
