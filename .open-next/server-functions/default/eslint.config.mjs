import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  // Keep the starter on the flat config export that actually runs under the pinned ESLint/Next toolchain.
  ...nextCoreWebVitals,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // خروجی‌های بیلد Cloudflare و فایل تولیدشده اسنپ‌شات
    ".open-next/**",
    ".wrangler/**",
    "src/generated/**",
  ]),
]);
