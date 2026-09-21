import type { MetadataRoute } from "next";
import { getJsonStoreProducts } from "@/lib/json-store";
import { laptopCollectionItems, laptopGuideItems } from "@/lib/laptop-storefront";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const now = () => new Date();

function entry(
  path: string,
  options: { lastModified?: Date | string; changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"]; priority?: number } = {},
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(path),
    lastModified: options.lastModified || now(),
    changeFrequency: options.changeFrequency || "weekly",
    priority: options.priority || 0.7,
  };
}

const strategicShopUrls = [
  { path: "/shop?brand=Lenovo", priority: 0.78 },
  { path: "/shop?brand=HP", priority: 0.78 },
  { path: "/shop?brand=Dell", priority: 0.78 },
  { path: "/shop?brand=Asus", priority: 0.78 },
  { path: "/shop?brand=Apple", priority: 0.76 },
  { path: "/shop?condition=stock", priority: 0.8 },
  { path: "/shop?condition=used", priority: 0.74 },
  { path: "/shop?use=business", priority: 0.82 },
  { path: "/shop?use=student", priority: 0.82 },
  { path: "/shop?use=engineering", priority: 0.82 },
  { path: "/shop?use=gaming", priority: 0.82 },
  { path: "/shop?ram=16GB", priority: 0.72 },
  { path: "/shop?ssd=512GB", priority: 0.72 },
  { path: "/shop?cpu=i7", priority: 0.72 },
  { path: "/shop?gpuType=rtx", priority: 0.76 },
  { path: "/shop?maxPrice=45000000", priority: 0.74 },
  { path: "/shop?minPrice=60000000", priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getJsonStoreProducts();

  return [
    entry("/", { changeFrequency: "daily", priority: 1 }),
    entry("/shop", { changeFrequency: "daily", priority: 0.95 }),
    ...strategicShopUrls.map((item) =>
      entry(item.path, { changeFrequency: "weekly", priority: item.priority }),
    ),
    entry("/shop/collections", { changeFrequency: "weekly", priority: 0.78 }),
    ...laptopCollectionItems.map((collection) =>
      entry(collection.href, { changeFrequency: "daily", priority: 0.82 }),
    ),
    entry("/shop/guides", { changeFrequency: "monthly", priority: 0.78 }),
    ...laptopGuideItems.map((guide) =>
      entry(guide.href, { changeFrequency: "monthly", priority: 0.8 }),
    ),
    ...products
      .filter((product) => product.isActive !== false)
      .map((product) =>
        entry(`/shop/${product.slug}`, {
          lastModified: product.createdAt,
          changeFrequency: "weekly",
          priority: product.isFeatured ? 0.92 : 0.86,
        }),
      ),
    entry("/support", { changeFrequency: "monthly", priority: 0.65 }),
    entry("/contact", { changeFrequency: "monthly", priority: 0.55 }),
  ];
}
