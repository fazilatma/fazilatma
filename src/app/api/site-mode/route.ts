import { NextResponse } from "next/server";
import { getOptiBidData } from "@/lib/json-store";

export const dynamic = "force-dynamic";

export async function GET() {
  // حالت و تنظیمات کاتالوگ از یک خواندن KV استخراج می‌شوند؛ دو بار parse کردن
  // دیتاست بزرگ برای هر Header می‌تواند محدودیت منابع Worker را فعال کند.
  const data = await getOptiBidData();
  const settings = data.settings;
  const siteMode = settings.siteMode;
  return NextResponse.json({
    success: true,
    siteMode,
    storeLaptopCatalogEnabled: settings.storeLaptopCatalogEnabled,
    storeComputerPartsCatalogEnabled: settings.storeComputerPartsCatalogEnabled,
    reverseAuction: {
      productCtaEnabled: settings.reverseAuctionProductCtaEnabled,
      quickRequestEnabled: settings.reverseAuctionQuickRequestEnabled,
      freeSellerOffersEnabled: settings.reverseAuctionFreeSellerOffersEnabled,
      manualDispatchEnabled: settings.reverseAuctionManualDispatchEnabled,
      minimumOffersEnabled: settings.reverseAuctionMinimumOffersEnabled,
      minimumOffersCount: settings.reverseAuctionMinimumOffersCount,
    },
    enamad: {
      enabled: settings.enamadEnabled,
      title: settings.enamadTitle,
      verificationUrl: settings.enamadVerificationUrl,
      logoUrl: settings.enamadLogoUrl,
      logoImage: settings.enamadLogoImage,
    },
    label:
      siteMode === "hybrid"
        ? "فروشگاه + درخواست رقابتی"
        : siteMode === "store"
          ? "فروشگاه اینترنتی"
          : "درخواست خرید",
  });
}
