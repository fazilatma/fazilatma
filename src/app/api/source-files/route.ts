import { NextResponse } from "next/server";
import { readProjectFile } from "@/lib/project-source";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // لیست فایل‌های کلیدی پروژه (فرانت‌اند و بک‌اند)
    const fileEntries = [
      {
        path: "src/db/schema.ts",
        title: "۱. ساختار دیتابیس و جداول (Backend & Database Schema)",
        category: "Backend (پایگاه داده)",
        description: "جدول‌های کاربران، دسته‌بندی‌ها، محصولات، درخواست‌های خرید، پیشنهادها، سفارشات، تراکنش‌های امانی (Escrow) و پیام‌ها"
      },
      {
        path: "src/app/admin/dashboard/page.tsx",
        title: "۱.۵. داشبورد مدیریت کل پلتفرم (Admin Dashboard)",
        category: "Backend (پایگاه داده)",
        description: "مدیریت تراکنش‌های امانی، تنظیم درصد کمیسیون سیستم و احراز هویت کاربران"
      },
      {
        path: "src/db/index.ts",
        title: "۲. اتصال به دیتابیس PostgreSQL",
        category: "Backend (پایگاه داده)",
        description: "تنظیم اتصال دیتابیس با Drizzle ORM"
      },
      {
        path: "src/app/page.tsx",
        title: "۳. صفحه اصلی (Home Page)",
        category: "Frontend (صفحات اصلی)",
        description: "صفحه اصلی مارکت‌پلیس شامل جستجوی کالا، دسته‌بندی‌ها، محصولات تخفیف‌دار و آخرین درخواست‌های خرید"
      },
      {
        path: "src/app/request-purchase/page.tsx",
        title: "۴. صفحه ثبت درخواست خرید (Purchase Request Form)",
        category: "Frontend (درخواست خرید و پرداخت امانی)",
        description: "فرم ثبت درخواست کالا توسط خریدار با بودجه و مهلت، متصل به سیستم امانت‌داری وجه"
      },
      {
        path: "src/app/requests/page.tsx",
        title: "۵. صفحه لیست درخواست‌های خرید (Requests List)",
        category: "Frontend (درخواست خرید و پرداخت امانی)",
        description: "لیست درخواست‌های باز خریداران جهت مشاهده و ارسال پیشنهاد قیمت توسط فروشندگان مرتبط"
      },
      {
        path: "src/app/requests/[id]/page.tsx",
        title: "۶. صفحه جزئیات درخواست و انتخاب پیشنهاد فروشنده",
        category: "Frontend (درخواست خرید و پرداخت امانی)",
        description: "جزئیات درخواست خرید، مقایسه پیشنهادهای فروشندگان، مذاکره و دکمه پرداخت امن"
      },
      {
        path: "src/app/requests/[id]/checkout/page.tsx",
        title: "۷. صفحه پرداخت امن و امانی (Escrow Checkout)",
        category: "Frontend (درخواست خرید و پرداخت امانی)",
        description: "صفحه صورت‌حساب، تاییدیه قوانین امانت‌داری وجه و انتخاب درگاه پرداخت"
      },
      {
        path: "src/app/buyer/dashboard/page.tsx",
        title: "۸. داشبورد اختصاصی خریدار (Buyer Dashboard)",
        category: "Frontend (خریداران)",
        description: "پنل حرفه‌ای خریدار شامل پیشخوان، سفارش‌ها، پیشنهادها، کیف پول و تولید فاکتور رسمی"
      },
      {
        path: "src/app/seller/dashboard/page.tsx",
        title: "۹. داشبورد اختصاصی فروشنده (Seller Dashboard)",
        category: "Frontend (فروشندگان)",
        description: "پنل فروشنده با رادار زنده (Live Request) اسنپ‌طوری، مدیریت دارایی‌ها و تنظیمات"
      },
      {
        path: "src/app/sellers/page.tsx",
        title: "۱۰. صفحه لیست فروشندگان (Sellers Directory)",
        category: "Frontend (فروشندگان)",
        description: "لیست فروشندگان معتبر پلتفرم به همراه امتیاز، آمار فروش و دسته‌بندی‌ها"
      },
      {
        path: "src/app/sellers/[id]/page.tsx",
        title: "۱۱. صفحه پروفایل عمومی فروشنده (Seller Profile)",
        category: "Frontend (فروشندگان)",
        description: "نمایش اطلاعات عمومی فروشنده، اقلام قابل تامین و نظرات خریداران"
      },
      {
        path: "src/app/buyers/page.tsx",
        title: "۱۲. صفحه لیست خریداران برتر (Buyers Directory)",
        category: "Frontend (خریداران)",
        description: "لیست خریداران معتبر، شرکت‌ها و سازمان‌های فعال در پلتفرم به همراه آمار خریدها"
      },
      {
        path: "src/app/buyers/[id]/page.tsx",
        title: "۱۳. صفحه پروفایل عمومی خریدار (Buyer Profile)",
        category: "Frontend (خریداران)",
        description: "پروفایل اختصاصی خریدار، آمار خوش‌حسابی و لیست درخواست‌های خرید باز او"
      },
      {
        path: "src/app/become-seller/page.tsx",
        title: "۱۴. صفحه فرم ثبت‌نام تامین‌کننده (Become a Seller)",
        category: "Frontend (فروشندگان)",
        description: "مزایای فروشندگی، شرایط و فرم ثبت‌نام تامین‌کننده با دریافت شماره شبا و احراز هویت"
      },
      {
        path: "src/app/login/page.tsx",
        title: "۱۵. صفحه ورود به حساب کاربری (Login Page)",
        category: "Frontend (احراز هویت)",
        description: "ورود ادمین، خریدار و فروشنده با سیستم نگهداری سشن (Local Storage)"
      },
      {
        path: "src/app/register/page.tsx",
        title: "۱۶. صفحه ثبت‌نام (Register Page)",
        category: "Frontend (احراز هویت)",
        description: "ثبت‌نام خریدار و فروشنده با انتقال خودکار پس از ثبت درخواست"
      },
      {
        path: "src/app/categories/page.tsx",
        title: "۱۷. صفحه لیست دسته‌بندی‌ها (Categories Page)",
        category: "Frontend (صفحات اصلی)",
        description: "دسته‌بندی‌های اصلی کالا با زیردسته‌ها و آمار درخواست‌ها"
      },
      {
        path: "src/app/categories/[id]/page.tsx",
        title: "۱۸. صفحه اختصاصی یک دسته‌بندی (Category Details)",
        category: "Frontend (صفحات اصلی)",
        description: "نمایش درخواست‌های خرید باز و برترین فروشندگان مرتبط با یک دسته‌بندی خاص"
      },
      {
        path: "src/app/how-it-works/page.tsx",
        title: "۱۹. صفحه راهنمای نحوه کار (How It Works)",
        category: "Frontend (صفحات اصلی)",
        description: "راهنمای کامل خرید و فروش با پرداخت امانی برای خریداران و فروشندگان"
      },
      {
        path: "src/utils/invoiceGenerator.ts",
        title: "۲۰. تولیدکننده فاکتور PDF (Invoice Generator)",
        category: "Components (کامپوننت‌های مشترک)",
        description: "فایل کمکی جاوااسکریپت برای تولید زنده فاکتور رسمی دوزبانه (با لوگو و QR) و قابلیت چاپ"
      },
      {
        path: "src/components/Header.tsx",
        title: "۲۱. کامپوننت هدر و منوی اصلی (Header Component)",
        category: "Components (کامپوننت‌های مشترک)",
        description: "منوی ناوبری هوشمند، نمایش دکمه خروج پس از لاگین و دکمه داشبوردها"
      },
      {
        path: "src/components/Footer.tsx",
        title: "۲۲. کامپوننت فوتر (Footer Component)",
        category: "Components (کامپوننت‌های مشترک)",
        description: "فوتر با اطلاعات پشتیبانی، نمادها و لینک‌های سریع"
      },
    ];

    const result = await Promise.all(
      fileEntries.map(async (file) => {
        // در Node از دیسک و در Cloudflare Workers از اسنپ‌شات build خوانده می‌شود.
        const content = (await readProjectFile(file.path)) ?? "// فایل یافت نشد";
        return {
          ...file,
          content,
        };
      })
    );

    return NextResponse.json({ files: result });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load source files" }, { status: 500 });
  }
}
