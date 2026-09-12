"use client";

import { useEffect, useState } from "react";

export default function BuyerModeButton({
  targetUrl,
  className = "rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-center text-xs font-bold text-green-700 hover:bg-green-100",
  label = "ورود به عنوان خریدار",
}: {
  targetUrl?: string;
  className?: string;
  label?: string;
}) {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem("userRole"));
  }, []);

  if (role !== "seller") return null;

  const switchToBuyerMode = () => {
    localStorage.setItem("previousUserRole", "seller");
    localStorage.setItem("userRole", "buyer");
    window.location.href = targetUrl || window.location.pathname;
  };

  return (
    <button type="button" onClick={switchToBuyerMode} className={className}>
      {label}
    </button>
  );
}
