import { NextResponse } from "next/server";
import { getOptiBidData, type JsonStoreProduct } from "@/lib/json-store";
import { isStorefrontEligibleComputerPart } from "@/lib/store-computer-part-kind";
import {
  applyStorePriceOverrides,
  getStorePriceOverrides,
  getStorePriceOverridesByIds,
} from "@/lib/store-price-overrides";
import { isSuspiciousStoreProductPrice } from "@/lib/store-pricing";
import { publicStoreProductSpecs } from "@/lib/store-product-public";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;
const SITE_ORIGIN = "https://optibid.ir";

type TorobInput = {
  page?: string;
  page_unique?: string;
  page_url?: string;
};

function normalizedPath(value: string) {
  try {
    return new URL(value, SITE_ORIGIN).pathname.replace(/\/+$/, "") || "/";
  } catch {
    return String(value || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  }
}

function absoluteUrl(value: string | undefined, fallback: string) {
  try {
    const url = new URL(String(value || fallback), SITE_ORIGIN);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function uniqueProductsBySlug(products: JsonStoreProduct[]) {
  const seen = new Set<string>();
  return products.filter((product) => {
    const slug = String(product.slug || "").trim();
    if (!slug || seen.has(slug)) return false;
    seen.add(slug);
    return true;
  });
}

function isCleanFeedProduct(product: JsonStoreProduct) {
  const title = String(product.title || "").trim();
  const category = String(product.category || "").trim();
  return Boolean(
    title.length >= 5 &&
    !/^https?:\/\//i.test(title) &&
    !/(?:image|api)\.torob\.com/i.test(title) &&
    category &&
    category !== "نامشخص" &&
    product.slug &&
    Number(product.price || 0) >= 100_000,
  );
}

function isAvailableForFeed(product: JsonStoreProduct) {
  return (
    product.stock > 0 &&
    product.priceAvailable !== false &&
    !isSuspiciousStoreProductPrice(product)
  );
}

function torobProduct(product: JsonStoreProduct) {
  const pageUrl = `${SITE_ORIGIN}/shop/${encodeURIComponent(product.slug)}?utm_source=torob&utm_medium=cpc`;
  const imageLinks = [product.imageUrl, ...(product.imageUrls || [])]
    .filter((url): url is string => Boolean(url))
    .map((url) => absoluteUrl(url, ""))
    .filter(Boolean)
    .filter((url, index, urls) => urls.indexOf(url) === index)
    .slice(0, 8);
  const imageLink = imageLinks[0] || `${SITE_ORIGIN}/og-image.png`;
  const available = product.isActive && isAvailableForFeed(product);
  const oldPrice = available && Number(product.originalPrice || 0) > Number(product.price || 0)
    ? Math.round(Number(product.originalPrice))
    : 0;
  const specs = Object.fromEntries(
    publicStoreProductSpecs(product.specs || {})
      .slice(0, 40)
      .map(([key, value]) => [String(key).slice(0, 100), String(value).slice(0, 500)]),
  );

  return {
    title: String(product.title || "").slice(0, 500),
    subtitle: String(product.brand || "").slice(0, 500),
    page_unique: String(product.id),
    current_price: String(Math.round(Number(product.price || 0))),
    ...(oldPrice ? { old_price: String(oldPrice) } : {}),
    availability: available ? "instock" : "outofstock",
    category_name: String(product.category || "قطعات کامپیوتر").slice(0, 200),
    image_link: imageLink.slice(0, 1000),
    image_links: (imageLinks.length ? imageLinks : [imageLink]).map((url) => url.slice(0, 1000)),
    page_url: pageUrl,
    short_desc: String(product.summary || product.title || "").slice(0, 1000),
    spec: specs,
    guarantee: String(product.warranty || "").slice(0, 300),
  };
}

async function requestInput(request: Request): Promise<TorobInput> {
  const url = new URL(request.url);
  if (request.method === "GET") {
    return {
      page: url.searchParams.get("page") || undefined,
      page_unique: url.searchParams.get("page_unique") || undefined,
      page_url: url.searchParams.get("page_url") || undefined,
    };
  }

  const contentType = request.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const body = await request.json() as Record<string, unknown>;
      return {
        page: String(body.page || "") || undefined,
        page_unique: String(body.page_unique || "") || undefined,
        page_url: String(body.page_url || "") || undefined,
      };
    }
    const form = await request.formData();
    return {
      page: String(form.get("page") || "") || undefined,
      page_unique: String(form.get("page_unique") || "") || undefined,
      page_url: String(form.get("page_url") || "") || undefined,
    };
  } catch {
    return {};
  }
}

async function responseFor(request: Request) {
  const [data, overrides, input] = await Promise.all([
    getOptiBidData(),
    getStorePriceOverrides(),
    requestInput(request),
  ]);

  const products = uniqueProductsBySlug(
    applyStorePriceOverrides(data.storeProducts || [], overrides)
      .filter((product) =>
        product.isActive &&
        isStorefrontEligibleComputerPart(product) &&
        isCleanFeedProduct(product),
      )
      .sort((left, right) => {
        const leftTime = Date.parse(left.priceVerifiedAt || left.priceUpdatedAt || left.createdAt || "") || 0;
        const rightTime = Date.parse(right.priceVerifiedAt || right.priceUpdatedAt || right.createdAt || "") || 0;
        return rightTime - leftTime;
      }),
  );

  const singleProductLookup = Boolean(input.page_unique || input.page_url);
  let selected = singleProductLookup
    ? products
    : products.filter(isAvailableForFeed);
  if (input.page_unique) {
    selected = products.filter((product) => product.id === input.page_unique);
  } else if (input.page_url) {
    const requestedPath = normalizedPath(input.page_url);
    selected = products.filter(
      (product) => normalizedPath(`/shop/${product.slug}`) === requestedPath,
    );
  }

  // در استعلام تک‌محصول، کلید مستقل همان کالا منبع نهایی قیمت/موجودی است؛ این
  // مسیر مانع اختلاف قیمت فید با صفحه محصول در اثر هم‌زمانی نقشهٔ مشترک KV می‌شود.
  if ((input.page_unique || input.page_url) && selected[0]) {
    const dedicatedOverride = await getStorePriceOverridesByIds([selected[0].id]);
    selected = applyStorePriceOverrides([selected[0]], dedicatedOverride);
  }

  const total = selected.length;
  const maxPages = singleProductLookup ? (total ? 1 : 0) : Math.ceil(total / PAGE_SIZE);
  const page = singleProductLookup
    ? 1
    : Math.max(1, Math.min(maxPages || 1, Math.floor(Number(input.page || 1)) || 1));
  const pageProducts = singleProductLookup
    ? selected.slice(0, 1)
    : selected.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return NextResponse.json(
    {
      count: String(total),
      max_pages: String(maxPages),
      products: pageProducts.map(torobProduct),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}

export async function GET(request: Request) {
  return responseFor(request);
}

export async function POST(request: Request) {
  return responseFor(request);
}
