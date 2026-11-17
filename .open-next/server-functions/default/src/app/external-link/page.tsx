import Link from "next/link";

function normalizeBaseUrl(url: string) {
  const trimmed = url.trim().replace(/\/$/, "");
  if (!trimmed) return "https://optibid.arena.site";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

export default function ExternalLinkPage() {
  const baseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_EXTERNAL_BASE_URL ||
      process.env.EXTERNAL_BASE_URL ||
      "https://optibid.arena.site"
  );

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-6 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-[#003b5c]">
          لینک خارجی OptiBid
        </div>
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          لینک خارجی با فرمت arena.site
        </h1>
        <p className="mb-6 leading-7 text-gray-600">
          این صفحه لینک خارجی سامانه را با فرمت <span dir="ltr" className="font-mono">*.arena.site</span> نمایش می‌دهد. برای اینکه لینک واقعاً باز شود، باید دامنه در پنل هاست یا پلتفرم شما به سامانه متصل شده باشد.
        </p>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="mb-2 text-sm font-bold text-gray-600">External URL:</p>
          <a
            href={baseUrl}
            target="_blank"
            rel="noreferrer"
            dir="ltr"
            className="block break-all rounded-xl bg-white px-4 py-3 font-mono text-lg font-bold text-[#003b5c] hover:text-[#00a8e8]"
          >
            {baseUrl}
          </a>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-xl bg-[#003b5c] px-6 py-3 text-center font-bold text-white transition hover:bg-[#002d46]"
          >
            بازگشت به سایت
          </Link>
          <a
            href="/api/external-link"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-[#00a8e8] px-6 py-3 text-center font-bold text-[#00a8e8] transition hover:bg-blue-50"
          >
            دریافت JSON لینک
          </a>
        </div>
      </div>
    </div>
  );
}
