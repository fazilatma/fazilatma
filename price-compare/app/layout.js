import "./globals.css";

export const metadata = {
  title: "قیمت‌یار — مقایسه‌ی هوشمند قیمت با AI",
  description: "مقایسه‌ی قیمت محصولات در فروشگاه‌های آنلاین با تحلیل و پیشنهاد هوش مصنوعی",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
