<?php
// ==========================================
// OptiBid Single-File PHP Application
// ==========================================

// شبیه‌سازی سیستم مسیردهی (Routing)
$page = isset($_GET['page']) ? $_GET['page'] : 'home';

// شبیه‌سازی دیتابیس با آرایه‌های PHP
$stats = ['requests' => 156, 'sellers' => 320, 'volume' => '۱,۲۴۵,۰۰۰,۰۰۰', 'success' => 98];

$categories = [
    ['id'=>1, 'name'=>'کالای دیجیتال', 'icon'=>'📱'],
    ['id'=>2, 'name'=>'مد و پوشاک', 'icon'=>'👕'],
    ['id'=>3, 'name'=>'خانه و آشپزخانه', 'icon'=>'🏠'],
    ['id'=>4, 'name'=>'زیبایی و سلامت', 'icon'=>'💄']
];

$topSellers = [
    ['id'=>1, 'name'=>'دیجی‌تک', 'type'=>'تجهیزات دیجیتال', 'rating'=>4.9, 'sales'=>2156, 'avatar'=>'https://i.pravatar.cc/150?img=1'],
    ['id'=>2, 'name'=>'فشن استایل', 'type'=>'پوشاک و اکسسوری', 'rating'=>4.8, 'sales'=>3203, 'avatar'=>'https://i.pravatar.cc/150?img=5']
];

