import type { Metadata } from "next";
import type { JsonStoreProduct } from "@/lib/json-store";

export const siteUrl = (process.env.NEXT_PUBLIC_CANONICAL_URL || "https://optibid.ir").replace(/\/$/, "");
export const siteName = "OptiBid";
export const defaultSeoTitle = "OptiBid | خرید لپ‌تاپ نو، استوک و گیمینگ";
export const defaultSeoDescription =
  "فروشگاه تخصصی لپ‌تاپ OptiBid برای خرید آنلاین لپ‌تاپ نو، استوک، اداری، دانشجویی، مهندسی و گیمینگ با مقایسه مشخصات، قیمت و پشتیبانی خرید.";
export const defaultOgImagePath = "/og-image.png";

export const storeSeoKeywords = [
  "خرید لپ تاپ",
  "خرید لپ‌تاپ",
  "فروشگاه لپ تاپ",
  "لپ تاپ استوک",
  "لپ‌تاپ اداری",
  "لپ‌تاپ دانشجویی",
  "لپ‌تاپ گیمینگ",
  "لپ‌تاپ مهندسی",
  "لپ‌تاپ لنوو",
  "لپ‌تاپ اچ پی",
  "لپ‌تاپ دل",
  "لپ‌تاپ ایسوس",
  "مک بوک",
  "OptiBid",
];

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalized}`;
}

export function cleanText(value: string, maxLength = 160) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

export function buildSeoMetadata({
  title,
  description,
  path = "/",
  type = "website",
  keywords = storeSeoKeywords,
  imagePath = defaultOgImagePath,
  robots,
}: {
  title: string;
  description: string;
  path?: string;
  type?: "website" | "article";
  keywords?: string[];
  imagePath?: string;
  robots?: Metadata["robots"];
}): Metadata {
  const canonicalUrl = absoluteUrl(path);
  const imageUrl = absoluteUrl(imagePath);
  const cleanDescription = cleanText(description);

  return {
    title,
    description: cleanDescription,
    keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "fa-IR": canonicalUrl,
      },
    },
    openGraph: {
      title,
      description: cleanDescription,
      url: canonicalUrl,
      siteName,
      locale: "fa_IR",
      type,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${siteName} - فروشگاه تخصصی لپ‌تاپ`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: cleanDescription,
      images: [imageUrl],
    },
    robots,
  };
}

export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: absoluteUrl("/icon.svg"),
    description: defaultSeoDescription,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        areaServed: "IR",
        availableLanguage: ["fa-IR"],
      },
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    alternateName: "اپتی‌بید",
    url: siteUrl,
    inLanguage: "fa-IR",
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function productJsonLd(product: JsonStoreProduct) {
  const text = `${product.title} ${product.category} ${product.summary} ${product.description} ${product.badges.join(" ")}`;
  const isUsed = /استوک|کارکرده|دست.?دوم/i.test(text);
  const productUrl = absoluteUrl(`/shop/${product.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: cleanText(product.description || product.summary, 500),
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    category: product.category,
    image: [absoluteUrl(defaultOgImagePath)],
    url: productUrl,
    itemCondition: isUsed
      ? "https://schema.org/UsedCondition"
      : "https://schema.org/NewCondition",
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "IRR",
      price: String(product.price * 10),
      availability:
        product.isActive !== false && product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: siteName,
      },
    },
    ...(product.reviewsCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewsCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    additionalProperty: Object.entries(product.specs || {}).map(([name, value]) => ({
      "@type": "PropertyValue",
      name,
      value,
    })),
  };
}

export function itemListJsonLd({
  name,
  description,
  url,
  items,
}: {
  name: string;
  description: string;
  url: string;
  items: Array<{ name: string; url: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    description: cleanText(description, 300),
    url: absoluteUrl(url),
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.url),
    })),
  };
}

export function articleJsonLd({
  title,
  description,
  url,
}: {
  title: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: cleanText(description, 300),
    inLanguage: "fa-IR",
    url: absoluteUrl(url),
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon.svg"),
      },
    },
  };
}
