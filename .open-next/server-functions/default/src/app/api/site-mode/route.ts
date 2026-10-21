import { NextResponse } from "next/server";
import { getJsonSiteMode, getJsonStoreCatalogSettings } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const [siteMode, catalog] = await Promise.all([
    getJsonSiteMode(),
    getJsonStoreCatalogSettings(),
  ]);
  return NextResponse.json({
    success: true,
    siteMode,
    storeLaptopCatalogEnabled: catalog.laptopEnabled,
    storeComputerPartsCatalogEnabled: catalog.computerPartsEnabled,
    reverseAuction: catalog.reverseAuction,
    enamad: catalog.enamad,
    label: siteMode === "store" ? "فروشگاه اینترنتی" : "درخواست خرید",
  });
}
