"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const toEnglishDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

const normalizePhone = (value: string) => {
  const digits = toEnglishDigits(value).replace(/\D/g, "");
  if (digits.startsWith("0098")) return `0${digits.slice(4)}`;
  if (digits.startsWith("98")) return `0${digits.slice(2)}`;
  return digits;
};

const categories = [
  "کالای دیجیتال",
  "مد و پوشاک",
  "خانه و آشپزخانه",
  "زیبایی و سلامت",
  "کتاب و لوازم تحریر",
  "ورزش و سفر",
  "اسباب‌بازی و کودک",
  "خودرو و موتور",
  "صنعتی و اداری",
  "سایر",
];

const emptyProfile = {
  fullName: "",
  username: "",
  email: "",
  phone: "",
  bio: "",
  city: "",
  postalCode: "",
  defaultAddress: "",
  bankAccountHolder: "",
  bankName: "",
  bankAccountNumber: "",
  bankCardNumber: "",
  bankShebaNumber: "",
  categories: [] as string[],
};

function completionItems(
  profile: typeof emptyProfile,
  role: string,
  avatarPreview: string,
  docsCount: number,
) {
  return [
    {
      label: "راه ارتباطی",
      done: Boolean(profile.email || profile.phone),
      weight: 15,
    },
    {
      label: "نام کاربری",
      done: Boolean(profile.username),
      weight: 10,
    },
    {
      label: "نام و پروفایل",
      done: Boolean(profile.fullName && avatarPreview),
      weight: 10,
    },
    {
      label: "نشانی",
      done: Boolean(profile.city && profile.defaultAddress),
      weight: 15,
    },
    {
      label: "اطلاعات بانکی",
      done: Boolean(
        profile.bankAccountHolder &&
        profile.bankName &&
        profile.bankCardNumber &&
        profile.bankShebaNumber,
      ),
      weight: 20,
    },
    { label: "مدارک احراز", done: docsCount > 0, weight: 20 },
    {
      label: role === "seller" ? "حوزه فعالیت" : "دسته‌های مورد علاقه",
      done: role === "seller" ? profile.categories.length > 0 : true,
      weight: 10,
    },
  ];
}

