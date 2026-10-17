import type { JsonStoreProduct } from "@/lib/json-store";
import { productImportCategoryKey } from "@/lib/store-product-import";

function productText(product: Pick<JsonStoreProduct, "title" | "brand" | "category" | "specs">) {
  return `${product.title} ${product.brand} ${product.category} ${Object.values(product.specs || {}).join(" ")}`.toLowerCase();
}

export function isLaptopCatalogProduct(
  product: Pick<JsonStoreProduct, "title" | "brand" | "category" | "specs">,
) {
  const text = productText(product);
  const key = productImportCategoryKey(product);
  return key === "laptop" || (key === "gaming" && /لپ|laptop|notebook|macbook|thinkpad|ideapad|victus|tuf|rog|legion/.test(text));
}

export function isComputerPartsCatalogProduct(
  product: Pick<JsonStoreProduct, "title" | "brand" | "category" | "specs">,
) {
  const text = productText(product);
  const key = productImportCategoryKey(product);
  const explicitComputerPart = /قطعات کامپیوتر|پردازنده|\bcpu\b|کارت گرافیک|\bgpu\b|مادربرد|\bram\b|حافظه رم|رم کامپیوتر|رم دسکتاپ|ماژول رم|\bssd\b|اس\s*اس\s*دی|\bnvme\b|هارد(?:دیسک)?\s*(?:اینترنال|اکسترنال)|پاور کامپیوتر|منبع تغذیه|کیس کامپیوتر|خنک.?کننده پردازنده|فن کیس|خمیر سیلیکون/.test(text);
  // وجود عباراتی مثل «مناسب لپ‌تاپ» در مشخصات RAM/SSD نباید قطعه را لپ‌تاپ حساب کند.
  if (explicitComputerPart) return true;
  if (isLaptopCatalogProduct(product)) return false;
  return key === "components" || key === "storage";
}

export function filterProductsByCatalogSections(
  products: JsonStoreProduct[],
  settings: { laptopEnabled: boolean; computerPartsEnabled: boolean },
) {
  if (settings.laptopEnabled && settings.computerPartsEnabled) {
    return products.filter((product) => isLaptopCatalogProduct(product) || isComputerPartsCatalogProduct(product));
  }
  if (settings.laptopEnabled) return products.filter(isLaptopCatalogProduct);
  if (settings.computerPartsEnabled) return products.filter(isComputerPartsCatalogProduct);
  return [];
}
