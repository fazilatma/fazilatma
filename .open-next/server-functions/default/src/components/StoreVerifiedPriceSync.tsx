"use client";

import { useEffect } from "react";
import { rememberBrowserStorePrice } from "@/lib/browser-store-prices";

export default function StoreVerifiedPriceSync({
  productId,
  price,
  verifiedAt,
  available,
}: {
  productId: string;
  price: number;
  verifiedAt: string;
  available: boolean;
}) {
  useEffect(() => {
    rememberBrowserStorePrice(productId, { price, updatedAt: verifiedAt, available });
  }, [available, price, productId, verifiedAt]);
  return null;
}
