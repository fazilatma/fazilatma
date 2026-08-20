const fs = require('fs');

const phpCode = `<?php
// OptiBid - Single File PHP Application
$page = isset($_GET['page']) ? $_GET['page'] : 'home';
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OptiBid - بزرگترین پلتفرم خرید و فروش ایران</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v32.103/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
    <style>
        body { font-family: 'Vazirmatn', sans-serif; background-color: #f8fcfb; }
        .tab-content { display: none; }
        .tab-content.active { display: block; animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 10px 40px rgba(0,0,0,0.08); transition: all 0.3s ease; }
        .animate-pulse-fast { animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .peer:focus ~ label, .peer:not(:placeholder-shown) ~ label { top: -0.625rem; font-size: 0.75rem; color: #00a8e8; background: white; }
    </style>
</head>
<body class="text-gray-900 antialiased min-h-screen flex flex-col">

    <!-- ================= HEADER ================= -->
    <header class="bg-white shadow-md sticky top-0 z-50">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" dir="rtl">
        <div class="flex justify-between items-center h-16">
          <a href="?page=home" class="flex items-center gap-2">
            <div class="flex items-center">
              <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
                <path d="M40 20 C20 20 15 35 15 50 C15 65 20 80 40 80 C60 80 65 65 65 50" stroke="url(#blueGrad)" stroke-width="16" stroke-linecap="round" />
                <path d="M45 50 C45 50 60 50 70 50 C80 50 85 60 85 65 C85 75 75 80 60 80 L45 80" stroke="#003b5c" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M60 50 L85 20 M85 20 L65 20 M85 20 L85 40" stroke="#00a8e8" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
                <defs>
                  <linearGradient id="blueGrad" x1="15" y1="20" x2="65" y2="80" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#003b5c" /><stop offset="1" stop-color="#00a8e8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div class="text-2xl font-bold text-[#003b5c] tracking-tight">Opti<span class="text-[#00a8e8]">Bid</span></div>
          </a>
          <div class="hidden md:flex items-center space-x-6 space-x-reverse">
            <a href="#" class="text-gray-700 hover:text-green-600 transition">محصولات</a>
            <a href="#" class="text-gray-700 hover:text-green-600 transition">درخواست‌های خرید</a>
            <a href="?page=buyer-dashboard" class="text-[#003b5c] font-bold bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition flex items-center gap-2"><span>👤</span> داشبورد خریدار</a>
            <a href="?page=seller-dashboard" class="text-gray-700 hover:text-green-600 transition flex items-center gap-2"><span>💼</span> داشبورد فروشنده</a>
          </div>
          <div class="hidden md:flex items-center space-x-3 space-x-reverse">
            <a href="?page=request-purchase" class="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg transition font-bold text-sm">ثبت درخواست خرید</a>
          </div>
        </div>
      </nav>
    </header>

    <main class="flex-grow">
        <?php if($page === 'home'): ?>
        <!-- ================= HOME PAGE ================= -->
        <section class="bg-gradient-to-l from-[#003b5c] to-[#005e94] text-white py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 class="text-4xl md:text-5xl font-bold mb-6">پلتفرم درخواست خرید و تامین کالا</h1>
                <p class="text-xl md:text-2xl mb-8 text-blue-100">درخواست خرید خود را ثبت کنید، از تامین‌کنندگان معتبر پیشنهاد قیمت دریافت کنید و با پرداخت امن امانی خرید کنید</p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                    <a href="?page=request-purchase" class="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl text-lg font-bold transition shadow-lg">📝 ثبت درخواست خرید رایگان</a>
                    <a href="?page=seller-dashboard" class="bg-[#00a8e8] hover:bg-blue-500 text-white px-8 py-4 rounded-xl text-lg font-bold transition shadow-lg">💼 ورود به پنل فروشنده</a>
                </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-7xl mx-auto px-4">
                <div class="text-center"><div class="text-3xl md:text-4xl font-bold">۱۵۶</div><div class="text-blue-200 mt-2">درخواست خرید ثبت شده</div></div>
                <div class="text-center"><div class="text-3xl md:text-4xl font-bold">۳۲۰</div><div class="text-blue-200 mt-2">تامین‌کننده فعال</div></div>
                <div class="text-center"><div class="text-3xl md:text-4xl font-bold">۱,۲۴۵,۰۰۰,۰۰۰</div><div class="text-blue-200 mt-2">تومان تراکنش امن</div></div>
                <div class="text-center"><div class="text-3xl md:text-4xl font-bold">۱۰۰٪</div><div class="text-blue-200 mt-2">معاملات موفق</div></div>
            </div>
        </section>

        <?php elseif($page === 'request-purchase'): ?>
        <!-- ================= REQUEST PURCHASE ================= -->
        <div class="max-w-4xl mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">ثبت درخواست خرید</h1>
            <p class="text-gray-600 mb-8">درخواست خرید خود را ثبت کنید تا فروشندگان مرتبط به شما پیشنهاد دهند</p>
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                <h3 class="font-bold text-blue-800 mb-2">چگونه کار می‌کند؟</h3>
                <ol class="list-decimal list-inside space-y-2 text-blue-700 text-sm mr-4">
                    <li>درخواست خرید خود را با جزئیات ثبت می‌کنید</li>
                    <li>درخواست برای فروشندگان دسته‌بندی مرتبط ارسال می‌شود</li>
                    <li>فروشندگان پیشنهاد قیمت و زمان ارسال می‌دهند</li>
                    <li>شما بهترین پیشنهاد را انتخاب می‌کنید</li>
                    <li>پرداخت امن انجام می‌دهید (وجه نزد پلتفرم امانت می‌ماند)</li>
                    <li>پس از تحویل کالا، پرداخت به فروشنده انجام می‌شود</li>
                </ol>
            </div>
            <form class="space-y-6" onsubmit="event.preventDefault(); alert('ثبت شد! (در دمو)'); window.location.href='?page=buyer-dashboard';">
                <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h2 class="text-xl font-bold mb-4">عنوان درخواست</h2>
                    <input type="text" placeholder="مثال: خرید ۵ عدد لپ‌تاپ..." class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#00a8e8]">
                </div>
                <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h2 class="text-xl font-bold mb-4">بودجه مورد نظر</h2>
                    <div class="relative mb-4">
                        <input type="text" id="budgetInput" oninput="formatNumber(this)" placeholder="مثال: ۱۰,۰۰۰,۰۰۰" class="w-full border border-gray-300 rounded-lg px-4 py-3 pl-20 outline-none focus:border-[#00a8e8]">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">تومان</span>
                    </div>
                </div>
                <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h2 class="text-xl font-bold mb-4">پیوست‌ها (اختیاری)</h2>
                    <div class="border-2 border-dashed border-[#00a8e8]/50 bg-blue-50/50 hover:bg-blue-50 rounded-lg p-8 text-center transition relative">
                        <input type="file" multiple accept="image/*" onchange="previewImages(this)" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="کلیک کنید">
                        <div class="text-[#00a8e8] text-4xl mb-4">📥</div>
                        <p class="text-[#003b5c] font-bold mb-2">برای آپلود کلیک کنید یا فایل‌ها را اینجا بکشید</p>
                        <button type="button" class="mt-2 bg-[#003b5c] text-white px-6 py-2 rounded-lg font-bold relative z-10 pointer-events-none">انتخاب فایل / تصاویر</button>
                    </div>
                    <div id="imagePreviewContainer" class="flex gap-4 mt-6 overflow-x-auto"></div>
                </div>
                <button type="submit" class="bg-[#0b9c56] text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 w-full">ثبت درخواست خرید</button>
            </form>
        </div>

        <?php elseif($page === 'buyer-dashboard'): ?>
        <!-- ================= BUYER DASHBOARD ================= -->
        <div class="bg-[#f4f7f9] pb-24">
            <div class="bg-white border-b border-gray-200 py-3 px-4 shadow-sm mb-8 flex justify-between items-center max-w-7xl mx-auto">
                <div class="text-gray-500 font-medium text-sm flex gap-2"><span>پروفایل خریدار</span> / <span class="font-bold text-[#003b5c]">داشبورد</span></div>
            </div>
            
            <div class="max-w-6xl mx-auto px-4">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center"><div class="text-3xl font-bold text-[#003b5c] mb-1">۲</div><div class="text-gray-500 text-sm flex items-center gap-2"><span class="text-xl">📦</span> کل سفارش‌ها</div></div>
                    <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center border-b-4 border-red-500"><div class="text-3xl font-bold text-red-600 mb-1">۱</div><div class="text-gray-500 text-sm flex items-center gap-2"><span class="text-xl">💳</span> در انتظار پرداخت</div></div>
                    <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center"><div class="text-3xl font-bold text-[#003b5c] mb-1">۳</div><div class="text-gray-500 text-sm flex items-center gap-2"><span class="text-xl">🧾</span> فاکتورها</div></div>
                    <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center border-b-4 border-[#00a8e8]"><div class="text-xl font-bold text-[#00a8e8] mb-1">۱۵۴,۹۳۰,۰۰۰</div><div class="text-gray-500 text-sm flex items-center gap-2"><span class="text-xl">💰</span> کیف پول</div></div>
                </div>

                <div class="bg-gradient-to-r from-[#003b5c] to-[#005e94] rounded-2xl p-5 mb-6 shadow-md text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg animate-pulse-fast">!</div>
                        <div>
                            <h3 class="font-bold text-lg mb-1">شما سفارش در انتظار پرداخت دارید</h3>
                            <p class="text-blue-100 text-sm">لطفاً برای جلوگیری از لغو سفارش، مبلغ را در سیستم امانی OptiBid پرداخت کنید.</p>
                        </div>
                    </div>
                    <button onclick="switchTab('orders', document.getElementById('tab-orders'))" class="bg-[#00a8e8] hover:bg-blue-400 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg">مشاهده و پرداخت</button>
                </div>

                <!-- NAV PILLS (EXACTLY AS SCREENSHOT) -->
                <div class="flex flex-col items-center gap-3 mb-10 border border-gray-200 bg-white/70 backdrop-blur-md rounded-[2rem] py-4 px-2 shadow-sm">
                    <div class="flex flex-wrap justify-center gap-2">
                        <button id="tab-overview" onclick="switchTab('overview', this)" class="tab-btn active-tab px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border bg-[#003b5c] text-white border-[#003b5c]"><span>🏠</span> پیشخوان</button>
                        <button id="tab-orders" onclick="switchTab('orders', this)" class="tab-btn px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border bg-white text-gray-600 border-gray-200"><span>📦</span> سفارش‌ها <span class="bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span></button>
                        <button onclick="switchTab('invoices', this)" class="tab-btn px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border bg-white text-gray-600 border-gray-200"><span>🧾</span> فاکتورها</button>
                        <button onclick="switchTab('requests', this)" class="tab-btn px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border bg-white text-gray-600 border-gray-200"><span>📝</span> درخواست‌ها</button>
                        <button onclick="switchTab('offers', this)" class="tab-btn px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border bg-white text-gray-600 border-gray-200"><span>🎯</span> پیشنهادها</button>
                    </div>
                    <div class="flex flex-wrap justify-center gap-2">
                        <button onclick="switchTab('profile', this)" class="tab-btn px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border bg-white text-gray-600 border-gray-200"><span>👤</span> پروفایل</button>
                        <button onclick="switchTab('settings', this)" class="tab-btn px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border bg-white text-gray-600 border-gray-200"><span>⚙️</span> تنظیمات</button>
                    </div>
                </div>

                <!-- OVERVIEW TAB -->
                <div id="overview" class="tab-content active">
                    <div class="bg-gradient-to-tr from-[#003b5c] to-[#005e94] rounded-3xl p-8 mb-8 shadow-lg text-white text-center relative overflow-hidden">
                        <p class="text-blue-100 font-medium mb-2 relative z-10">موجودی کیف پول شما در OptiBid</p>
                        <h2 class="text-4xl md:text-6xl font-bold mb-8 relative z-10 font-mono tracking-tight text-[#00a8e8]">
                            <span class="text-white">۱۵۴,۹۳۰,۰۰۰</span> <span class="text-2xl font-sans text-blue-200">تومان</span>
                        </h2>
                        <button class="bg-white text-[#003b5c] px-6 py-3 rounded-xl font-bold shadow-md relative z-10">+ افزایش موجودی</button>
                    </div>
                </div>

                <!-- REQUESTS TAB (Nested Offers) -->
                <div id="requests" class="tab-content max-w-4xl mx-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-[#003b5c]">درخواست‌های من</h2>
                        <a href="?page=request-purchase" class="bg-[#00a8e8] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-500 shadow-sm">+ درخواست جدید</a>
                    </div>
                    <div class="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm relative transition hover:shadow-md">
                        <div class="absolute top-6 left-6 bg-[#fff4e5] text-[#d97706] px-4 py-1.5 rounded-full text-xs font-bold border border-orange-200">در انتظار پیشنهاد</div>
                        <h3 class="text-xl font-bold text-[#003b5c] mb-2">آیفون 15 پرو مکس</h3>
                        <p class="text-sm text-gray-600 mb-4 border-r-2 border-[#00a8e8] pr-3">موبایل • بودجه: ۶۵,۰۰۰,۰۰۰ تومان • تهران<br>رنگ تیتانیوم مشکی، رجیستر شده، آکبند</p>
                        <button onclick="document.getElementById('nestedOffers1').classList.toggle('hidden')" class="bg-[#f0f9ff] text-[#00a8e8] border border-[#00a8e8]/30 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
                            مشاهده و انتخاب پیشنهادها (۱)
                        </button>

                        <div id="nestedOffers1" class="hidden bg-[#f8fcfb] border border-[#00a8e8]/20 rounded-2xl p-5 mt-4 shadow-inner">
                            <div class="flex justify-between border-b pb-2 mb-4"><h4 class="font-bold text-[#003b5c] text-sm">پیشنهادهای دریافت‌شده برای این درخواست</h4></div>
                            <div class="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div class="w-full text-right">
                                    <div class="font-bold text-gray-900 mb-1">فروشنده دمو <span class="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">تایید شده</span></div>
                                    <div class="font-bold text-[#00a8e8] text-xl mb-2 font-mono">۶۴,۵۰۰,۰۰۰ تومان</div>
                                    <div class="text-xs text-gray-500">🚚 تحویل: ۱ تا ۲ روز کاری</div>
                                </div>
                                <div class="w-full md:w-auto flex flex-row md:flex-col gap-2 shrink-0">
                                    <button onclick="switchTab('orders', document.getElementById('tab-orders')); alert('سفارش به مرحله پرداخت منتقل شد')" class="bg-[#003b5c] text-white px-6 py-2.5 rounded-lg text-sm font-bold w-full">انتخاب و پرداخت</button>
                                    <button class="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-bold w-full">گفتگو</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SETTINGS TAB (Exact Match) -->
                <div id="settings" class="tab-content max-w-4xl mx-auto">
                    <div class="bg-white rounded-[2rem] p-8 sm:p-10 shadow-sm border border-gray-200">
                        <h2 class="text-xl font-bold text-gray-900 text-[#003b5c] border-b pb-4 mb-8">تنظیمات حساب خریدار</h2>
                        
                        <div class="space-y-8">
                            <!-- Basic Info -->
                            <div>
                                <h3 class="font-bold text-gray-800 mb-4 text-sm text-right">اطلاعات پروفایل عمومی (درباره خریدار)</h3>
                                <div class="grid md:grid-cols-2 gap-6 mb-4">
                                    <div class="relative">
                                        <select class="peer w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-[#0b9c56]">
                                            <option>خریدار سازمانی و عمده</option>
                                            <option>خریدار شخصی (مصرف‌کننده)</option>
                                        </select>
                                        <label class="absolute right-4 -top-2.5 bg-white px-1 text-xs text-gray-400">نوع خریدار</label>
                                    </div>
                                    <div class="relative">
                                        <input type="text" value="تهران" class="peer w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none">
                                        <label class="absolute right-4 -top-2.5 bg-gray-50 px-1 text-xs text-gray-400">شهر</label>
                                    </div>
                                </div>
                                <div class="relative">
                                    <textarea class="peer w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-right min-h-[100px] focus:border-[#0b9c56]">شرکت فناوری اطلاعات؛ خریدار عمده تجهیزات کامپیوتری و لپ‌تاپ.</textarea>
                                    <label class="absolute right-4 -top-2.5 bg-white px-1 text-xs font-bold text-[#0b9c56]">درباره خریدار (Bio)</label>
                                </div>
                            </div>

                            <div class="border-t border-gray-100"></div>

                            <!-- Notifications (RTL aligned) -->
                            <div>
                                <h3 class="font-bold text-gray-800 mb-4 text-sm border-b border-gray-100 pb-2">اعلان‌ها</h3>
                                <div class="space-y-3">
                                    <label class="flex items-center gap-3 cursor-pointer w-fit"><input type="checkbox" checked class="w-5 h-5 text-[#00a8e8] rounded border-gray-300"><span class="text-sm font-medium">ایمیل</span></label>
                                    <label class="flex items-center gap-3 cursor-pointer w-fit"><input type="checkbox" class="w-5 h-5 text-[#00a8e8] rounded border-gray-300"><span class="text-sm font-medium">پیامک</span></label>
                                </div>
                            </div>

                            <!-- Categories Grid -->
                            <div>
                                <h3 class="font-bold text-gray-800 mb-4 text-sm border-b border-gray-100 pb-2">دسته‌های مورد علاقه برای اعلان محصولات جدید</h3>
                                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <?php 
                                    $cats = ['موبایل', 'لپ‌تاپ', 'کنسول بازی', 'لوازم الکترونیکی', 'پوشاک', 'خانه و آشپزخانه', 'خودرو و موتور', 'کتاب و لوازم تحریر', 'سلامت و زیبایی', 'ورزش و سفر'];
                                    foreach($cats as $i => $cat): ?>
                                    <label class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition <?= $i < 2 ? 'bg-[#f0f9ff] border border-[#00a8e8]/30' : 'bg-[#f8f9fa] border border-gray-200' ?>">
                                        <input type="checkbox" <?= $i < 2 ? 'checked' : '' ?> class="w-4 h-4 text-[#00a8e8] rounded border-gray-300">
                                        <span class="text-sm font-medium"><?= $cat ?></span>
                                    </label>
                                    <?php endforeach; ?>
                                </div>
                            </div>

                            <div class="pt-6 border-t border-gray-100 flex justify-end">
                                <button onclick="alert('تنظیمات ذخیره شد')" class="bg-[#003b5c] text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-gray-800">ذخیره تنظیمات</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ORDERS TAB -->
                <div id="orders" class="tab-content max-w-4xl mx-auto">
                    <h2 class="text-2xl font-bold text-[#003b5c] mb-6">سفارش‌های در جریان</h2>
                    <div class="bg-white border-2 border-red-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                        <div>
                            <div class="flex gap-2 mb-2">
                                <span class="text-xs px-3 py-1 rounded-full font-bold bg-red-100 text-red-700">در انتظار پرداخت</span>
                                <span class="font-mono text-xs bg-gray-100 px-2 py-1 rounded">ORD-9023</span>
                            </div>
                            <h3 class="font-bold text-lg mb-1">آیفون 15 پرو مکس</h3>
                            <p class="text-sm text-gray-500">فروشنده: فروشنده دمو</p>
                        </div>
                        <div class="flex flex-col justify-between md:items-end">
                            <div class="font-bold text-xl text-[#0b9c56] mb-4 font-mono">۶۴,۵۰۰,۰۰۰ تومان</div>
                            <button class="bg-red-500 text-white text-sm px-6 py-2.5 rounded-xl font-bold shadow-md w-full">پرداخت امن و نهایی کردن سفارش</button>
                        </div>
                    </div>
                </div>
                
                <!-- INVOICES TAB -->
                <div id="invoices" class="tab-content max-w-4xl mx-auto">
                    <h2 class="text-2xl font-bold text-[#003b5c] mb-6">فاکتورهای رسمی شما</h2>
                    <div class="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                        <table class="w-full text-right text-sm">
                            <thead class="bg-gray-50 border-b"><tr><th class="p-4">شماره فاکتور</th><th class="p-4">شرح کالا</th><th class="p-4">مبلغ کل</th><th class="p-4">عملیات</th></tr></thead>
                            <tbody class="divide-y divide-gray-100">
                                <tr>
                                    <td class="p-4 font-mono font-bold">INV-8821</td>
                                    <td class="p-4">لپ‌تاپ استوک ThinkPad</td>
                                    <td class="p-4 font-bold text-[#0b9c56]">۱۴۰,۰۰۰,۰۰۰</td>
                                    <td class="p-4"><button onclick="generateInvoice()" class="text-[#00a8e8] bg-blue-50 px-3 py-1.5 rounded-lg font-bold">چاپ فاکتور 🖨️</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- OFFERS (Guest Mode Demo) -->
                <div id="offers" class="tab-content max-w-3xl mx-auto text-center">
                    <div class="w-16 h-16 bg-[#00a8e8]/10 text-[#00a8e8] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">📱</div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-6">پیشنهادهای عمومی</h2>
                    
                    <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 text-right">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-lg">فروشگاه دمو</h3>
                            <div class="text-2xl font-bold text-[#0b9c56] font-mono">۶۴,۵۰۰,۰۰۰ تومان</div>
                        </div>
                        <div class="mt-4 pt-4 border-t border-gray-100">
                            <div class="bg-gray-50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-gray-200">
                                <div class="flex items-center gap-3">
                                    <span class="text-2xl opacity-70">🔒</span>
                                    <div>
                                        <h4 class="font-bold text-sm text-gray-800">برای اعلام نظر یا گفت‌وگو وارد شوید</h4>
                                        <p class="text-xs text-gray-500 mt-1">شما برای پاسخ به این پیشنهاد باید وارد حساب کاربری خود شوید.</p>
                                    </div>
                                </div>
                                <a href="?page=home" class="bg-[#003b5c] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md">ورود به حساب</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <?php elseif($page === 'seller-dashboard'): ?>
        <!-- 💼 SELLER DASHBOARD (Live Radar Demo) -->
        <div class="max-w-6xl mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold text-[#003b5c] mb-6">داشبورد تامین‌کننده</h1>
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center py-20">
                <p class="text-gray-500 mb-4">۳ ثانیه صبر کنید تا رادار زنده (Live Request) فعال شود...</p>
                <div class="animate-spin w-8 h-8 border-4 border-[#00a8e8] border-t-transparent rounded-full mx-auto"></div>
            </div>

            <!-- پاپ‌آپ رادار زنده -->
            <div id="liveRadar" class="fixed inset-0 z-50 bg-black/70 hidden items-center justify-center p-4">
                <div class="bg-white w-full max-w-md rounded-3xl p-6 border-4 border-[#0b9c56] relative overflow-hidden" id="radarModal">
                    <div class="absolute -top-10 -right-10 w-32 h-32 bg-green-500/20 rounded-full animate-ping"></div>
                    <div class="flex justify-between items-center mb-4">
                        <div class="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse-fast">درخواست فوری جدید</div>
                        <div id="radarTimer" class="text-2xl font-bold font-mono text-red-600 animate-bounce">60</div>
                    </div>
                    <h3 class="text-xl font-bold mb-4">خرید فوری ۲۰ عدد هارد SSD یک ترابایت</h3>
                    <div class="bg-gray-50 p-4 rounded-xl mb-6 text-sm">
                        <div class="flex justify-between mb-2"><span class="text-gray-500">خریدار:</span><span class="font-bold">شرکت داده‌پردازان</span></div>
                        <div class="flex justify-between border-t pt-2"><span class="text-gray-500">بودجه:</span><span class="font-bold text-green-600">۵۰,۰۰۰,۰۰۰ تومان</span></div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="document.getElementById('liveRadar').classList.replace('flex', 'hidden')" class="flex-1 bg-gray-100 py-3 rounded-xl font-bold">رد کردن</button>
                        <button onclick="alert('شما وارد رقابت شدید!'); document.getElementById('liveRadar').classList.replace('flex', 'hidden')" class="flex-[2] bg-[#0b9c56] text-white py-3 rounded-xl font-bold shadow-lg">⚡ پیشنهاد قیمت فوری</button>
                    </div>
                </div>
            </div>
            <script>
                setTimeout(() => {
                    document.getElementById('liveRadar').classList.replace('hidden', 'flex');
                    let time = 60;
                    const timer = setInterval(() => {
                        time--; document.getElementById('radarTimer').innerText = time;
                        if(time <= 0) { clearInterval(timer); document.getElementById('liveRadar').classList.replace('flex', 'hidden'); }
                    }, 1000);
                }, 3000);
            </script>
        </div>

        <?php elseif($page === 'admin-dashboard'): ?>
        <!-- 👑 ADMIN DASHBOARD -->
        <div class="max-w-6xl mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold text-[#003b5c] mb-8">پنل مدیریت پلتفرم (ادمین)</h1>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-white p-5 rounded-xl border border-gray-200 border-r-4 border-r-purple-600"><p class="text-xs text-gray-500">درآمد کمیسیون</p><p class="text-xl font-bold">۶۲,۲۵۰,۰۰۰</p></div>
                <div class="bg-white p-5 rounded-xl border border-gray-200 border-r-4 border-r-purple-600"><p class="text-xs text-gray-500">امانات Escrow</p><p class="text-xl font-bold">۲۸۰,۰۰۰,۰۰۰</p></div>
            </div>
            <div class="bg-white rounded-xl p-6 border border-gray-200">
                <h2 class="font-bold text-lg mb-4">تنظیمات مالی</h2>
                <div class="flex items-center gap-4">
                    <input type="number" value="5" class="border p-2 rounded-lg w-20 text-center font-bold outline-none"> <span class="font-bold">% نرخ کمیسیون</span>
                    <button class="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700">ذخیره نرخ جدید</button>
                </div>
            </div>
        </div>
        <?php endif; ?>
    </main>

    <!-- ================= FOOTER ================= -->
    <footer class="bg-gray-900 text-white mt-12 py-10 text-center border-t-4 border-[#00a8e8]">
        <h2 class="text-2xl font-bold mb-2 flex justify-center items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
                <path d="M40 20 C20 20 15 35 15 50 C15 65 20 80 40 80 C60 80 65 65 65 50" stroke="#00a8e8" stroke-width="16" stroke-linecap="round"/>
                <path d="M45 50 C45 50 60 50 70 50 C80 50 85 60 85 65 C85 75 75 80 60 80 L45 80" stroke="#ffffff" stroke-width="16" stroke-linecap="round"/>
            </svg>
            OptiBid
        </h2>
        <p class="text-gray-400 text-sm">تولید شده به عنوان نسخه Single-File PHP شامل UI اصلی پروژه</p>
    </footer>

    <!-- ================= SCRIPTS ================= -->
    <script>
        function switchTab(tabId, btn) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            
            document.querySelectorAll('.tab-btn').forEach(el => {
                el.classList.remove('bg-[#003b5c]', 'text-white', 'border-[#003b5c]');
                el.classList.add('bg-white', 'text-gray-700', 'border-gray-200');
            });
            btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-200');
            btn.classList.add('bg-[#003b5c]', 'text-white', 'border-[#003b5c]');
        }

        function toggleOffers() {
            document.getElementById('nestedOffers').classList.toggle('hidden');
        }

        function formatNumber(input) {
            let val = input.value.replace(/\D/g, "");
            input.value = val ? Number(val).toLocaleString('en-US') : "";
        }

        function previewImages(input) {
            const container = document.getElementById('imagePreviewContainer');
            container.innerHTML = "";
            Array.from(input.files).forEach(file => {
                if(file.type.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.src = URL.createObjectURL(file);
                    img.className = "w-20 h-20 object-cover rounded-lg shadow-sm border border-gray-200";
                    container.appendChild(img);
                }
            });
        }

        function generateInvoice() {
            const html = `
                <html dir="rtl" lang="fa">
                <head>
                    <title>فاکتور رسمی OptiBid</title>
                    <style>
                        body { font-family: Tahoma, Arial; padding: 40px; color: #333; }
                        .header { text-align: center; border-bottom: 2px solid #00a8e8; padding-bottom: 20px; margin-bottom: 30px; }
                        .header h1 { color: #003b5c; margin: 0; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
                        th { background-color: #003b5c; color: white; }
                        .total { text-align: left; font-size: 1.5em; font-weight: bold; color: #0b9c56; }
                    </style>
                </head>
                <body>
                    <div class="header"><h1>فاکتور رسمی OptiBid</h1><p>شماره سند: Q-2024-05678</p></div>
                    <table><tr><th>نام کالا</th><th>تعداد</th><th>قیمت کل</th></tr><tr><td>آیفون 15 پرو مکس</td><td>۱</td><td>64,500,000</td></tr></table>
                    <div class="total">مبلغ پرداخت شده: 64,500,000 ریال/تومان</div>
                    <script>window.onload = function() { window.print(); }<\/script>
                </body>
                </html>
            `;
            const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
            window.open(URL.createObjectURL(blob), '_blank');
        }
    </script>
</body>
</html>
`;

fs.writeFileSync('public/index.php', phpCode);
console.log('index.php generated successfully.');