export default function AccountCompletionPage() {
  const [role, setRole] = useState<string>("");
  const [userId, setUserId] = useState(0);
  const [profile, setProfile] = useState(emptyProfile);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [nationalCard, setNationalCard] = useState<File | null>(null);
  const [birthCertificatePages, setBirthCertificatePages] = useState<File[]>(
    [],
  );
  const [bankCardImage, setBankCardImage] = useState<File | null>(null);
  const [existingDocsCount, setExistingDocsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole") || "";
    const storedId = Number(localStorage.getItem("userId") || 0);
    setRole(storedRole);
    setUserId(storedId);
    if (!storedRole || !storedId || storedRole === "admin") {
      setLoading(false);
      return;
    }
    fetch(`/api/dashboard/${storedRole}?${storedRole}Id=${storedId}`, {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((result) => {
        if (!result.success)
          throw new Error(result.message || "دریافت اطلاعات حساب ناموفق بود.");
        const user = storedRole === "seller" ? result.seller : result.buyer;
        setProfile({
          fullName: user.fullName || "",
          username: user.username || "",
          email: user.email?.includes("@phone.optibid.local")
            ? ""
            : user.email || "",
          phone: user.phone || "",
          bio: user.bio || "",
          city: user.city || "",
          postalCode: user.postalCode || "",
          defaultAddress: user.defaultAddress || "",
          bankAccountHolder: user.bankAccountHolder || "",
          bankName: user.bankName || "",
          bankAccountNumber: user.bankAccountNumber || "",
          bankCardNumber: user.bankCardNumber || "",
          bankShebaNumber: (user.bankShebaNumber || "").replace(/^IR/i, ""),
          categories: user.categories || [],
        });
        setExistingDocsCount(user.kycDocuments?.length || 0);
        setAvatarPreview(
          user.avatarName
            ? `/api/avatar?userId=${user.id}&v=${encodeURIComponent(user.avatarName)}`
            : "",
        );
      })
      .catch((error) =>
        alert(
          error instanceof Error
            ? error.message
            : "دریافت اطلاعات حساب ناموفق بود.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const items = useMemo(
    () =>
      completionItems(
        profile,
        role,
        avatarPreview,
        existingDocsCount +
          (nationalCard ? 1 : 0) +
          birthCertificatePages.length +
          (bankCardImage ? 1 : 0),
      ),
    [
      profile,
      role,
      avatarPreview,
      existingDocsCount,
      nationalCard,
      birthCertificatePages,
      bankCardImage,
    ],
  );
  const percent = Math.min(
    100,
    items.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0),
  );
  const level =
    percent >= 90
      ? "طلایی / آماده معامله"
      : percent >= 65
        ? "نقره‌ای / قابل اعتماد"
        : percent >= 35
          ? "برنزی / نیازمند تکمیل"
          : "پایه / ثبت‌نام سریع";

  const update = (key: keyof typeof emptyProfile, value: any) =>
    setProfile((current) => ({ ...current, [key]: value }));

  const toggleCategory = (category: string) => {
    update(
      "categories",
      profile.categories.includes(category)
        ? profile.categories.filter((item) => item !== category)
        : [...profile.categories, category],
    );
  };

  const handleAvatar = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return alert("فقط فایل تصویری مجاز است.");
    if (file.size > 3 * 1024 * 1024)
      return alert("حجم تصویر پروفایل حداکثر ۳ مگابایت است.");
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const validateDocFiles = (files: File[]) => {
    const invalid = files.find(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024,
    );
    if (invalid) {
      alert("مدارک باید تصویر JPG، PNG یا WEBP و حداکثر ۵ مگابایت باشند.");
      return false;
    }
    return true;
  };

  const save = async () => {
    if (!role || !userId || role === "admin") return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append(role === "seller" ? "sellerId" : "buyerId", String(userId));
      Object.entries(profile).forEach(([key, value]) => {
        if (key === "categories") form.append(key, JSON.stringify(value));
        else form.append(key, String(value || ""));
      });
      if (profile.bankShebaNumber)
        form.set(
          "bankShebaNumber",
          `IR${profile.bankShebaNumber.replace(/\D/g, "").slice(0, 24)}`,
        );
      if (avatarFile) form.append("avatar", avatarFile);
      if (nationalCard) form.append("nationalCard", nationalCard);
      birthCertificatePages.forEach((file) =>
        form.append("birthCertificatePages", file),
      );
      if (bankCardImage) form.append("bankCardImage", bankCardImage);

      const response = await fetch(
        role === "seller" ? "/api/seller/profile" : "/api/buyer/profile",
        { method: "PATCH", body: form },
      );
      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || "ذخیره اطلاعات ناموفق بود.");
      localStorage.setItem(
        "userDisplayName",
        profile.fullName ||
          localStorage.getItem("userDisplayName") ||
          "کاربر OptiBid",
      );
      alert(result.message);
      window.location.assign(
        role === "seller" ? "/seller/dashboard" : "/buyer/dashboard",
      );
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "ذخیره اطلاعات ناموفق بود.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div
        dir="rtl"
        className="grid min-h-[60vh] place-items-center bg-gray-50 text-[#003b5c]"
      >
        در حال بارگذاری تکمیل اطلاعات...
      </div>
    );
  if (!role || !userId || role === "admin") {
    return (
      <div
        dir="rtl"
        className="mx-auto mt-12 max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center"
      >
        <h1 className="text-xl font-bold text-amber-900">
          ابتدا وارد حساب خریدار یا فروشنده شوید
        </h1>
        <Link
          href="/login"
          className="mt-5 inline-block rounded-xl bg-[#003b5c] px-6 py-3 font-bold text-white"
        >
          ورود
        </Link>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#003b5c]">
              تکمیل اطلاعات حساب کاربری
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              حساب شما با ثبت‌نام سریع ساخته شده؛ حالا برای کاهش خطا، افزایش
              اعتماد و فعال شدن امکانات مالی اطلاعات را مرحله‌ای کامل کنید.
            </p>
          </div>
          <Link
            href={role === "seller" ? "/seller/dashboard" : "/buyer/dashboard"}
            className="rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-gray-700 shadow-sm"
          >
            بعداً تکمیل می‌کنم
          </Link>
        </div>

        <section className="mb-6 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-bold text-gray-500">درجه تکمیل حساب</p>
              <h2 className="mt-1 text-2xl font-bold text-[#003b5c]">
                {level}
              </h2>
            </div>
            <div className="min-w-[240px] flex-1">
              <div className="h-4 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-[#00a8e8] to-[#0b9c56]"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p
                className="mt-2 text-left text-sm font-bold text-[#0b9c56]"
                dir="ltr"
              >
                {percent}%
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.label}
                className={`rounded-xl px-3 py-2 text-xs font-bold ${item.done ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}
              >
                {item.done ? "✓" : "○"} {item.label}
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">۱. اطلاعات پایه</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-bold text-gray-700">
                نام / نام شرکت
                <input
                  value={profile.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  className="mt-2 w-full rounded-xl border p-3 font-normal"
                />
              </label>
              <label className="text-sm font-bold text-gray-700">
                نام کاربری برای ورود
                <input
                  dir="ltr"
                  value={profile.username}
                  onChange={(e) =>
                    update(
                      "username",
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9._-]/g, "")
                        .slice(0, 30),
                    )
                  }
                  placeholder="مثال: ali.rezaei"
                  className="mt-2 w-full rounded-xl border p-3 text-left font-normal"
                />
                <span className="mt-1 block text-xs font-normal text-gray-500">
                  بعد از ذخیره، می‌توانید با همین نام کاربری و رمز عبور وارد
                  شوید.
                </span>
              </label>
              <label className="text-sm font-bold text-gray-700">
                شماره موبایل
                <input
                  dir="ltr"
                  value={profile.phone}
                  onChange={(e) =>
                    update("phone", normalizePhone(e.target.value).slice(0, 11))
                  }
                  className="mt-2 w-full rounded-xl border p-3 text-left font-normal"
                />
              </label>
              <label className="text-sm font-bold text-gray-700">
                ایمیل
                <input
                  dir="ltr"
                  value={profile.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="mt-2 w-full rounded-xl border p-3 text-left font-normal"
                />
              </label>
              <label className="text-sm font-bold text-gray-700">
                شهر / استان
                <input
                  value={profile.city}
                  onChange={(e) => update("city", e.target.value)}
                  className="mt-2 w-full rounded-xl border p-3 font-normal"
                />
              </label>
              <label className="text-sm font-bold text-gray-700">
                کدپستی
                <input
                  dir="ltr"
                  value={profile.postalCode}
                  onChange={(e) =>
                    update(
                      "postalCode",
                      normalizePhone(e.target.value).slice(0, 10),
                    )
                  }
                  className="mt-2 w-full rounded-xl border p-3 text-left font-normal"
                />
              </label>
              <div className="flex items-center gap-4 rounded-2xl bg-gray-50 p-4">
                <div className="h-20 w-20 overflow-hidden rounded-2xl bg-white">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-2xl">
                      👤
                    </div>
                  )}
                </div>
                <label className="cursor-pointer rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-[#00a8e8]">
                  انتخاب عکس / لوگو
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleAvatar(e.target.files?.[0])}
                  />
                </label>
              </div>
              <label className="text-sm font-bold text-gray-700 md:col-span-2">
                نشانی کامل پیش‌فرض
                <textarea
                  value={profile.defaultAddress}
                  onChange={(e) => update("defaultAddress", e.target.value)}
                  className="mt-2 min-h-24 w-full rounded-xl border p-3 font-normal"
                />
              </label>
              <label className="text-sm font-bold text-gray-700 md:col-span-2">
                درباره شما / فروشگاه
                <textarea
                  value={profile.bio}
                  onChange={(e) => update("bio", e.target.value)}
                  className="mt-2 min-h-24 w-full rounded-xl border p-3 font-normal"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">
              ۲. اطلاعات بانکی برای تسویه کیف پول
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-bold text-gray-700">
                نام صاحب حساب
                <input
                  value={profile.bankAccountHolder}
                  onChange={(e) => update("bankAccountHolder", e.target.value)}
                  className="mt-2 w-full rounded-xl border p-3 font-normal"
                />
              </label>
              <label className="text-sm font-bold text-gray-700">
                نام بانک
                <input
                  value={profile.bankName}
                  onChange={(e) => update("bankName", e.target.value)}
                  className="mt-2 w-full rounded-xl border p-3 font-normal"
                />
              </label>
              <label className="text-sm font-bold text-gray-700">
                شماره حساب
                <input
                  dir="ltr"
                  value={profile.bankAccountNumber}
                  onChange={(e) =>
                    update(
                      "bankAccountNumber",
                      normalizePhone(e.target.value).slice(0, 30),
                    )
                  }
                  className="mt-2 w-full rounded-xl border p-3 text-left font-normal"
                />
              </label>
              <label className="text-sm font-bold text-gray-700">
                شماره کارت
                <input
                  dir="ltr"
                  value={profile.bankCardNumber
                    .replace(/(.{4})/g, "$1-")
                    .replace(/-$/, "")}
                  onChange={(e) =>
                    update(
                      "bankCardNumber",
                      normalizePhone(e.target.value).slice(0, 16),
                    )
                  }
                  className="mt-2 w-full rounded-xl border p-3 text-left font-normal"
                />
              </label>
              <label className="text-sm font-bold text-gray-700 md:col-span-2">
                شماره شبا
                <div className="mt-2 flex overflow-hidden rounded-xl border">
                  <span className="bg-gray-100 px-4 py-3 font-bold">IR</span>
                  <input
                    dir="ltr"
                    value={profile.bankShebaNumber}
                    onChange={(e) =>
                      update(
                        "bankShebaNumber",
                        normalizePhone(e.target.value).slice(0, 24),
                      )
                    }
                    className="w-full p-3 text-left outline-none"
                  />
                </div>
              </label>
            </div>
          </section>

          {role === "seller" && (
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold">
                ۳. حوزه‌های فعالیت فروشنده
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {categories.map((category) => (
                  <label
                    key={category}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-bold ${profile.categories.includes(category) ? "border-blue-300 bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-600"}`}
                  >
                    <input
                      type="checkbox"
                      checked={profile.categories.includes(category)}
                      onChange={() => toggleCategory(category)}
                    />
                    {category}
                  </label>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">
              {role === "seller" ? "۴" : "۳"}. مدارک و عکس‌های احراز هویت
            </h2>
            <p className="mb-4 text-sm leading-7 text-amber-800">
              این بخش اختیاری نیست اما لازم نیست هنگام ثبت‌نام پر شود. هر زمان
              مدارک را بارگذاری کنید، ادمین بررسی می‌کند و درجه اعتماد حساب
              بالاتر می‌رود.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <DocPicker
                label="تصویر کارت ملی"
                file={nationalCard}
                onChange={(files) => setNationalCard(files[0] || null)}
                validate={validateDocFiles}
              />
              <DocPicker
                label="صفحات شناسنامه"
                files={birthCertificatePages}
                multiple
                onChange={(files) =>
                  setBirthCertificatePages(files.slice(0, 8))
                }
                validate={validateDocFiles}
              />
              <DocPicker
                label="تصویر کارت بانکی"
                file={bankCardImage}
                onChange={(files) => setBankCardImage(files[0] || null)}
                validate={validateDocFiles}
              />
            </div>
            <p className="mt-3 text-xs text-amber-700">
              مدارک قبلی ثبت‌شده: {existingDocsCount.toLocaleString("fa-IR")}{" "}
              فایل
            </p>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={save}
              disabled={saving}
              className="flex-[2] rounded-xl bg-[#0b9c56] px-6 py-4 font-bold text-white disabled:bg-gray-400"
            >
              {saving ? "در حال ذخیره..." : "ذخیره اطلاعات و رفتن به داشبورد"}
            </button>
            <Link
              href={
                role === "seller" ? "/seller/dashboard" : "/buyer/dashboard"
              }
              className="flex-1 rounded-xl bg-white px-6 py-4 text-center font-bold text-gray-700 shadow-sm"
            >
              بعداً تکمیل می‌کنم
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocPicker({
  label,
  file,
  files = [],
  multiple,
  onChange,
  validate,
}: {
  label: string;
  file?: File | null;
  files?: File[];
  multiple?: boolean;
  onChange: (files: File[]) => void;
  validate: (files: File[]) => boolean;
}) {
  const selected = multiple ? files : file ? [file] : [];
  return (
    <div className="rounded-2xl border border-amber-100 bg-white p-4">
      <p className="mb-3 text-sm font-bold text-gray-800">{label}</p>
      <label className="block cursor-pointer rounded-xl bg-[#003b5c] px-4 py-3 text-center text-sm font-bold text-white">
        انتخاب {multiple ? "چند تصویر" : "تصویر"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            const picked = Array.from(e.target.files || []);
            if (validate(picked)) onChange(picked);
            e.currentTarget.value = "";
          }}
        />
      </label>
      {selected.length > 0 && (
        <div className="mt-3 space-y-1 text-xs text-green-700">
          {selected.map((item, index) => (
            <p key={`${item.name}-${index}`} className="truncate">
              ✓ {item.name}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
