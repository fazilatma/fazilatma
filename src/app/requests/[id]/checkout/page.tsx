"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CheckoutPage() {
  const params = useParams() as unknown as { id: string };
  const router = useRouter();

  useEffect(() => {
    router.replace(`/requests/${params.id}`);
  }, [params.id, router]);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 px-4 py-16 text-center">
      <div className="mx-auto max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
          ↩️
        </div>
        <h1 className="text-xl font-bold text-[#003b5c]">
          در حال بازگشت به صفحه درخواست...
        </h1>
      </div>
    </div>
  );
}
