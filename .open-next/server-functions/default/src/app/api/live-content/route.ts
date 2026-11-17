import { NextResponse } from "next/server";
import { getLiveContent } from "@/lib/live-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const content = await getLiveContent();

  return NextResponse.json(content, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
