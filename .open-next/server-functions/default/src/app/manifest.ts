import type { MetadataRoute } from "next";
import { defaultSeoDescription, siteName } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteName} - فروشگاه تخصصی لپ‌تاپ`,
    short_name: siteName,
    description: defaultSeoDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    dir: "rtl",
    lang: "fa-IR",
    background_color: "#f7f8fa",
    theme_color: "#003b5c",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
