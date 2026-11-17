import { NextResponse } from "next/server";
import { hunt } from "../../../lib/engine";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ error: "پارامتر q لازم است" }, { status: 400 });

  const tg = (searchParams.get("tg") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const feePct = searchParams.get("feePct");
  const shipCost = searchParams.get("shipCost");

  const result = await hunt(q, {
    tgChannels: tg,
    feePct: feePct ? Number(feePct) : undefined,
    shipCost: shipCost ? Number(shipCost) : undefined,
  });
  return NextResponse.json(result);
}
