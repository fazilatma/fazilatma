import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/shop", "/shop/", "/support", "/contact"],
        disallow: [
          "/api/",
          "/admin/",
          "/buyer/",
          "/seller/",
          "/account/",
          "/cart",
          "/login",
          "/register",
          "/forgot-password",
          "/external-link",
          "/source-code",
          "/requests",
          "/request-board",
          "/request-purchase",
          "/buyers",
          "/sellers",
          "/become-seller",
          "/*?verify=",
          "/*?next=",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
