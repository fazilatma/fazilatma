import type { JsonStoreProduct } from "@/lib/json-store";
import { isStorefrontEligibleComputerPart } from "@/lib/store-computer-part-kind";
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

function storefrontTitleKey(product: JsonStoreProduct) {
  return product.title
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .toLowerCase()
    .replace(/[‌\s]+/g, " ")
    .replace(/[^a-z0-9آ-ی]+/g, " ")
    .trim();
}

export function dedupeStorefrontCatalogProducts(products: JsonStoreProduct[]) {
  const output: JsonStoreProduct[] = [];
  const indexByTitle = new Map<string, number>();
  for (const product of products) {
    const key = storefrontTitleKey(product);
    const existingIndex = indexByTitle.get(key);
    if (existingIndex === undefined) {
      indexByTitle.set(key, output.length);
      output.push(product);
      continue;
    }
    const existing = output[existingIndex];
    const cheaper = product.price > 0 && product.price < existing.price ? product : existing;
    const richer = Object.keys(product.specs || {}).length > Object.keys(existing.specs || {}).length
      ? product
      : existing;
    output[existingIndex] = {
      ...richer,
      price: cheaper.price,
      marketPrice: cheaper.marketPrice,
      priceMultiplier: cheaper.priceMultiplier,
      originalPrice: cheaper.originalPrice,
      priceUpdatedAt: cheaper.priceUpdatedAt,
      shippingNote: cheaper.shippingNote,
      externalSourceUrl: cheaper.externalSourceUrl || richer.externalSourceUrl,
      imageUrl: richer.imageUrl || cheaper.imageUrl,
      stock: Math.max(existing.stock || 0, product.stock || 0),
    };
  }
  return output;
}

export function filterProductsByCatalogSections(
  products: JsonStoreProduct[],
  settings: { laptopEnabled: boolean; computerPartsEnabled: boolean },
) {
  const visibleComputerPart = (product: JsonStoreProduct) =>
    isComputerPartsCatalogProduct(product) && isStorefrontEligibleComputerPart(product);
  let filtered: JsonStoreProduct[] = [];
  if (settings.laptopEnabled && settings.computerPartsEnabled) {
    filtered = products.filter((product) => isLaptopCatalogProduct(product) || visibleComputerPart(product));
  } else if (settings.laptopEnabled) {
    filtered = products.filter(isLaptopCatalogProduct);
  } else if (settings.computerPartsEnabled) {
    filtered = products.filter(visibleComputerPart);
  }
  return dedupeStorefrontCatalogProducts(filtered);
}
