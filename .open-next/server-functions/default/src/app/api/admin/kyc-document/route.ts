import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOptiBidData } from "@/lib/json-store";
import { readKycFile } from "@/lib/kyc-storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if ((await cookies()).get("optibid_admin")?.value !== "1") {
    return NextResponse.json({ success: false, message: "دسترسی ادمین لازم است." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("userId"));
    const documentId = String(searchParams.get("documentId") || "");
    const data = await getOptiBidData();
    const user = data.users.find((item) => item.id === userId);
    const document = user?.kycDocuments?.find((item) => item.id === documentId);
    if (!user || !document) {
      return NextResponse.json({ success: false, message: "مدرک یافت نشد." }, { status: 404 });
    }

    const file = await readKycFile(document.storedName);
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(document.originalName)}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown KYC document error";
    return NextResponse.json({ success: false, message: "نمایش مدرک ناموفق بود.", detail }, { status: 500 });
  }
}
