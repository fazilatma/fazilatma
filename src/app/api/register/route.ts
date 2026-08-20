import { NextResponse } from "next/server";
import { createJsonUser, type JsonKycDocument } from "@/lib/json-store";
import { removeKycFiles, saveKycFile } from "@/lib/kyc-storage";

export const dynamic = "force-dynamic";

const toEnglishDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

const onlyDigits = (value: string) => toEnglishDigits(value).replace(/\D/g, "");
const text = (form: FormData, key: string) => String(form.get(key) || "").trim();
const asFile = (value: FormDataEntryValue | null) =>
  value instanceof File && value.size > 0 ? value : null;

function isValidCardNumber(value: string) {
  const digits = onlyDigits(value);
  if (!/^\d{16}$/.test(digits) || /^(\d)\1{15}$/.test(digits)) return false;
  const sum = digits.split("").reduce((total, digit, index) => {
    const result = Number(digit) * (index % 2 === 0 ? 2 : 1);
    return total + (result > 9 ? result - 9 : result);
  }, 0);
  return sum % 10 === 0;
}

function isValidSheba(value: string) {
  const normalized = toEnglishDigits(value).replace(/[\s-]/g, "").toUpperCase();
  if (!/^IR\d{24}$/.test(normalized)) return false;
  const rearranged = `${normalized.slice(4)}1827${normalized.slice(2, 4)}`;
  let remainder = 0;
  for (const char of rearranged) remainder = (remainder * 10 + Number(char)) % 97;
  return remainder === 1;
}

export async function POST(request: Request) {
  const savedDocuments: JsonKycDocument[] = [];
  try {
    const form = await request.formData();
    const fullName = text(form, "fullName");
    const username = text(form, "username").toLowerCase();
    const email = text(form, "email").toLowerCase();
    const password = text(form, "password");
    const role = text(form, "role") === "seller" ? "seller" : "buyer";

    if (!fullName || !username || !email || !password) {
      return NextResponse.json(
        { success: false, message: "نام، نام کاربری، ایمیل و رمز عبور الزامی هستند." },
        { status: 400 }
      );
    }
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
      return NextResponse.json(
        { success: false, message: "نام کاربری باید ۳ تا ۳۰ کاراکتر انگلیسی و شامل حروف، عدد، نقطه، خط تیره یا زیرخط باشد." },
        { status: 400 }
      );
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ success: false, message: "ایمیل معتبر نیست." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, message: "رمز عبور باید حداقل ۸ کاراکتر باشد." }, { status: 400 });
    }

    const city = text(form, "city");
    const postalCode = onlyDigits(text(form, "postalCode"));
    const defaultAddress = text(form, "defaultAddress");
    if (!city || !defaultAddress) {
      return NextResponse.json({ success: false, message: "شهر و نشانی پیش‌فرض الزامی هستند." }, { status: 400 });
    }
    if (postalCode && !/^\d{10}$/.test(postalCode)) {
      return NextResponse.json({ success: false, message: "کدپستی باید دقیقاً ۱۰ رقم باشد." }, { status: 400 });
    }

    const bankAccountHolder = text(form, "bankAccountHolder");
    const bankName = text(form, "bankName");
    const bankAccountNumber = onlyDigits(text(form, "bankAccountNumber"));
    const bankCardNumber = onlyDigits(text(form, "bankCardNumber"));
    const rawSheba = toEnglishDigits(text(form, "bankShebaNumber"))
      .replace(/[\s-]/g, "")
      .toUpperCase();
    const bankShebaNumber = rawSheba.startsWith("IR") ? rawSheba : `IR${onlyDigits(rawSheba)}`;

    if (!bankAccountHolder || !bankName || !bankAccountNumber || !bankCardNumber || !bankShebaNumber) {
      return NextResponse.json({ success: false, message: "اطلاعات حساب بانکی کامل نیست." }, { status: 400 });
    }
    if (!/^\d{14}$/.test(bankAccountNumber)) {
      return NextResponse.json({ success: false, message: "شماره حساب باید دقیقاً ۱۴ رقم و مطابق الگوی ۳-۳-۷-۱ باشد." }, { status: 400 });
    }
    if (!isValidCardNumber(bankCardNumber)) {
      return NextResponse.json({ success: false, message: "شماره کارت ۱۶ رقمی معتبر نیست." }, { status: 400 });
    }
    if (!isValidSheba(bankShebaNumber)) {
      return NextResponse.json({ success: false, message: "شماره شبا معتبر نیست." }, { status: 400 });
    }

    const nationalCard = asFile(form.get("nationalCard"));
    const bankCardImage = asFile(form.get("bankCardImage"));
    const birthCertificatePages = form
      .getAll("birthCertificatePages")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (!nationalCard || !bankCardImage || birthCertificatePages.length === 0) {
      return NextResponse.json(
        { success: false, message: "تصویر کارت ملی، حداقل یک تصویر از صفحات شناسنامه و تصویر کارت بانکی الزامی هستند." },
        { status: 400 }
      );
    }
    if (birthCertificatePages.length > 8) {
      return NextResponse.json({ success: false, message: "حداکثر ۸ تصویر برای صفحات شناسنامه مجاز است." }, { status: 400 });
    }

    savedDocuments.push(
      await saveKycFile(nationalCard, "national_card", "تصویر کارت ملی")
    );
    for (let index = 0; index < birthCertificatePages.length; index += 1) {
      savedDocuments.push(
        await saveKycFile(
          birthCertificatePages[index],
          "birth_certificate",
          `صفحه ${index + 1} شناسنامه`
        )
      );
    }
    savedDocuments.push(
      await saveKycFile(bankCardImage, "bank_card", "تصویر کارت بانکی")
    );

    let categories: string[] = [];
    try {
      const parsed = JSON.parse(text(form, "categories") || "[]");
      categories = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      categories = [];
    }
    if (role === "seller" && categories.length === 0) {
      await removeKycFiles(savedDocuments);
      return NextResponse.json({ success: false, message: "فروشنده باید حداقل یک حوزه فعالیت انتخاب کند." }, { status: 400 });
    }

    const profileImage = asFile(form.get("profileImage"));
    const { user } = await createJsonUser({
      fullName,
      username,
      email,
      password,
      role,
      avatarName: profileImage?.name,
      city,
      postalCode,
      defaultAddress,
      bankAccountHolder,
      bankName,
      bankAccountNumber,
      bankCardNumber,
      bankShebaNumber,
      categories,
      kycDocuments: savedDocuments,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        kycStatus: user.kycStatus,
      },
      message: "ثبت‌نام انجام شد. حساب پس از بررسی و تایید مدارک توسط ادمین فعال می‌شود.",
    });
  } catch (error) {
    await removeKycFiles(savedDocuments);
    const detail = error instanceof Error ? error.message : "Unknown registration error";
    const message = detail.includes("Email already")
      ? "این ایمیل قبلاً ثبت شده است."
      : detail.includes("Username already")
        ? "این نام کاربری قبلاً انتخاب شده است."
        : detail.includes("Only JPG")
          ? "مدارک باید با فرمت JPG، PNG یا WEBP باشند."
          : detail.includes("5 MB")
            ? "حجم هر تصویر مدرک نباید بیشتر از ۵ مگابایت باشد."
            : "ثبت‌نام و ذخیره مدارک ناموفق بود.";
    return NextResponse.json({ success: false, message, detail }, { status: 500 });
  }
}
