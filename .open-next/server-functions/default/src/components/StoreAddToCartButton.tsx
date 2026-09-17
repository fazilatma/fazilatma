"use client";

import { useState } from "react";

export type StoreCartProduct = {
  id: string;
  title: string;
  slug: string;
  price: number;
  originalPrice?: number;
  brand: string;
  warranty: string;
};

const CART_KEY = "optibid_store_cart_v1";

function readCart(): Array<StoreCartProduct & { quantity: number }> {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(items: Array<StoreCartProduct & { quantity: number }>) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("optibid-store-cart-updated"));
}

export default function StoreAddToCartButton({
  product,
  className = "",
  label = "افزودن به سبد خرید",
}: {
  product: StoreCartProduct;
  className?: string;
  label?: string;
}) {
  const [added, setAdded] = useState(false);

  const addToCart = () => {
    const cart = readCart();
    const existing = cart.find((item) => item.id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, quantity: 1 });
    writeCart(cart);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={addToCart}
      className={
        className ||
        "w-full rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-rose-700"
      }
    >
      {added ? "✓ به سبد اضافه شد" : label}
    </button>
  );
}

export { CART_KEY };
