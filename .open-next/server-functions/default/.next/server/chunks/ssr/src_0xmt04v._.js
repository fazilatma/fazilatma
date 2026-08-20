module.exports=[8826,a=>{"use strict";var b=a.i(87924),c=a.i(72131);let d={buyer:[["quality","کیفیت و سلامت کالا"],["match","تطابق کالا با پیشنهاد"],["shipping","سرعت و تعهد در ارسال"],["packaging","بسته‌بندی و تحویل"],["communication","پاسخ‌گویی و رفتار فروشنده"]],seller:[["clarity","شفافیت و دقت درخواست"],["cooperation","همکاری در فرایند معامله"],["communication","ارتباط و پاسخ‌گویی خریدار"],["receipt","سرعت بررسی و تایید دریافت"],["conduct","رفتار حرفه‌ای در معامله"]]};function e({value:a,onChange:c}){return(0,b.jsx)("div",{className:"flex gap-1",dir:"ltr",children:[1,2,3,4,5].map(d=>(0,b.jsx)("button",{type:"button",onClick:()=>c(d),className:`text-3xl transition hover:scale-110 ${d<=a?"text-amber-400":"text-gray-200"}`,"aria-label":`${d} ستاره`,children:"★"},d))})}a.s(["default",0,function({role:a,reviewerId:f,order:g,onSaved:h}){let i=d[a],[j,k]=(0,c.useState)(Object.fromEntries(i.map(([a])=>[a,5]))),[l,m]=(0,c.useState)(""),[n,o]=(0,c.useState)(!1),p=Math.round(Object.values(j).reduce((a,b)=>a+b,0)/Math.max(1,Object.values(j).length)),q="buyer"===a?g.sellerName:g.buyerName,r=async()=>{o(!0);try{let a=await fetch("/api/reviews",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:g.id,reviewerId:f,overall:p,scores:j,comment:l})}),b=await a.json();if(!b.success)throw Error(b.message);alert(b.message),await h()}catch(a){alert(a instanceof Error?a.message:"ثبت نظرسنجی ناموفق بود.")}finally{o(!1)}};return(0,b.jsxs)("article",{className:"rounded-3xl border border-gray-200 bg-white p-6 shadow-sm",children:[(0,b.jsxs)("div",{className:"mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center",children:[(0,b.jsxs)("div",{children:[(0,b.jsxs)("p",{className:"text-xs font-bold text-[#00a8e8]",children:["سفارش ",g.id]}),(0,b.jsxs)("h3",{className:"mt-1 text-lg font-bold text-[#003b5c]",children:["ارزیابی ",q]}),(0,b.jsx)("p",{className:"mt-1 text-sm text-gray-500",children:g.title})]}),(0,b.jsxs)("div",{className:"rounded-xl bg-amber-50 px-4 py-2 text-center",children:[(0,b.jsxs)("p",{className:"text-2xl text-amber-400",children:["★".repeat(p),"☆".repeat(5-p)]}),(0,b.jsxs)("p",{className:"text-xs font-bold text-amber-800",children:["امتیاز نهایی ",p," از ۵"]})]})]}),(0,b.jsx)("div",{className:"space-y-3 border-y border-gray-100 py-5",children:i.map(([a,c])=>(0,b.jsxs)("div",{className:"flex flex-col justify-between gap-2 rounded-xl bg-gray-50 px-4 py-3 sm:flex-row sm:items-center",children:[(0,b.jsx)("span",{className:"text-sm font-bold text-gray-700",children:c}),(0,b.jsx)(e,{value:j[a],onChange:b=>k({...j,[a]:b})})]},a))}),(0,b.jsx)("label",{className:"mt-5 block text-sm font-bold text-gray-700",children:"توضیحات شما (اختیاری)"}),(0,b.jsx)("textarea",{value:l,onChange:a=>m(a.target.value),placeholder:"تجربه واقعی خود از این معامله را بنویسید...",className:"mt-2 min-h-24 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#00a8e8]"}),(0,b.jsx)("button",{type:"button",disabled:n,onClick:r,className:"mt-4 rounded-xl bg-[#003b5c] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#002d46] disabled:bg-gray-400",children:n?"در حال ثبت...":"ثبت نهایی امتیاز و نظر"})]})}])},73767,a=>{"use strict";var b=a.i(65365);a.s(["generateInvoiceHTML",0,a=>{let c=(0,b.getCachedLiveContent)();return`
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>فاکتور رسمی - ${a.id}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v32.103/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
  <style>
    body { font-family: 'Vazirmatn', sans-serif; background-color: #f0f4f8; padding: 2rem; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @media print {
      body { background-color: white; padding: 0; }
      .print-wrapper { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
      .no-print { display: none !important; }
    }
    .bilingual { display: flex; flex-direction: column; line-height: 1.2; }
    .en-text { font-size: 0.65rem; color: #6b7280; direction: ltr; text-align: left; font-family: sans-serif; }
    .fa-text { font-size: 0.85rem; font-weight: bold; color: #1f2937; text-align: right; }
    
    /* Watermark */
    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.03; width: 400px; z-index: 0; pointer-events: none; }
  </style>
</head>
<body>
  
  <div class="print-wrapper max-w-[900px] mx-auto bg-white rounded-3xl shadow-xl relative overflow-hidden z-10" style="min-height: 1100px; display: flex; flex-col; justify-content: space-between;">
    
    <!-- Watermark Logo -->
    <svg class="watermark" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 20 C20 20 15 35 15 50 C15 65 20 80 40 80 C60 80 65 65 65 50" stroke="#003b5c" stroke-width="16" stroke-linecap="round" />
      <path d="M45 50 C45 50 60 50 70 50 C80 50 85 60 85 65 C85 75 75 80 60 80 L45 80" stroke="#003b5c" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M60 50 L85 20 M85 20 L65 20 M85 20 L85 40" stroke="#003b5c" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
    </svg>

    <div class="p-10 relative z-10">
      <!-- HEADER -->
      <div class="flex justify-between items-start mb-10 border-b-2 border-gray-100 pb-6">
        <!-- Logo & Company -->
        <div class="w-1/3">
          <div class="flex items-center gap-2 mb-2">
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 20 C20 20 15 35 15 50 C15 65 20 80 40 80 C60 80 65 65 65 50" stroke="#00a8e8" stroke-width="16" stroke-linecap="round" />
              <path d="M45 50 C45 50 60 50 70 50 C80 50 85 60 85 65 C85 75 75 80 60 80 L45 80" stroke="#003b5c" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M60 50 L85 20 M85 20 L65 20 M85 20 L85 40" stroke="#00a8e8" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div class="text-3xl font-bold text-[#003b5c] tracking-tight">Opti<span class="text-[#00a8e8]">Bid</span></div>
          </div>
          <div class="bilingual">
            <span class="fa-text text-sm">پلتفرم هوشمند خرید و فروش</span>
            <span class="en-text text-xs mt-0.5">Smart Sourcing. Better Performance.</span>
          </div>
        </div>

        <!-- Title -->
        <div class="w-1/3 text-center flex flex-col items-center justify-center pt-2">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">پیش‌فاکتور رسمی</h1>
          <div class="w-16 h-1 bg-[#00a8e8] rounded mb-2"></div>
          <h2 class="text-xl font-bold text-[#003b5c]">Official Quote</h2>
        </div>

        <!-- Meta Data -->
        <div class="w-1/3 text-left">
          <table class="w-full text-sm">
            <tr>
              <td class="pb-2"><div class="bilingual"><span class="fa-text">شماره سند:</span><span class="en-text">Document No.</span></div></td>
              <td class="pb-2 font-bold text-gray-800 text-left" dir="ltr">${a.id}</td>
            </tr>
            <tr>
              <td class="pb-2"><div class="bilingual"><span class="fa-text">تاريخ:</span><span class="en-text">Date</span></div></td>
              <td class="pb-2 font-bold text-gray-800 text-left" dir="ltr">${a.date}</td>
            </tr>
            <tr>
              <td><div class="bilingual"><span class="fa-text">اعتبار پیشنهاد:</span><span class="en-text">Validity</span></div></td>
              <td class="font-bold text-gray-800 text-left" dir="ltr">15 Days</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- INFO SECTION -->
      <div class="flex justify-between gap-8 mb-8">
        <!-- Seller -->
        <div class="w-1/2">
          <div class="border-b border-[#00a8e8] pb-1 mb-3 inline-block pr-8 border-r-4">
            <div class="bilingual"><span class="fa-text text-base text-[#003b5c]">اطلاعات فروشنده</span><span class="en-text text-[#00a8e8]">Seller Information</span></div>
          </div>
          <table class="w-full text-xs">
            <tr>
              <td class="py-2 w-8 text-gray-400">📍</td>
              <td class="py-2 leading-relaxed">
                <div class="font-bold text-gray-800">${c.invoiceCompanyAddressFa}</div>
                <div class="text-gray-500" dir="ltr">${c.invoiceCompanyAddressEn}</div>
              </td>
            </tr>
            <tr>
              <td class="py-2 text-gray-400">📞</td>
              <td class="py-2 font-bold text-gray-800" dir="ltr">021-12345678</td>
            </tr>
            <tr>
              <td class="py-2 text-gray-400">✉️</td>
              <td class="py-2 font-bold text-gray-800" dir="ltr">seller@optibid.ir</td>
            </tr>
            <tr>
              <td class="py-2 text-gray-400">🏢</td>
              <td class="py-2 font-bold text-gray-800 flex justify-between">
                <div class="bilingual"><span class="fa-text">شناسه مالیاتی:</span><span class="en-text">Tax ID</span></div>
                <span>123456789012</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Buyer -->
        <div class="w-1/2">
          <div class="border-b border-[#00a8e8] pb-1 mb-3 inline-block pr-8 border-r-4">
            <div class="bilingual"><span class="fa-text text-base text-[#003b5c]">اطلاعات خریدار</span><span class="en-text text-[#00a8e8]">Customer Information</span></div>
          </div>
          <table class="w-full text-xs">
            <tr>
              <td class="py-1.5 w-24"><div class="bilingual"><span class="fa-text">نام شرکت:</span><span class="en-text">Company Name</span></div></td>
              <td class="py-1.5 font-bold text-gray-800 text-left">ایران توسعه تجارت</td>
            </tr>
            <tr>
              <td class="py-1.5"><div class="bilingual"><span class="fa-text">تماس:</span><span class="en-text">Contact</span></div></td>
              <td class="py-1.5 font-bold text-gray-800 text-left" dir="ltr">0912-123-4567</td>
            </tr>
            <tr>
              <td class="py-1.5"><div class="bilingual"><span class="fa-text">ایمیل:</span><span class="en-text">Email</span></div></td>
              <td class="py-1.5 font-bold text-gray-800 text-left" dir="ltr">buyer@iktrade.ir</td>
            </tr>
            <tr>
              <td class="py-1.5"><div class="bilingual"><span class="fa-text">آدرس:</span><span class="en-text">Address</span></div></td>
              <td class="py-1.5 font-bold text-gray-800 text-left">${c.invoiceShippingAddressFa}</td>
            </tr>
            <tr>
              <td class="py-1.5"><div class="bilingual"><span class="fa-text">شناسه مالیاتی:</span><span class="en-text">Tax ID</span></div></td>
              <td class="py-1.5 font-bold text-gray-800 text-left" dir="ltr">987654321098</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- TABLE -->
      <div class="mb-8 rounded-xl overflow-hidden border border-gray-200">
        <table class="w-full text-sm text-center">
          <thead class="bg-[#003b5c] text-white">
            <tr>
              <th class="py-3 px-2 w-16 border-r border-[#005e94]"><div class="bilingual items-center"><span class="fa-text text-white">ردیف</span><span class="en-text text-blue-200 text-center">No.</span></div></th>
              <th class="py-3 px-4 border-r border-[#005e94] text-right"><div class="bilingual"><span class="fa-text text-white">نام کالا / خدمات</span><span class="en-text text-blue-200 text-left">Item Name</span></div></th>
              <th class="py-3 px-2 border-r border-[#005e94]"><div class="bilingual items-center"><span class="fa-text text-white">برند</span><span class="en-text text-blue-200 text-center">Brand</span></div></th>
              <th class="py-3 px-2 border-r border-[#005e94]"><div class="bilingual items-center"><span class="fa-text text-white">تعداد</span><span class="en-text text-blue-200 text-center">Qty</span></div></th>
              <th class="py-3 px-4 border-r border-[#005e94]"><div class="bilingual items-center"><span class="fa-text text-white">قیمت واحد (ریال)</span><span class="en-text text-blue-200 text-center">Unit Price (IRR)</span></div></th>
              <th class="py-3 px-2 border-r border-[#005e94]"><div class="bilingual items-center"><span class="fa-text text-white">مالیات (%)</span><span class="en-text text-blue-200 text-center">Tax (%)</span></div></th>
              <th class="py-3 px-4"><div class="bilingual items-center"><span class="fa-text text-white">قیمت کل (ریال)</span><span class="en-text text-blue-200 text-center">Total Price (IRR)</span></div></th>
            </tr>
          </thead>
          <tbody class="bg-white">
            <tr class="border-b border-gray-200">
              <td class="py-4 px-2 border-l border-gray-200 font-bold">1</td>
              <td class="py-4 px-4 border-l border-gray-200 text-right">
                <div class="font-bold text-gray-800">${a.product}</div>
                <div class="text-xs text-gray-500 mt-1" dir="ltr">${a.product} (Official)</div>
              </td>
              <td class="py-4 px-2 border-l border-gray-200">Apple</td>
              <td class="py-4 px-2 border-l border-gray-200 font-bold">1</td>
              <td class="py-4 px-4 border-l border-gray-200">${a.amount}</td>
              <td class="py-4 px-2 border-l border-gray-200">9%</td>
              <td class="py-4 px-4 font-bold text-gray-900">${a.amount}</td>
            </tr>
            <!-- Empty rows for spacing -->
            <tr><td class="py-4 px-2 border-l border-gray-200"></td><td class="border-l border-gray-200"></td><td class="border-l border-gray-200"></td><td class="border-l border-gray-200"></td><td class="border-l border-gray-200"></td><td class="border-l border-gray-200"></td><td></td></tr>
          </tbody>
        </table>
      </div>

      <!-- SUMMARY & NOTES -->
      <div class="flex justify-between items-stretch mb-8 gap-8">
        <!-- Notes -->
        <div class="w-1/2 text-xs text-gray-600 space-y-4 pt-2">
          <div class="bilingual mb-4">
            <span class="fa-text text-gray-800 border-b pb-1 inline-block">توضیحات / Notes</span>
          </div>
          <ul class="list-disc list-inside space-y-2 mb-4 fa-text font-normal text-right">
            <li>قیمت‌ها به ریال و بدون احتساب هزینه حمل می‌باشد.</li>
            <li>زمان تحویل: ۲ تا ۳ روز کاری پس از تایید سفارش.</li>
            <li>این پیش‌فاکتور رسمی بوده و معتبر می‌باشد.</li>
          </ul>
          <ul class="list-disc list-inside space-y-2 en-text text-left mt-4" dir="ltr">
            <li>Prices are in IRR and do not include shipping costs.</li>
            <li>Delivery Time: 2 to 3 business days after order confirmation.</li>
            <li>This is an official quote and is valid.</li>
          </ul>
        </div>

        <!-- Totals -->
        <div class="w-1/2 border border-gray-200 rounded-xl overflow-hidden bg-white">
          <table class="w-full text-sm font-bold">
            <tr class="border-b border-gray-200">
              <td class="p-3 text-center border-l border-gray-200">${a.amount}</td>
              <td class="p-3 bg-gray-50 w-48 text-right"><div class="bilingual"><span class="fa-text">جمع مبلغ (بدون مالیات)</span><span class="en-text">Subtotal (Without Tax)</span></div></td>
            </tr>
            <tr class="border-b border-gray-200">
              <td class="p-3 text-center border-l border-gray-200">0</td>
              <td class="p-3 bg-gray-50 w-48 text-right"><div class="bilingual"><span class="fa-text">مالیات (۹٪)</span><span class="en-text">Tax (9%)</span></div></td>
            </tr>
            <tr class="border-b border-gray-200 bg-[#003b5c] text-white">
              <td class="p-3 text-center border-l border-[#005e94] text-lg">${a.amount}</td>
              <td class="p-3 w-48 text-right"><div class="bilingual"><span class="fa-text text-white">جمع کل (با مالیات)</span><span class="en-text text-blue-200">Total (With Tax)</span></div></td>
            </tr>
            <tr class="border-b border-gray-200">
              <td class="p-3 text-center border-l border-gray-200">رایگان</td>
              <td class="p-3 bg-gray-50 w-48 text-right"><div class="bilingual"><span class="fa-text">هزینه حمل</span><span class="en-text">Shipping</span></div></td>
            </tr>
            <tr class="bg-gray-100">
              <td class="p-4 text-center border-l border-gray-200 text-xl text-[#0b9c56]">${a.amount}</td>
              <td class="p-4 w-48 text-right"><div class="bilingual"><span class="fa-text text-[#003b5c]">مبلغ قابل پرداخت</span><span class="en-text">Amount Payable</span></div></td>
            </tr>
          </table>
        </div>
      </div>

      <!-- FOOTER (Stamps & QR) -->
      <div class="flex justify-between items-center bg-gray-50 rounded-xl p-6 border border-gray-200 mt-auto">
        <!-- Sign & Stamp -->
        <div class="text-center w-1/3">
          <div class="bilingual mb-4 justify-center items-center"><span class="fa-text">امضا و مهر / Signature & Stamp</span></div>
          <div class="relative inline-block mt-4">
            <!-- Simulated Stamp -->
            <div class="absolute -top-8 -right-12 w-28 h-28 border-4 border-[#003b5c] rounded-full flex items-center justify-center opacity-70 transform rotate-12">
              <div class="border border-[#003b5c] rounded-full w-24 h-24 flex items-center justify-center text-center font-bold text-[#003b5c] text-sm">
                شرکت<br>OptiBid<br>تایید شده
              </div>
            </div>
            <!-- Simulated Signature -->
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/f6/Signature_of_John_Hancock.svg" class="h-16 opacity-80 mix-blend-multiply relative z-10" alt="Signature">
          </div>
          <div class="mt-4 font-bold text-gray-800 text-sm">مدیر فروش</div>
          <div class="text-xs text-gray-500 font-sans mt-1">Sales Manager</div>
        </div>

        <!-- Verification / QR -->
        <div class="w-1/3 flex flex-col items-center justify-center border-r border-gray-300 pr-6">
          <div class="bilingual mb-4 text-center w-full"><span class="fa-text">تایید و اعتبارسنجی / Verification</span></div>
          <div class="flex items-center gap-4 w-full">
            <div class="flex-1 text-xs text-gray-600 text-right space-y-2">
              <p class="font-bold">برای بررسی اعتبار این پیش‌فاکتور، کد QR را اسکن نمایید.</p>
              <p dir="ltr" class="text-left mt-2">Scan the QR code to verify the authenticity of this quote.</p>
            </div>
            <!-- Mock QR Code -->
            <div class="w-24 h-24 bg-white p-1 border border-gray-300 rounded shrink-0 flex items-center justify-center">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://optibid.ir/verify/${a.id}" class="w-full h-full" alt="QR Code">
            </div>
          </div>
          <div class="mt-2 text-center text-xs font-mono font-bold tracking-widest text-gray-700 w-full" dir="ltr">
            ${a.id}
          </div>
        </div>
      </div>

    </div>

    <!-- Bottom Bar -->
    <div class="bg-[#003b5c] text-white p-4 flex justify-between items-center mt-auto w-full z-10">
      <div class="flex items-center gap-2 text-sm font-sans" dir="ltr">
        <span>📞 021-12345678</span>
      </div>
      <div class="flex items-center gap-2 text-sm font-sans" dir="ltr">
        <span>✉️ info@optibid.ir</span>
      </div>
      <div class="flex items-center gap-2 text-sm font-sans" dir="ltr">
        <span>🌐 www.optibid.ir</span>
      </div>
      <div class="font-bold text-xl tracking-tighter flex items-center gap-1">
        <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40 20 C20 20 15 35 15 50 C15 65 20 80 40 80 C60 80 65 65 65 50" stroke="#00a8e8" stroke-width="16" stroke-linecap="round" />
          <path d="M45 50 C45 50 60 50 70 50 C80 50 85 60 85 65 C85 75 75 80 60 80 L45 80" stroke="#ffffff" strokeWidth="16" strokeLinecap="round" stroke-linejoin="round" />
          <path d="M60 50 L85 20 M85 20 L65 20 M85 20 L85 40" stroke="#00a8e8" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        OptiBid
      </div>
    </div>

  </div>

  <script>
    // Wait for fonts and styles to load before prompting print
    setTimeout(() => {
      window.print();
    }, 1000);
  </script>
</body>
</html>
  `}])}];

//# sourceMappingURL=src_0xmt04v._.js.map