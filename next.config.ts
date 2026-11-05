import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // در حالت dev، Next درخواست‌های cross-origin به فایل‌های /_next/static را
  // با 403 مسدود می‌کند. پیش‌نمایش‌ها از دامنه‌های پروکسی (e2b.app / arena.site)
  // سرو می‌شوند، بنابراین این مبداها باید مجاز باشند؛ وگرنه صفحه بدون JS و
  // استایل باز می‌شود.
  allowedDevOrigins: [
    "*.e2b.app",
    "*.arena.site",
    "localhost",
    "127.0.0.1",
  ],
  // هدرهای کش فقط برای خروجی پروداکشن اعمال می‌شوند؛ در dev باعث اختلال
  // در بارگذاری مجدد فایل‌ها و HMR می‌شوند.
  async headers() {
    if (!isProduction) return [];
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*.{png,jpg,jpeg,webp,svg,ico,css,js}",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
