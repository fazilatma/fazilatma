"use client";

import { useEffect } from "react";
import { rememberBrowserStorePrice } from "@/lib/browser-store-prices";

export default function StoreVerifiedPriceSync({
  productId,
  price,
  verifiedAt,
}: {
  productId: string;
  price: number;
  verifiedAt: string;
}) {
  useEffect(() => {
    rememberBrowserStorePrice(productId, { price, updatedAt: verifiedAt });
  }, [price, productId, verifiedAt]);
  return null;
}
