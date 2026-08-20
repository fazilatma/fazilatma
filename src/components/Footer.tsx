import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M40 20 C20 20 15 35 15 50 C15 65 20 80 40 80 C60 80 65 65 65 50" stroke="#00a8e8" strokeWidth="16" strokeLinecap="round" />
                <path d="M45 50 C45 50 60 50 70 50 C80 50 85 60 85 65 C85 75 75 80 60 80 L45 80" stroke="#ffffff" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M60 50 L85 20 M85 20 L65 20 M85 20 L85 40" stroke="#00a8e8" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              OptiBid
            </h3>
            <p className="text-gray-400 text-sm">
              بزرگترین پلتفرم تامین و درخواست خرید ایران. خرید و فروش امن با بهترین قیمت و کیفیت.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">دسترسی سریع</h4>
            <ul className="space-y-2 space-y-reverse text-gray-400">
              <li><Link href="/products" className="hover:text-green-400 transition">محصولات</Link></li>
              <li><Link href="/requests" className="hover:text-green-400 transition">درخواست‌های خرید</Link></li>
              <li><Link href="/sellers" className="hover:text-green-400 transition">فروشندگان</Link></li>
              <li><Link href="/buyers" className="hover:text-green-400 transition">خریداران برتر</Link></li>
              <li><Link href="/categories" className="hover:text-green-400 transition">دسته‌بندی‌ها</Link></li>
              <li><Link href="/become-seller" className="hover:text-green-400 transition">شروع فروشندگی</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold mb-4">پشتیبانی</h4>
            <ul className="space-y-2 space-y-reverse text-gray-400">
              <li><Link href="/help" className="hover:text-green-400 transition">مرکز راهنما</Link></li>
              <li><Link href="/contact" className="hover:text-green-400 transition">تماس با ما</Link></li>
              <li><Link href="/rules" className="hover:text-green-400 transition">قوانین و مقررات</Link></li>
              <li><Link href="/faq" className="hover:text-green-400 transition">سوالات متداول</Link></li>
              <li><Link href="/returns" className="hover:text-green-400 transition">رویه بازگشت کالا</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4">تماس با ما</h4>
            <ul className="space-y-2 space-y-reverse text-gray-400 text-sm">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                info@parscoders.ir
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                ۰۲۱-۱۲۳۴۵۶۷۸
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                دزفول، خیابان ولیعصر
              </li>
              <li className="text-gray-500 mt-2">ساعات کاری: شنبه تا چهارشنبه ۹ تا ۱۷</li>
            </ul>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <h4 className="font-bold mb-4 text-center">روش‌های پرداخت</h4>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white rounded-lg px-4 py-2 text-gray-700 text-sm font-bold">💳 کارت به کارت</div>
            <div className="bg-white rounded-lg px-4 py-2 text-gray-700 text-sm font-bold">🏦 درگاه بانکی</div>
            <div className="bg-white rounded-lg px-4 py-2 text-gray-700 text-sm font-bold">💰 پرداخت در محل</div>
            <div className="bg-white rounded-lg px-4 py-2 text-gray-700 text-sm font-bold">📱 کیف پول</div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>© ۱۴۰۳ OptiBid - تمامی حقوق محفوظ است.</p>
        </div>
      </div>
    </footer>
  );
}
