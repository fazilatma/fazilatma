<?php
$page = isset($_GET['page']) ? $_GET['page'] : 'home';
$topSellers = [
    ['id'=>1, 'name'=>'دیجی‌تک', 'type'=>'تجهیزات دیجیتال', 'rating'=>4.9, 'sales'=>2156, 'avatar'=>'https://i.pravatar.cc/150?img=1'],
    ['id'=>2, 'name'=>'فشن استایل', 'type'=>'پوشاک', 'rating'=>4.8, 'sales'=>3203, 'avatar'=>'https://i.pravatar.cc/150?img=5']
];
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OptiBid - پلتفرم خرید و فروش امن</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v32.103/Vazirmatn-font-face.css" rel="stylesheet" />
    <style>
        body { font-family: 'Vazirmatn', sans-serif; background-color: #f3f9f7; }
        .tab-content { display: none; }
        .tab-content.active { display: block; animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .peer:focus ~ label, .peer:not(:placeholder-shown) ~ label { top: -0.625rem; font-size: 0.75rem; color: #00a8e8; background: white; }
    </style>
</head>
<body class="text-gray-900 min-h-screen flex flex-col">

    <!-- HEADER -->
    <header class="bg-white shadow-md sticky top-0 z-50">
      <nav class="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
        <a href="?page=home" class="flex items-center gap-2">
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
                <path d="M40 20 C20 20 15 35 15 50 C15 65 20 80 40 80 C60 80 65 65 65 50" stroke="#003b5c" stroke-width="16" stroke-linecap="round" />
                <path d="M45 50 C45 50 60 50 70 50 C80 50 85 60 85 65 C85 75 75 80 60 80 L45 80" stroke="#00a8e8" stroke-width="16" stroke-linecap="round" />
            </svg>
            <div class="text-2xl font-bold text-[#003b5c]">Opti<span class="text-[#00a8e8]">Bid</span></div>
        </a>
        <div class="hidden md:flex gap-6 font-bold text-sm">
            <a href="?page=buyer-dashboard" class="text-[#003b5c] bg-blue-50 px-3 py-1.5 rounded-lg">👤 داشبورد خریدار</a>
            <a href="?page=seller-dashboard" class="text-gray-600 hover:text-green-600">💼 داشبورد فروشنده</a>
            <a href="?page=admin-dashboard" class="text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg">👑 پنل ادمین</a>
        </div>
        <div><a href="?page=request-purchase" class="bg-orange-500 text-white px-5 py-2.5 rounded-lg font-bold">ثبت درخواست خرید</a></div>
      </nav>
    </header>

    <main class="flex-grow pb-24">
        <?php if($page === 'home'): ?>
        <!-- HOME PAGE -->
        <div class="bg-gradient-to-l from-[#003b5c] to-[#005e94] text-white py-16 text-center">
            <h1 class="text-4xl font-bold mb-4">پلتفرم درخواست خرید و تامین کالا</h1>
            <p class="text-xl text-blue-100 mb-8">درخواست خرید ثبت کنید و پیشنهاد قیمت بگیرید</p>
            <a href="?page=buyer-dashboard" class="bg-white text-[#003b5c] px-8 py-3 rounded-xl font-bold">ورود به پنل</a>
        </div>

        <?php elseif($page === 'request-purchase'): ?>
        <!-- REQUEST PURCHASE -->
        <div class="max-w-4xl mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold text-[#003b5c] mb-6">ثبت درخواست خرید</h1>
            <form class="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm space-y-6" onsubmit="event.preventDefault(); alert('ثبت شد!'); window.location.href='?page=buyer-dashboard';">
                <div><label class="font-bold">عنوان درخواست</label><input type="text" class="w-full border rounded-xl p-3 mt-2 outline-none focus:border-[#00a8e8]" required></div>
                <div><label class="font-bold">بودجه (تومان)</label><input type="text" oninput="formatNumber(this)" class="w-full border rounded-xl p-3 mt-2 outline-none focus:border-[#00a8e8]" required></div>
                <div class="border-2 border-dashed border-[#00a8e8] bg-blue-50 text-center p-8 rounded-xl relative cursor-pointer">
                    <input type="file" multiple accept="image/*" onchange="previewImages(this)" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                    <div class="text-3xl mb-2">📥</div><p class="font-bold text-[#003b5c]">آپلود تصاویر کالا</p>
                </div>
                <div id="imagePreviewContainer" class="flex gap-4 overflow-x-auto"></div>
                <button type="submit" class="bg-[#0b9c56] text-white w-full py-4 rounded-xl font-bold">ثبت نهایی درخواست</button>
            </form>
        </div>

        <?php elseif($page === 'buyer-dashboard'): ?>
        <!-- BUYER DASHBOARD -->
        <div class="max-w-6xl mx-auto px-4 py-8">
            <div class="bg-[#0b9c56] rounded-2xl p-8 mb-8 text-white text-center shadow-md">
                <p class="text-green-100 mb-2">موجودی کیف پول</p>
                <h2 class="text-4xl font-bold">۱۵۴,۹۳۰,۰۰۰ تومان</h2>
            </div>
            
            <div class="flex flex-wrap justify-center gap-2 mb-10 bg-white/70 p-4 rounded-[2rem] border border-gray-200">
                <button onclick="switchTab('req', this)" class="tab-btn bg-[#003b5c] text-white px-5 py-2.5 rounded-full text-sm font-bold">📝 درخواست‌ها</button>
                <button onclick="switchTab('ord', this)" class="tab-btn bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-full text-sm font-bold">📦 سفارش‌ها <span class="bg-red-500 text-white rounded-full px-2">2</span></button>
                <button onclick="switchTab('inv', this)" class="tab-btn bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-full text-sm font-bold">🧾 فاکتورها</button>
                <button onclick="switchTab('set', this)" class="tab-btn bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-full text-sm font-bold">⚙️ تنظیمات</button>
            </div>

            <!-- REQUESTS & OFFERS -->
            <div id="req" class="tab-content active max-w-4xl mx-auto space-y-6">
                <div class="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                    <span class="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold mb-4 inline-block">در انتظار پیشنهاد</span>
                    <h3 class="text-xl font-bold text-[#003b5c] mb-2">آیفون 15 پرو مکس</h3>
                    <p class="text-sm text-gray-600 mb-4">بودجه: ۶۵,۰۰۰,۰۰۰ تومان • اهواز</p>
                    <button onclick="document.getElementById('offersBox').classList.toggle('hidden')" class="bg-[#f0f9ff] text-[#00a8e8] border border-[#00a8e8]/30 px-5 py-2.5 rounded-xl font-bold">مشاهده پیشنهادها (۱)</button>
                    
                    <div id="offersBox" class="hidden mt-4 bg-[#f8fcfb] p-5 rounded-2xl border border-[#00a8e8]/20">
                        <div class="font-bold text-sm text-[#003b5c] mb-4">پیشنهادهای دریافت‌شده</div>
                        <div class="bg-white border rounded-xl p-4 flex justify-between items-center">
                            <div><div class="font-bold">فروشنده دمو</div><div class="text-xl text-[#0b9c56] font-bold mt-1">۶۴,۵۰۰,۰۰۰ تومان</div></div>
                            <button onclick="switchTab('ord', document.querySelectorAll('.tab-btn')[1])" class="bg-[#003b5c] text-white px-6 py-2.5 rounded-xl font-bold">انتخاب و پرداخت</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ORDERS -->
            <div id="ord" class="tab-content max-w-4xl mx-auto">
                <div class="bg-white border-2 border-red-200 rounded-3xl p-6 shadow-sm flex justify-between items-center">
                    <div><span class="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-bold mb-2 inline-block">در انتظار پرداخت</span><h3 class="font-bold text-lg">آیفون 15 پرو مکس</h3></div>
                    <div class="text-left"><div class="font-bold text-xl text-[#0b9c56] mb-3">۶۴,۵۰۰,۰۰۰ تومان</div><button class="bg-red-500 text-white px-6 py-2 rounded-xl font-bold">پرداخت امن</button></div>
                </div>
            </div>

            <!-- INVOICES -->
            <div id="inv" class="tab-content max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border p-6">
                <table class="w-full text-right text-sm"><thead class="bg-gray-50"><tr><th class="p-4">شماره</th><th class="p-4">مبلغ</th><th class="p-4">عملیات</th></tr></thead>
                <tbody><tr><td class="p-4 font-mono font-bold">Q-2024</td><td class="p-4 text-green-600 font-bold">۶۴,۵۰۰,۰۰۰</td><td class="p-4"><button onclick="generateInvoice()" class="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg font-bold">چاپ فاکتور 🖨️</button></td></tr></tbody></table>
            </div>

            <!-- SETTINGS -->
            <div id="set" class="tab-content max-w-4xl mx-auto bg-white rounded-3xl p-8 border">
                <h2 class="text-xl font-bold text-[#0b9c56] mb-8">تنظیمات حساب خریدار</h2>
                <div class="relative mb-6"><input type="text" class="peer w-full bg-white border rounded-xl p-3 text-right outline-none focus:border-[#0b9c56]" placeholder="آدرس پیش‌فرض"><label class="absolute right-4 -top-2.5 bg-white px-1 text-xs text-gray-400 transition-all">آدرس پیش‌فرض ارسال</label></div>
                <h3 class="font-bold text-sm mb-4">دسته‌های مورد علاقه</h3>
                <div class="grid grid-cols-2 gap-3"><?php foreach(['موبایل','لپ‌تاپ','پوشاک','خانه'] as $c): ?><label class="bg-gray-50 border p-3 rounded-lg flex gap-3 cursor-pointer"><input type="checkbox" class="w-5 h-5 text-[#00a8e8]"><span><?= $c ?></span></label><?php endforeach; ?></div>
                <button class="bg-[#003b5c] text-white px-8 py-3 rounded-xl font-bold mt-6">ذخیره تنظیمات</button>
            </div>
        </div>

        <?php elseif($page === 'seller-dashboard'): ?>
        <!-- 💼 SELLER DASHBOARD -->
        <div class="max-w-6xl mx-auto px-4 py-8 text-center">
            <h1 class="text-3xl font-bold text-[#003b5c] mb-6">داشبورد فروشنده</h1>
            <button onclick="document.getElementById('radar').style.display='flex'" class="bg-[#0b9c56] text-white px-8 py-4 rounded-xl font-bold">نمایش رادار زنده (Live Request)</button>
            
            <div id="radar" class="fixed inset-0 bg-black/70 hidden items-center justify-center p-4 z-50">
                <div class="bg-white w-full max-w-md rounded-3xl p-6 border-4 border-[#0b9c56] relative">
                    <div class="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse absolute -top-3 right-6">درخواست فوری جدید</div>
                    <h3 class="text-xl font-bold mt-4 mb-2">خرید فوری ۲۰ عدد هارد SSD</h3>
                    <p class="text-green-600 font-bold text-lg mb-6">۵۰,۰۰۰,۰۰۰ تومان</p>
                    <button onclick="document.getElementById('radar').style.display='none'; alert('شما وارد رقابت شدید!')" class="bg-[#0b9c56] text-white w-full py-3 rounded-xl font-bold">⚡ پیشنهاد قیمت فوری</button>
                </div>
            </div>
        </div>

        <?php elseif($page === 'admin-dashboard'): ?>
        <!-- 👑 ADMIN DASHBOARD -->
        <div class="max-w-6xl mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold text-[#003b5c] mb-6">پنل مدیریت (ادمین)</h1>
            <div class="bg-white rounded-xl p-6 border border-gray-200 mb-6">
                <h2 class="font-bold mb-4">تنظیمات مالی</h2>
                <div class="flex items-center gap-4"><input type="number" value="5" class="border p-2 rounded-lg w-20 text-center font-bold"> <span class="font-bold">% نرخ کمیسیون</span></div>
            </div>
        </div>
        <?php endif; ?>
    </main>

    <!-- FOOTER -->
    <footer class="bg-gray-900 text-white mt-auto py-8 text-center border-t-4 border-[#00a8e8]">
        <h2 class="text-2xl font-bold mb-2">OptiBid</h2>
        <p class="text-gray-400 text-sm">تولید شده به عنوان نسخه Single-File PHP شامل UI اصلی پروژه</p>
    </footer>

    <!-- SCRIPTS -->
    <script>
        function switchTab(tabId, btn) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            document.querySelectorAll('.tab-btn').forEach(el => {
                el.classList.remove('bg-[#003b5c]', 'text-white', 'border-[#003b5c]');
                el.classList.add('bg-white', 'text-gray-700');
            });
            btn.classList.add('bg-[#003b5c]', 'text-white', 'border-[#003b5c]');
            btn.classList.remove('bg-white', 'text-gray-700');
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
                    img.className = "w-20 h-20 object-cover rounded-lg border";
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
                    <div class="header"><h1>فاکتور رسمی OptiBid (Official Quote)</h1><p>شماره سند: Q-2024-05678</p></div>
                    <table><tr><th>نام کالا</th><th>تعداد</th><th>قیمت کل</th></tr><tr><td>آیفون 15 پرو مکس</td><td>۱</td><td>64,500,000</td></tr></table>
                    <div class="total">مبلغ قابل پرداخت: 64,500,000 تومان</div>
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
