import Link from "next/link";

export default function OptiBidLogo({
  className = "",
}: {
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={`flex shrink-0 items-center gap-2 ${className}`}
      aria-label="OptiBid - صفحه اصلی"
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="h-10 w-10 shrink-0"
      >
        <path
          d="M40 20 C20 20 15 35 15 50 C15 65 20 80 40 80 C60 80 65 65 65 50"
          stroke="#006494"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M45 50 C45 50 60 50 70 50 C80 50 85 60 85 65 C85 75 75 80 60 80 L45 80"
          stroke="#003b5c"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M60 50 L85 20 M85 20 L65 20 M85 20 L85 40"
          stroke="#00a8e8"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-xl font-bold tracking-tight text-[#003b5c] max-[360px]:hidden sm:text-2xl">
        Opti<span className="text-[#00a8e8]">Bid</span>
      </span>
    </Link>
  );
}
