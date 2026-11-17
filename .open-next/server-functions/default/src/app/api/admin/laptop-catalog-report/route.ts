import { NextResponse } from "next/server";
import { getOptiBidData } from "@/lib/json-store";
import { productImportCategoryKey } from "@/lib/store-product-import";
import { isComputerPartsCatalogProduct, isLaptopCatalogProduct } from "@/lib/store-catalog-sections";
import { isSuspiciousStoreProductPrice } from "@/lib/store-pricing";
import { storeComputerPartKind } from "@/lib/store-computer-part-kind";

export const dynamic = "force-dynamic";

const laptopLook = /لپ ?تاپ|لپ‌تاپ|lپتاپ|laptop|notebook|ultrabook|macbook|مک ?بوک|thinkpad|thinkbook|ideapad|elitebook|probook|vivobook|zenbook|victus|legion|nitro|aspire|latitude|inspiron|pavilion|surface|galaxy ?book|lg ?gram|aorus|razer ?blade/i;

export async function GET() {
  const data = await getOptiBidData();
  const products = data.storeProducts;
  const items = products.map((product) => ({
    title: product.title,
    category: product.category,
    price: product.price,
    isActive: product.isActive,
    stock: product.stock,
    brand: product.brand,
    key: productImportCategoryKey(product),
    partKind: storeComputerPartKind(product),
    isLaptop: isLaptopCatalogProduct(product),
    isPart: isComputerPartsCatalogProduct(product),
    suspiciousPrice: isSuspiciousStoreProductPrice(product),
    laptopLook: laptopLook.test(`${product.title} ${product.category}`),
  }));
  const report = {
    generatedAt: new Date().toISOString(),
    settings: {
      siteMode: data.settings.siteMode,
      laptopCatalogEnabled: data.settings.storeLaptopCatalogEnabled,
      computerPartsCatalogEnabled: data.settings.storeComputerPartsCatalogEnabled,
    },
    byCategory: Object.fromEntries(
      Array.from(
        items.reduce((map, item) => {
          const key = item.category || "(بدون دسته)";
          map.set(key, (map.get(key) ?? 0) + 1);
          return map;
        }, new Map<string, number>()),
      ).sort((a, b) => b[1] - a[1]),
    ),
    byCategoryAndLaptop: Object.fromEntries(
      Array.from(
        items.reduce((map, item) => {
          const key = item.category || "(بدون دسته)";
          const bucket = map.get(key) ?? { total: 0, laptops: 0 };
          bucket.total += 1;
          if (item.isLaptop) bucket.laptops += 1;
          map.set(key, bucket);
          return map;
        }, new Map<string, { total: number; laptops: number }>()),
      ).sort((a, b) => b[1].total - a[1].total),
    ),
    summary: {
      total: products.length,
      active: items.filter((item) => item.isActive).length,
      inStock: items.filter((item) => item.stock > 0).length,
      laptops: items.filter((item) => item.isLaptop).length,
      parts: items.filter((item) => item.isPart).length,
      laptopLook: items.filter((item) => item.laptopLook).length,
      laptopLookMissed: items.filter((item) => item.laptopLook && !item.isLaptop).length,
      suspiciousPrice: items.filter((item) => item.suspiciousPrice).length,
    },
    items,
  };
  return new NextResponse(JSON.stringify(report, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": 'attachment; filename="laptop-catalog-report.json"',
    },
  });
}
