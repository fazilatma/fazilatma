import { NextResponse } from "next/server";
import { createJsonUser, type JsonKycDocument } from "@/lib/json-store";
import { removeKycFiles, saveKycFile } from "@/lib/kyc-storage";
import { removeAvatarFile, saveAvatarFile } from "@/lib/avatar-storage";

export const dynamic = "force-dynamic";

const toEnglishDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

const onlyDigits = (value: string) => toEnglishDigits(value).replace(/\D/g, "");
const text = (form: FormData, key: string) => String(form.get(key) || "").trim();
const asFile = (value: FormDataEntryValue | null) =>
  value instanceof File && value.size > 0 ? value : null;

function normalizePhone(value: string) {
  const digits = onlyDigits(value);
  if (!digits) return "";
  if (digits.startsWith("0098")) return `0${digits.slice(4)}`;
  if (digits.startsWith("98")) return `0${digits.slice(2)}`;
  return digits;
}

function isEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value.trim().toLowerCase());
}

function isMobile(value: string) {
  return /^09\d{9}$/.test(normalizePhone(value));
}

async function saveOptionalKycDocuments(form: FormData) {
  const savedDocuments: JsonKycDocument[] = [];
  const nationalCard = asFile(form.get("nationalCard"));
  const bankCardImage = asFile(form.get("bankCardImage"));
  const birthCertificatePages = form
    .getAll("birthCertificatePages")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (nationalCard) {
    savedDocuments.push(await saveKycFile(nationalCard, "national_card", "تصویر کارت ملی"));
  }
  for (let index = 0; index < Math.min(8, birthCertificatePages.length); index += 1) {
    savedDocuments.push(
      await saveKycFile(
        birthCertificatePages[index],
        "birth_certificate",
        `صفحه ${index + 1} شناسنامه`,
      ),
    );
  }
  if (bankCardImage) {
    savedDocuments.push(await saveKycFile(bankCardImage, "bank_card", "تصویر کارت بانکی"));
  }

  return savedDocuments;
}

export async function POST(request: Request) {
  const savedDocuments: JsonKycDocument[] = [];
  let savedAvatarName = "";
  try {
    const form = await request.formData();
    const fullName = text(form, "fullName");
    const identifier = text(form, "identifier") || text(form, "email") || text(form, "phone");
    const explicitEmail = text(form, "email").toLowerCase();
    const explicitPhone = text(form, "phone");
    const password = text(form, "password");
    const role = text(form, "role") === "seller" ? "seller" : "buyer";

    const email = explicitEmail || (isEmail(identifier) ? identifier.toLowerCase() : "");
    const phone = explicitPhone || (isMobile(identifier) ? normalizePhone(identifier) : "");

    if (!email && !phone) {
      return NextResponse.json(
        { success: false, message: "برای ثبت‌نام، شماره موبایل معتبر یا ایمیل معتبر وارد کنید." },
        { status: 400 },
      );
    }
    if (email && !isEmail(email)) {
      return NextResponse.json({ success: false, message: "ایمیل معتبر نیست." }, { status: 400 });
    }
    if (phone && !isMobile(phone)) {
      return NextResponse.json({ success: false, message: "شماره موبایل باید با 09 شروع شود و ۱۱ رقم باشد." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, message: "رمز عبور باید حداقل ۸ کاراکتر باشد." }, { status: 400 });
    }

    let categories: string[] = [];
    try {
      const parsed = JSON.parse(text(form, "categories") || "[]");
      categories = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      categories = [];
    }

    savedDocuments.push(...(await saveOptionalKycDocuments(form)));
    const profileImage = asFile(form.get("profileImage"));
    if (profileImage) savedAvatarName = await saveAvatarFile(profileImage);

    const { user } = await createJsonUser({
      fullName,
      username: text(form, "username") || undefined,
      email,
      phone,
      password,
      role,
      avatarName: savedAvatarName || undefined,
      city: text(form, "city"),
      postalCode: onlyDigits(text(form, "postalCode")),
      defaultAddress: text(form, "defaultAddress"),
      bankAccountHolder: text(form, "bankAccountHolder"),
      bankName: text(form, "bankName"),
      bankAccountNumber: onlyDigits(text(form, "bankAccountNumber")),
      bankCardNumber: onlyDigits(text(form, "bankCardNumber")),
      bankShebaNumber: text(form, "bankShebaNumber"),
      categories,
      kycDocuments: savedDocuments,
      isActive: true,
      kycStatus: savedDocuments.length > 0 ? "pending" : "pending",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        kycStatus: user.kycStatus,
      },
      message: "ثبت‌نام سریع انجام شد. حالا می‌توانید وارد حساب شوید و اطلاعات تکمیلی، حساب بانکی و مدارک را مرحله‌به‌مرحله کامل کنید.",
    });
  } catch (error) {
    await removeKycFiles(savedDocuments);
    if (savedAvatarName) await removeAvatarFile(savedAvatarName);
    const detail = error instanceof Error ? error.message : "Unknown registration error";
    const message = detail.includes("Email already")
      ? "این ایمیل قبلاً ثبت شده است."
      : detail.includes("Phone already")
        ? "این شماره موبایل قبلاً ثبت شده است."
        : detail.includes("Username already")
          ? "این نام کاربری قبلاً انتخاب شده است."
          : detail.includes("Only JPG")
            ? "مدارک باید با فرمت JPG، PNG یا WEBP باشند."
            : detail.includes("5 MB")
              ? "حجم هر تصویر مدرک نباید بیشتر از ۵ مگابایت باشد."
              : "ثبت‌نام ناموفق بود.";
    return NextResponse.json({ success: false, message, detail }, { status: 500 });
  }
}
