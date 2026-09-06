import { NextResponse } from "next/server";
import {
  updateJsonSellerProfile,
  type JsonKycDocument,
} from "@/lib/json-store";
import { removeAvatarFile, saveAvatarFile } from "@/lib/avatar-storage";
import { removeKycFiles, saveKycFile } from "@/lib/kyc-storage";

export const dynamic = "force-dynamic";

const asFile = (value: FormDataEntryValue | null) =>
  value instanceof File && value.size > 0 ? value : null;

async function saveOptionalKycDocuments(form: FormData) {
  const savedDocuments: JsonKycDocument[] = [];
  const nationalCard = asFile(form.get("nationalCard"));
  const bankCardImage = asFile(form.get("bankCardImage"));
  const birthCertificatePages = form
    .getAll("birthCertificatePages")
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (nationalCard)
    savedDocuments.push(
      await saveKycFile(nationalCard, "national_card", "تصویر کارت ملی"),
    );
  for (
    let index = 0;
    index < Math.min(8, birthCertificatePages.length);
    index += 1
  ) {
    savedDocuments.push(
      await saveKycFile(
        birthCertificatePages[index],
        "birth_certificate",
        `صفحه ${index + 1} شناسنامه`,
      ),
    );
  }
  if (bankCardImage)
    savedDocuments.push(
      await saveKycFile(bankCardImage, "bank_card", "تصویر کارت بانکی"),
    );
  return savedDocuments;
}

export async function PATCH(request: Request) {
  let savedAvatarName = "";
  const savedDocuments: JsonKycDocument[] = [];
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const sellerId = Number(form.get("sellerId"));
      if (!sellerId) {
        return NextResponse.json(
          { success: false, message: "شناسه فروشنده معتبر نیست." },
          { status: 400 },
        );
      }

      const avatar = asFile(form.get("avatar"));
      if (avatar) savedAvatarName = await saveAvatarFile(avatar);
      savedDocuments.push(...(await saveOptionalKycDocuments(form)));

      let categories: string[] | undefined;
      try {
        const parsed = JSON.parse(String(form.get("categories") || "[]"));
        categories = Array.isArray(parsed) ? parsed.map(String) : undefined;
      } catch {
        categories = undefined;
      }

      const seller = await updateJsonSellerProfile(sellerId, {
        fullName:
          typeof form.get("fullName") === "string"
            ? String(form.get("fullName"))
            : undefined,
        username:
          typeof form.get("username") === "string"
            ? String(form.get("username"))
            : undefined,
        email:
          typeof form.get("email") === "string"
            ? String(form.get("email"))
            : undefined,
        phone:
          typeof form.get("phone") === "string"
            ? String(form.get("phone"))
            : undefined,
        bio:
          typeof form.get("bio") === "string"
            ? String(form.get("bio"))
            : undefined,
        city:
          typeof form.get("city") === "string"
            ? String(form.get("city"))
            : undefined,
        postalCode:
          typeof form.get("postalCode") === "string"
            ? String(form.get("postalCode"))
            : undefined,
        defaultAddress:
          typeof form.get("defaultAddress") === "string"
            ? String(form.get("defaultAddress"))
            : undefined,
        bankAccountHolder:
          typeof form.get("bankAccountHolder") === "string"
            ? String(form.get("bankAccountHolder"))
            : undefined,
        bankName:
          typeof form.get("bankName") === "string"
            ? String(form.get("bankName"))
            : undefined,
        bankAccountNumber:
          typeof form.get("bankAccountNumber") === "string"
            ? String(form.get("bankAccountNumber"))
            : undefined,
        bankCardNumber:
          typeof form.get("bankCardNumber") === "string"
            ? String(form.get("bankCardNumber"))
            : undefined,
        bankShebaNumber:
          typeof form.get("bankShebaNumber") === "string"
            ? String(form.get("bankShebaNumber"))
            : undefined,
        categories,
        avatarName: savedAvatarName || undefined,
        kycDocuments: savedDocuments,
      });

      return NextResponse.json({
        success: true,
        seller,
        message: "اطلاعات حساب فروشنده ذخیره شد.",
      });
    }

    const body = await request.json();
    const sellerId = Number(body.sellerId);

    if (!sellerId) {
      return NextResponse.json(
        { success: false, message: "شناسه فروشنده معتبر نیست." },
        { status: 400 },
      );
    }

    const seller = await updateJsonSellerProfile(sellerId, {
      fullName: typeof body.fullName === "string" ? body.fullName : undefined,
      username: typeof body.username === "string" ? body.username : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      bio: typeof body.bio === "string" ? body.bio : undefined,
      city: typeof body.city === "string" ? body.city : undefined,
      postalCode:
        typeof body.postalCode === "string" ? body.postalCode : undefined,
      defaultAddress:
        typeof body.defaultAddress === "string"
          ? body.defaultAddress
          : undefined,
      bankAccountHolder:
        typeof body.bankAccountHolder === "string"
          ? body.bankAccountHolder
          : undefined,
      bankName: typeof body.bankName === "string" ? body.bankName : undefined,
      bankAccountNumber:
        typeof body.bankAccountNumber === "string"
          ? body.bankAccountNumber
          : undefined,
      bankCardNumber:
        typeof body.bankCardNumber === "string"
          ? body.bankCardNumber
          : undefined,
      bankShebaNumber:
        typeof body.bankShebaNumber === "string"
          ? body.bankShebaNumber
          : undefined,
      categories: Array.isArray(body.categories) ? body.categories : undefined,
    });

    return NextResponse.json({
      success: true,
      seller,
      message: "اطلاعات حساب فروشنده ذخیره شد.",
    });
  } catch (error) {
    if (savedAvatarName) await removeAvatarFile(savedAvatarName);
    if (savedDocuments.length) await removeKycFiles(savedDocuments);
    const detail =
      error instanceof Error ? error.message : "Unknown seller profile error";
    const message =
      detail.includes("Profile image") || detail.includes("Only JPG")
        ? "تصویرها باید JPG، PNG یا WEBP و در حجم مجاز باشند."
        : detail.includes("Invalid username")
          ? "نام کاربری باید ۳ تا ۳۰ کاراکتر انگلیسی باشد."
          : detail.includes("Username already")
            ? "این نام کاربری قبلاً ثبت شده است."
            : detail.includes("Email already")
              ? "این ایمیل قبلاً ثبت شده است."
              : detail.includes("Phone already")
                ? "این شماره موبایل قبلاً ثبت شده است."
                : "ذخیره اطلاعات حساب فروشنده ناموفق بود.";
    return NextResponse.json(
      { success: false, message, detail },
      { status: 500 },
    );
  }
}