$topBuyers = [
    ['id'=>1, 'name'=>'شرکت فناوران', 'type'=>'خریدار سازمانی', 'rating'=>4.9, 'purchases'=>156, 'avatar'=>'https://i.pravatar.cc/150?img=12'],
    ['id'=>2, 'name'=>'اسپرت استور', 'type'=>'خریدار عمده', 'rating'=>4.8, 'purchases'=>112, 'avatar'=>'https://i.pravatar.cc/150?img=8']
];
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OptiBid - پلتفرم خرید و فروش امن</title>
    <!-- Tailwind CSS (CDN) -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Vazirmatn Font -->
    <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v32.103/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
    <style>
        body { font-family: 'Vazirmatn', sans-serif; background-color: #f3f9f7; }
        .tab-content { display: none; }
        .tab-content.active { display: block; animation: fadeIn 0.4s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 10px 40px rgba(0,0,0,0.1); transition: all 0.3s ease; }
    </style>
</head>
<body class="text-gray-800 flex flex-col min-h-screen">

    <!-- ================= HEADER ================= -->
    <header class="bg-white shadow-sm sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <!-- Logo -->
                <a href="?page=home" class="flex items-center gap-2">
                    <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
                        <path d="M40 20 C20 20 15 35 15 50 C15 65 20 80 40 80 C60 80 65 65 65 50" stroke="#003b5c" stroke-width="16" stroke-linecap="round"/>
                        <path d="M45 50 C45 50 60 50 70 50 C80 50 85 60 85 65 C85 75 75 80 60 80 L45 80" stroke="#00a8e8" stroke-width="16" stroke-linecap="round"/>
                    </svg>
                    <div class="text-2xl font-bold text-[#003b5c] tracking-tight">Opti<span class="text-[#00a8e8]">Bid</span></div>
                </a>

                <!-- Desktop Nav -->
                <div class="hidden md:flex items-center gap-6 font-medium text-gray-700">
                    <a href="?page=request-purchase" class="hover:text-[#00a8e8] transition">ثبت درخواست خرید</a>
                    <a href="?page=buyer-dashboard" class="text-green-700 bg-green-50 px-3 py-1.5 rounded-lg font-bold hover:bg-green-100">👤 داشبورد خریدار</a>
                    <a href="?page=seller-dashboard" class="text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100">💼 داشبورد فروشنده</a>
                    <a href="?page=admin-dashboard" class="text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-100">👑 پنل ادمین</a>
                </div>
            </div>
        </div>
    </header>

    <!-- ================= MAIN CONTENT ================= -->
    <main class="flex-grow">
        
        <?php if($page === 'home'): ?>
        <!-- 🏠 HOME PAGE -->
        <section class="bg-gradient-to-l from-[#003b5c] to-[#005e94] text-white py-16">
            <div class="max-w-7xl mx-auto px-4 text-center">
                <h1 class="text-4xl md:text-5xl font-bold mb-6">پلتفرم درخواست خرید و تامین کالا</h1>
                <p class="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">درخواست خرید خود را ثبت کنید، از تامین‌کنندگان معتبر پیشنهاد قیمت دریافت کنید و با پرداخت امن امانی خرید کنید.</p>
                <div class="flex justify-center gap-4">
                    <a href="?page=request-purchase" class="bg-[#0b9c56] hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg transition">📝 ثبت درخواست خرید</a>
                    <a href="?page=buyer-dashboard" class="bg-white hover:bg-gray-100 text-[#003b5c] px-8 py-4 rounded-xl text-lg font-bold shadow-lg transition">ورود به پنل</a>
                </div>
            </div>
        </section>
        <section class="py-16 bg-gray-50">
            <div class="max-w-7xl mx-auto px-4">
                <h2 class="text-3xl font-bold mb-8">برترین تامین‌کنندگان</h2>
                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <?php foreach($topSellers as $seller): ?>
                    <div class="bg-white p-6 rounded-xl card-hover border border-gray-100 text-center cursor-pointer">
                        <img src="<?= $seller['avatar'] ?>" class="w-20 h-20 rounded-full mx-auto mb-4" />
                        <h3 class="font-bold text-gray-800"><?= $seller['name'] ?></h3>
                        <p class="text-sm text-gray-500 mb-3"><?= $seller['type'] ?></p>
                        <div class="text-sm text-yellow-500 font-bold">⭐ <?= $seller['rating'] ?> | <span class="text-gray-500"><?= $seller['sales'] ?> فروش</span></div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>

        <?php elseif($page === 'request-purchase'): ?>
        <!-- 📝 REQUEST PURCHASE PAGE -->
        <div class="max-w-4xl mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold text-[#003b5c] mb-6">ثبت درخواست خرید</h1>
            <form class="space-y-6" onsubmit="event.preventDefault(); alert('درخواست ثبت شد!'); window.location.href='?page=buyer-dashboard';">
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <label class="block font-bold mb-2">عنوان درخواست</label>
                    <input type="text" placeholder="مثال: خرید ۵ عدد لپ‌تاپ..." class="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-[#00a8e8]" required>
                </div>
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <label class="block font-bold mb-2">بودجه مورد نظر (تومان)</label>
                    <input type="text" id="budgetInput" oninput="formatNumber(this)" placeholder="مثال: ۱۰,۰۰۰,۰۰۰" class="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-[#00a8e8]" required>
                    <p class="text-xs text-gray-500 mt-2">بودجه به صورت خودکار سه رقم سه رقم جدا می‌شود.</p>
                </div>
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <label class="block font-bold mb-2">پیوست تصاویر کالا (پیش‌نمایش زنده)</label>
                    <div class="border-2 border-dashed border-[#00a8e8] bg-blue-50/50 rounded-xl p-8 text-center relative cursor-pointer hover:bg-blue-50">
                        <input type="file" multiple accept="image/*" onchange="previewImages(this)" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                        <div class="text-4xl mb-2">📥</div>
                        <p class="text-[#003b5c] font-bold">برای انتخاب عکس کلیک کنید</p>
                    </div>
                    <div id="imagePreviewContainer" class="flex gap-4 mt-4 overflow-x-auto"></div>
                </div>
                <button type="submit" class="bg-[#0b9c56] text-white px-8 py-4 rounded-xl font-bold w-full hover:bg-green-700">ثبت نهایی درخواست و ارسال برای فروشندگان</button>
            </form>
        </div>

        <?php elseif($page === 'buyer-dashboard'): ?>
        <!-- 👤 BUYER DASHBOARD -->
        <div class="max-w-6xl mx-auto px-4 py-8">
            <div class="bg-gradient-to-r from-[#003b5c] to-[#005e94] rounded-3xl p-8 mb-8 text-white text-center">
                <p class="text-blue-200 mb-2">موجودی کیف پول</p>
                <h2 class="text-5xl font-bold font-mono">۱۵۴,۹۳۰,۰۰۰ <span class="text-xl font-sans font-normal">تومان</span></h2>
            </div>
            
            <!-- داشبورد تب‌ها (شبیه عکس سوم) -->
            <div class="flex flex-wrap justify-center gap-2 mb-8 bg-white/70 backdrop-blur-md p-4 rounded-full border border-gray-200">
                <button onclick="switchTab('req', this)" class="tab-btn bg-[#003b5c] text-white px-5 py-2 rounded-full text-sm font-bold">📝 درخواست‌ها</button>
                <button onclick="switchTab('off', this)" class="tab-btn bg-white text-gray-700 border px-5 py-2 rounded-full text-sm font-bold">🎯 پیشنهادها</button>
                <button onclick="switchTab('ord', this)" class="tab-btn bg-white text-gray-700 border px-5 py-2 rounded-full text-sm font-bold">📦 سفارش‌ها</button>
                <button onclick="switchTab('inv', this)" class="tab-btn bg-white text-gray-700 border px-5 py-2 rounded-full text-sm font-bold">🧾 فاکتورها</button>
                <button onclick="switchTab('set', this)" class="tab-btn bg-white text-gray-700 border px-5 py-2 rounded-full text-sm font-bold">⚙️ تنظیمات</button>
            </div>

            <!-- تب درخواست‌ها (شبیه عکس آخر) -->
            <div id="req" class="tab-content active space-y-4">
                <h2 class="text-2xl font-bold text-[#003b5c] mb-4">درخواست‌های من</h2>
                <div class="bg-white border border-gray-200 rounded-3xl p-6 relative">
                    <span class="absolute top-6 left-6 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">در انتظار پیشنهاد</span>
                    <h3 class="font-bold text-xl mb-2">آیفون 15 پرو مکس</h3>
                    <p class="text-sm text-gray-600 mb-4">موبایل • بودجه: 65,000,000 تومان • شهر: اهواز<br>رنگ تیتانیوم مشکی، رجیستر شده</p>
                    <button onclick="toggleOffers()" class="bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-xl text-sm font-bold">مشاهده پیشنهادها (۱)</button>
                    
                    <!-- لیست پیشنهادات تو در تو -->
                    <div id="nestedOffers" class="hidden mt-4 bg-gray-50 border border-gray-200 rounded-2xl p-5">
                        <div class="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
                            <div>
                                <div class="font-bold">فروشنده دمو <span class="bg-green-100 text-green-700 text-xs px-2 rounded">تایید شده</span></div>
                                <div class="text-[#0b9c56] font-bold text-xl mt-1">64,500,000 تومان</div>
                            </div>
                            <button onclick="switchTab('ord', document.querySelectorAll('.tab-btn')[2])" class="bg-[#003b5c] text-white px-6 py-2 rounded-xl font-bold">انتخاب و پرداخت</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- تب فاکتورها (با قابلیت تولید PDF) -->
            <div id="inv" class="tab-content">
                <h2 class="text-2xl font-bold text-[#003b5c] mb-4">فاکتورهای رسمی شما</h2>
                <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <table class="w-full text-right text-sm">
                        <thead class="bg-gray-50 border-b"><tr><th class="p-4">شماره</th><th class="p-4">کالا</th><th class="p-4">مبلغ</th><th class="p-4">دانلود</th></tr></thead>
                        <tbody>
                            <tr class="border-b">
                                <td class="p-4 font-mono">Q-2024-05678</td><td class="p-4">آیفون 15 پرو مکس</td><td class="p-4 font-bold text-green-600">64,500,000</td>
                                <td class="p-4"><button onclick="generateInvoice()" class="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold">چاپ فاکتور</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- تب تنظیمات (دقیقاً مشابه عکس اول) -->
            <div id="set" class="tab-content">
                <div class="bg-white rounded-3xl p-8 border border-gray-200">
                    <h2 class="text-xl font-bold text-[#0b9c56] border-b pb-4 mb-6">تنظیمات حساب خریدار</h2>
                    
                    <div class="flex items-center gap-4 mb-6 border-b pb-6 justify-end">
                        <input type="text" value="اهواز" class="bg-gray-50 border border-gray-200 rounded-lg p-2 text-left w-48" readonly>
                        <label class="text-sm font-bold">آدرس پیش‌فرض ارسال</label>
                    </div>

                    <div class="mb-6 border-b pb-6">
                        <h3 class="font-bold text-sm text-right mb-3">اعلان‌ها</h3>
                        <div class="flex flex-col items-end gap-2">
                            <label class="flex items-center gap-2 cursor-pointer flex-row-reverse"><span class="text-sm">ایمیل</span><input type="checkbox" checked class="w-4 h-4"></label>
                            <label class="flex items-center gap-2 cursor-pointer flex-row-reverse"><span class="text-sm">پیامک</span><input type="checkbox" class="w-4 h-4"></label>
                        </div>
                    </div>

                    <div class="mb-6 border-b pb-6">
                        <h3 class="font-bold text-sm text-right mb-3">دسته‌های مورد علاقه</h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3" dir="rtl">
                            <?php 
                            $cats = ['موبایل','لپ‌تاپ','لوازم الکترونیکی','پوشاک','خانه و آشپزخانه'];
                            foreach($cats as $c): ?>
                            <label class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border cursor-pointer">
                                <input type="checkbox" class="w-4 h-4"> <span class="text-sm"><?= $c ?></span>
                            </label>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <button class="bg-[#0b9c56] text-white px-8 py-3 rounded-xl font-bold float-left">ذخیره تنظیمات</button>
                    <div class="clear-both"></div>
                </div>
            </div>
            
            <!-- تب‌های خالی برای دمو -->
            <div id="off" class="tab-content text-center py-20 text-gray-500 font-bold">برای مشاهده پیشنهادها به تب درخواست‌ها بروید</div>
            <div id="ord" class="tab-content text-center py-20 text-green-600 font-bold text-xl">سفارش با موفقیت به مرحله پرداخت امن (Escrow) منتقل شد!</div>
        </div>

        <?php elseif($page === 'seller-dashboard'): ?>
        <!-- 💼 SELLER DASHBOARD (Live Radar Demo) -->
        <div class="max-w-6xl mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold text-[#003b5c] mb-6">داشبورد تامین‌کننده (فروشنده)</h1>
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center py-20">
                <p class="text-gray-500 mb-4">هیچ کاری نکنید! لطفاً ۳ ثانیه صبر کنید تا رادار زنده (Live Request) اسنپ‌طوری فعال شود...</p>
                <div class="animate-spin w-8 h-8 border-4 border-[#00a8e8] border-t-transparent rounded-full mx-auto"></div>
            </div>

            <!-- پاپ‌آپ رادار زنده (مخفی در ابتدا) -->
            <div id="liveRadar" class="fixed inset-0 z-50 bg-black/70 hidden items-center justify-center p-4">
                <div class="bg-white w-full max-w-md rounded-3xl p-6 border-4 border-[#0b9c56] relative overflow-hidden transform scale-95 transition-transform" id="radarModal">
                    <div class="absolute -top-10 -right-10 w-32 h-32 bg-green-500/20 rounded-full animate-ping"></div>
                    <div class="flex justify-between items-center mb-4">
                        <div class="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">درخواست فوری جدید</div>
                        <div id="radarTimer" class="text-2xl font-bold font-mono text-red-600 animate-bounce">60</div>
                    </div>
                    <h3 class="text-xl font-bold mb-4">خرید فوری ۲۰ عدد هارد SSD یک ترابایت</h3>
                    <div class="bg-gray-50 p-4 rounded-xl mb-6 text-sm">
                        <div class="flex justify-between mb-2"><span class="text-gray-500">خریدار:</span><span class="font-bold">شرکت داده‌پردازان</span></div>
                        <div class="flex justify-between border-t pt-2"><span class="text-gray-500">بودجه:</span><span class="font-bold text-green-600">۵۰,۰۰۰,۰۰۰ تومان</span></div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="document.getElementById('liveRadar').classList.replace('flex', 'hidden')" class="flex-1 bg-gray-100 py-3 rounded-xl font-bold">رد کردن</button>
                        <button onclick="alert('شما وارد رقابت شدید!'); document.getElementById('liveRadar').classList.replace('flex', 'hidden')" class="flex-[2] bg-[#0b9c56] text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200">⚡ پیشنهاد قیمت فوری</button>
                    </div>
                </div>
            </div>
            
            <script>
                // فعال‌سازی رادار بعد از 3 ثانیه
                setTimeout(() => {
                    document.getElementById('liveRadar').classList.replace('hidden', 'flex');
                    document.getElementById('radarModal').classList.remove('scale-95');
                    let time = 60;
                    const timer = setInterval(() => {
                        time--;
                        document.getElementById('radarTimer').innerText = time;
                        if(time <= 0) { clearInterval(timer); document.getElementById('liveRadar').classList.replace('flex', 'hidden'); }
                    }, 1000);
                }, 3000);
            </script>
        </div>

        <?php elseif($page === 'admin-dashboard'): ?>
        <!-- 👑 ADMIN DASHBOARD -->
        <div class="max-w-6xl mx-auto px-4 py-8">
            <div class="flex justify-between items-center mb-8">
                <h1 class="text-3xl font-bold text-[#003b5c]">پنل مدیریت پلتفرم</h1>
                <span class="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-bold">Super Admin</span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-white p-5 rounded-xl border border-gray-200 border-r-4 border-r-purple-600"><p class="text-xs text-gray-500">درآمد کمیسیون</p><p class="text-xl font-bold">۶۲,۲۵۰,۰۰۰</p></div>
                <div class="bg-white p-5 rounded-xl border border-gray-200 border-r-4 border-r-purple-600"><p class="text-xs text-gray-500">امانات Escrow</p><p class="text-xl font-bold">۲۸۰,۰۰۰,۰۰۰</p></div>
            </div>
            <div class="bg-white rounded-xl p-6 border border-gray-200">
                <h2 class="font-bold text-lg mb-4">تنظیمات مالی</h2>
                <div class="flex items-center gap-4">
                    <input type="number" value="5" class="border p-2 rounded-lg w-20 text-center font-bold"> <span class="font-bold">% نرخ کمیسیون</span>
                    <button class="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold">ذخیره</button>
                </div>
            </div>
        </div>
        <?php endif; ?>

    </main>

    <!-- ================= FOOTER ================= -->
    <footer class="bg-gray-900 text-white mt-12 py-10 text-center border-t-4 border-[#00a8e8]">
        <h2 class="text-2xl font-bold mb-2">OptiBid</h2>
        <p class="text-gray-400 text-sm">کد تک‌فایلی PHP تولید شده برای تست و شبیه‌سازی UI</p>
    </footer>

    <!-- ================= SCRIPTS ================= -->
    <script>
        // 1. تعویض تب‌ها (Tab Switcher)
        function switchTab(tabId, btn) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            document.querySelectorAll('.tab-btn').forEach(el => {
                el.classList.remove('bg-[#003b5c]', 'text-white', 'border-[#003b5c]');
                el.classList.add('bg-white', 'text-gray-700');
            });
            btn.classList.remove('bg-white', 'text-gray-700');
            btn.classList.add('bg-[#003b5c]', 'text-white', 'border-[#003b5c]');
        }

        // 2. باز و بسته کردن پیشنهادهای تو در تو
        function toggleOffers() {
            const el = document.getElementById('nestedOffers');
            el.classList.toggle('hidden');
        }

        // 3. فرمت کننده اعداد (هزارگان) در فرم درخواست
        function formatNumber(input) {
            let val = input.value.replace(/\D/g, "");
            if(val) { input.value = Number(val).toLocaleString('en-US'); }
            else { input.value = ""; }
        }

        // 4. پیش‌نمایش تصویر آپلود شده
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

        // 5. تولید فاکتور رسمی (مانند فایل PDF)
        function generateInvoice() {
            const invoiceHTML = `
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
                    <div class="header">
                        <h1>فاکتور رسمی OptiBid (Official Quote)</h1>
                        <p>شماره سند: Q-2024-05678</p>
                    </div>
                    <table>
                        <tr><th>نام کالا</th><th>تعداد</th><th>قیمت واحد</th><th>قیمت کل</th></tr>
                        <tr><td>آیفون 15 پرو مکس</td><td>۱</td><td>64,500,000</td><td>64,500,000</td></tr>
                    </table>
                    <div class="total">مبلغ قابل پرداخت: 64,500,000 ریال/تومان</div>
                    <script>window.onload = function() { window.print(); }<\/script>
                </body>
                </html>
            `;
            const blob = new Blob([invoiceHTML], { type: 'text/html;charset=utf-8' });
            window.open(URL.createObjectURL(blob), '_blank');
        }
    </script>
</body>
</html>