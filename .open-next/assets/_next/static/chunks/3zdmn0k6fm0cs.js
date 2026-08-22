(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,11777,e=>{"use strict";var t=e.i(43476);let s={sm:"text-sm",md:"text-lg",lg:"text-2xl"};e.s(["default",0,function({score:e,size:a="md",showLabel:r=!0,light:l=!1,className:d=""}){let i=Math.max(0,Math.min(5,e/20)),n=Math.round(i);return(0,t.jsxs)("div",{className:`inline-flex items-center gap-1.5 ${d}`,"aria-label":`امتیاز ${i.toFixed(1)} از ۵`,children:[(0,t.jsx)("span",{className:`tracking-tight text-amber-400 ${s[a]}`,"aria-hidden":"true",children:Array.from({length:5},(e,t)=>t<n?"★":"☆").join("")}),r&&(0,t.jsxs)("span",{className:`font-bold ${l?"text-white":"text-[#003b5c]"}`,children:[i.toLocaleString("fa-IR",{minimumFractionDigits:1,maximumFractionDigits:1}),(0,t.jsx)("span",{className:`mr-0.5 text-xs font-normal ${l?"text-blue-100":"text-gray-500"}`,children:"از ۵"})]})]})}])},59411,e=>{"use strict";var t=e.i(43476),s=e.i(71645);let a={buyer:[["quality","کیفیت و سلامت کالا"],["match","تطابق کالا با پیشنهاد"],["shipping","سرعت و تعهد در ارسال"],["packaging","بسته‌بندی و تحویل"],["communication","پاسخ‌گویی و رفتار فروشنده"]],seller:[["clarity","شفافیت و دقت درخواست"],["cooperation","همکاری در فرایند معامله"],["communication","ارتباط و پاسخ‌گویی خریدار"],["receipt","سرعت بررسی و تایید دریافت"],["conduct","رفتار حرفه‌ای در معامله"]]};function r({value:e,onChange:s}){return(0,t.jsx)("div",{className:"flex gap-1",dir:"ltr",children:[1,2,3,4,5].map(a=>{let r=a<=e;return(0,t.jsx)("button",{type:"button",onClick:()=>s(a),className:`text-3xl transition hover:scale-110 ${r?"text-amber-400":"text-gray-300 hover:text-amber-300"}`,"aria-label":`${a} ستاره`,children:r?"★":"☆"},a)})})}e.s(["default",0,function({role:e,reviewerId:l,order:d,onSaved:i}){let n=a[e],[c,o]=(0,s.useState)(Object.fromEntries(n.map(([e])=>[e,0]))),[x,b]=(0,s.useState)(""),[m,p]=(0,s.useState)(!1),h=Object.values(c).filter(e=>e>0),u=h.length===n.length,g=u?Math.round(h.reduce((e,t)=>e+t,0)/h.length):0,f="buyer"===e?d.sellerName:d.buyerName,y=async()=>{if(!u)return void alert("لطفاً برای همه معیارهای نظرسنجی امتیاز ستاره‌ای ثبت کنید.");p(!0);try{let e=await fetch("/api/reviews",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:d.id,reviewerId:l,overall:g,scores:c,comment:x})}),t=await e.json();if(!t.success)throw Error(t.message);alert(t.message),await i()}catch(e){alert(e instanceof Error?e.message:"ثبت نظرسنجی ناموفق بود.")}finally{p(!1)}};return(0,t.jsxs)("article",{className:"rounded-3xl border border-gray-200 bg-white p-6 shadow-sm",children:[(0,t.jsxs)("div",{className:"mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center",children:[(0,t.jsxs)("div",{children:[(0,t.jsxs)("p",{className:"text-xs font-bold text-[#00a8e8]",children:["سفارش ",d.id]}),(0,t.jsxs)("h3",{className:"mt-1 text-lg font-bold text-[#003b5c]",children:["ارزیابی ",f]}),(0,t.jsx)("p",{className:"mt-1 text-sm text-gray-500",children:d.title})]}),(0,t.jsxs)("div",{className:"rounded-xl bg-amber-50 px-4 py-2 text-center",children:[(0,t.jsxs)("p",{className:"text-2xl text-amber-400",children:["★".repeat(g),"☆".repeat(5-g)]}),(0,t.jsx)("p",{className:"text-xs font-bold text-amber-800",children:u?`امتیاز نهایی ${g} از ۵`:"هنوز امتیازی ثبت نشده"})]})]}),(0,t.jsx)("div",{className:"space-y-3 border-y border-gray-100 py-5",children:n.map(([e,s])=>(0,t.jsxs)("div",{className:"flex flex-col justify-between gap-2 rounded-xl bg-gray-50 px-4 py-3 sm:flex-row sm:items-center",children:[(0,t.jsx)("span",{className:"text-sm font-bold text-gray-700",children:s}),(0,t.jsx)(r,{value:c[e],onChange:t=>o({...c,[e]:t})})]},e))}),(0,t.jsx)("label",{className:"mt-5 block text-sm font-bold text-gray-700",children:"توضیحات شما (اختیاری)"}),(0,t.jsx)("textarea",{value:x,onChange:e=>b(e.target.value),placeholder:"تجربه واقعی خود از این معامله را بنویسید...",className:"mt-2 min-h-24 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#00a8e8]"}),(0,t.jsx)("p",{className:"mt-2 text-xs leading-6 text-gray-500",children:"متن این بخش دقیقاً در قسمت «دیدگاه‌ها» صفحه طرف مقابل نمایش داده می‌شود."}),(0,t.jsx)("button",{type:"button",disabled:m||!u,onClick:y,className:"mt-4 rounded-xl bg-[#003b5c] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#002d46] disabled:bg-gray-400",children:m?"در حال ثبت...":"ثبت نهایی امتیاز و نظر"})]})}])},56722,e=>{"use strict";var t=e.i(19614);e.s(["generateInvoiceHTML",0,e=>{let s=(0,t.getCachedLiveContent)();return`
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>فاکتور رسمی - ${e.id}</title>
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
              <td class="pb-2 font-bold text-gray-800 text-left" dir="ltr">${e.id}</td>
            </tr>
            <tr>
              <td class="pb-2"><div class="bilingual"><span class="fa-text">تاريخ:</span><span class="en-text">Date</span></div></td>
              <td class="pb-2 font-bold text-gray-800 text-left" dir="ltr">${e.date}</td>
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
                <div class="font-bold text-gray-800">${s.invoiceCompanyAddressFa}</div>
                <div class="text-gray-500" dir="ltr">${s.invoiceCompanyAddressEn}</div>
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
              <td class="py-1.5 font-bold text-gray-800 text-left">${s.invoiceShippingAddressFa}</td>
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
                <div class="font-bold text-gray-800">${e.product}</div>
                <div class="text-xs text-gray-500 mt-1" dir="ltr">${e.product} (Official)</div>
              </td>
              <td class="py-4 px-2 border-l border-gray-200">Apple</td>
              <td class="py-4 px-2 border-l border-gray-200 font-bold">1</td>
              <td class="py-4 px-4 border-l border-gray-200">${e.amount}</td>
              <td class="py-4 px-2 border-l border-gray-200">9%</td>
              <td class="py-4 px-4 font-bold text-gray-900">${e.amount}</td>
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
              <td class="p-3 text-center border-l border-gray-200">${e.amount}</td>
              <td class="p-3 bg-gray-50 w-48 text-right"><div class="bilingual"><span class="fa-text">جمع مبلغ (بدون مالیات)</span><span class="en-text">Subtotal (Without Tax)</span></div></td>
            </tr>
            <tr class="border-b border-gray-200">
              <td class="p-3 text-center border-l border-gray-200">0</td>
              <td class="p-3 bg-gray-50 w-48 text-right"><div class="bilingual"><span class="fa-text">مالیات (۹٪)</span><span class="en-text">Tax (9%)</span></div></td>
            </tr>
            <tr class="border-b border-gray-200 bg-[#003b5c] text-white">
              <td class="p-3 text-center border-l border-[#005e94] text-lg">${e.amount}</td>
              <td class="p-3 w-48 text-right"><div class="bilingual"><span class="fa-text text-white">جمع کل (با مالیات)</span><span class="en-text text-blue-200">Total (With Tax)</span></div></td>
            </tr>
            <tr class="border-b border-gray-200">
              <td class="p-3 text-center border-l border-gray-200">رایگان</td>
              <td class="p-3 bg-gray-50 w-48 text-right"><div class="bilingual"><span class="fa-text">هزینه حمل</span><span class="en-text">Shipping</span></div></td>
            </tr>
            <tr class="bg-gray-100">
              <td class="p-4 text-center border-l border-gray-200 text-xl text-[#0b9c56]">${e.amount}</td>
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
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://optibid.ir/verify/${e.id}" class="w-full h-full" alt="QR Code">
            </div>
          </div>
          <div class="mt-2 text-center text-xs font-mono font-bold tracking-widest text-gray-700 w-full" dir="ltr">
            ${e.id}
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
  `}])},69530,e=>{"use strict";var t=e.i(43476),s=e.i(22016),a=e.i(71645),r=e.i(59411),l=e.i(11777),d=e.i(56722);let i=["کالای دیجیتال","مد و پوشاک","خانه و آشپزخانه","زیبایی و سلامت","کتاب و لوازم تحریر","ورزش و سفر","اسباب‌بازی و کودک","خودرو و موتور","صنعتی و اداری"],n=e=>`${Number(String(e).replace(/\D/g,"")||0).toLocaleString("fa-IR")} تومان`,c=e=>e?new Date(e).toLocaleString("fa-IR",{dateStyle:"short",timeStyle:"short"}):"—";function o({text:e}){return(0,t.jsx)("div",{className:"rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500",children:e})}function x({label:e,value:s,onChange:a}){return(0,t.jsxs)("label",{className:"block text-sm font-bold text-gray-700",children:[e,(0,t.jsx)("input",{value:s,onChange:e=>a(e.target.value),className:"mt-2 w-full rounded-xl border p-3 font-normal outline-none focus:border-[#00a8e8]"})]})}function b({offer:e,onSelect:s}){return(0,t.jsx)("div",{className:"rounded-2xl border border-gray-200 bg-white p-5 shadow-sm",children:(0,t.jsxs)("div",{className:"flex flex-col justify-between gap-4 sm:flex-row",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("p",{className:"text-lg font-bold text-[#003b5c]",children:e.sellerName}),(0,t.jsxs)("p",{className:"mt-1 text-sm text-gray-500",children:["برای درخواست: ",e.request?.title||"—"]}),(0,t.jsx)("p",{className:"mt-3 text-sm text-gray-600",children:e.message||"توضیحی ثبت نشده است."}),(0,t.jsxs)("p",{className:"mt-2 text-xs text-gray-500",children:["زمان تحویل: ",e.deliveryDays," روز"]})]}),(0,t.jsxs)("div",{className:"text-left",children:[(0,t.jsx)("p",{className:"text-2xl font-bold text-[#0b9c56]",children:n(e.amount)}),(0,t.jsx)("button",{onClick:s,disabled:"pending"!==e.status,className:"mt-4 rounded-xl bg-[#003b5c] px-5 py-2.5 text-sm font-bold text-white disabled:bg-gray-300",children:"pending"===e.status?"انتخاب پیشنهاد":"accepted"===e.status?"انتخاب شده":"رد شده"})]})]})})}function m({order:e,children:s}){return(0,t.jsxs)("div",{className:"rounded-3xl border border-gray-200 bg-white p-6 shadow-sm",children:[(0,t.jsxs)("div",{className:"flex flex-col justify-between gap-3 sm:flex-row",children:[(0,t.jsxs)("div",{children:[(0,t.jsxs)("div",{className:"mb-2 flex gap-2",children:[(0,t.jsx)("span",{className:"rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700",children:e.status}),(0,t.jsx)("span",{className:"rounded-full bg-gray-100 px-3 py-1 font-mono text-xs",children:e.id})]}),(0,t.jsx)("h2",{className:"text-xl font-bold text-[#003b5c]",children:e.title}),(0,t.jsxs)("p",{className:"mt-1 text-sm text-gray-600",children:["فروشنده: ",e.sellerName]}),(0,t.jsxs)("p",{className:"mt-1 text-xs text-gray-500",children:["آدرس تحویل: ",e.shippingAddress]})]}),(0,t.jsxs)("div",{className:"text-left",children:[(0,t.jsx)("p",{className:"text-xl font-bold text-[#0b9c56]",children:n(e.totalAmount)}),(0,t.jsxs)("p",{className:"mt-1 text-xs text-gray-500",children:["کمیسیون: ",n(e.platformFee)]})]})]}),s]})}e.s(["default",0,function(){let[e,p]=(0,a.useState)("overview"),[h,u]=(0,a.useState)(null),[g,f]=(0,a.useState)(!0),[y,v]=(0,a.useState)(""),[j,w]=(0,a.useState)({}),[N,k]=(0,a.useState)(null),[C,S]=(0,a.useState)(!1),[I,$]=(0,a.useState)(""),[A,M]=(0,a.useState)("wallet"),[T,E]=(0,a.useState)(""),[L,B]=(0,a.useState)(""),[O,R]=(0,a.useState)(""),[D,q]=(0,a.useState)(null),[z,P]=(0,a.useState)({fullName:"",defaultAddress:"",bio:"",categories:[]}),F=Number(localStorage.getItem("userId")||0),Q=async()=>{if(!F){v("برای مشاهده داده‌های واقعی داشبورد، ابتدا با یک حساب خریدار ثبت‌نام یا وارد شوید."),f(!1);return}f(!0);try{let e=await fetch(`/api/dashboard/buyer?buyerId=${F}`,{cache:"no-store"}),t=await e.json();if(!t.success)throw Error(t.message||"خطا در دریافت داشبورد");u(t),P({fullName:t.buyer.fullName||"",defaultAddress:t.buyer.defaultAddress||"",bio:t.buyer.bio||"",categories:t.buyer.categories||[]});let s=t.offers[0]?.seller?.id||t.orders[0]?.sellerId||null;q(e=>e||s),v("")}catch(e){v(e instanceof Error?e.message:"ارتباط با سرور ناموفق بود.")}finally{f(!1)}};(0,a.useEffect)(()=>{Q()},[]);let U=async(e,t)=>{let s=await fetch(e,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}),a=await s.json();if(!a.success)throw Error(a.message||"عملیات ناموفق بود.");return a},V=async()=>{if(!h||!N)return;let e=C?I:h.buyer.defaultAddress||"";if(!e.trim())return void alert("لطفاً ابتدا آدرس پیش‌فرض را در پروفایل ثبت کنید یا آدرس جدید تحویل را وارد کنید.");try{let t=await U("/api/orders/select-offer",{buyerId:h.buyer.id,offerId:N.id,useAlternateAddress:C,shippingAddress:e});alert(t.message),k(null),p("orders"),await Q()}catch(e){alert(e instanceof Error?e.message:"خطا در انتخاب پیشنهاد")}},H=async e=>{if(h)try{let t=await U("/api/orders/pay",{buyerId:h.buyer.id,orderId:e,paymentMethod:A});alert(t.message),await Q()}catch(e){alert(e instanceof Error?e.message:"پرداخت ناموفق بود")}},W=async e=>{if(h&&confirm("آیا دریافت سالم کالا را تایید می‌کنید؟ با تایید شما، وجه پس از کسر کمیسیون به کیف پول فروشنده واریز می‌شود."))try{let t=await U("/api/orders/confirm-received",{buyerId:h.buyer.id,orderId:e});alert(t.message),await Q()}catch(e){alert(e instanceof Error?e.message:"تایید دریافت ناموفق بود")}},_=async e=>{if(h&&confirm("آیا سفارش آماده پرداخت را لغو می‌کنید؟"))try{let t=await U("/api/orders/cancel",{buyerId:h.buyer.id,orderId:e});alert(t.message),await Q()}catch(e){alert(e instanceof Error?e.message:"لغو سفارش ناموفق بود")}},J=async e=>{if(h)try{let t=await U("/api/orders/archive",{userId:h.buyer.id,orderId:e,role:"buyer"});alert(t.message),await Q()}catch(e){alert(e instanceof Error?e.message:"بایگانی ناموفق بود")}},K=async()=>{if(h&&T)try{let e=await U("/api/wallet/topup",{userId:h.buyer.id,amount:T});E(""),alert(`${e.message} موجودی جدید: ${n(e.walletBalance)}`),await Q()}catch(e){alert(e instanceof Error?e.message:"شارژ کیف پول ناموفق بود")}},Y=async()=>{if(h&&L)try{let e=await U("/api/wallet/withdraw",{userId:h.buyer.id,amount:L});B(""),alert(e.message),await Q()}catch(e){alert(e instanceof Error?e.message:"درخواست برداشت ناموفق بود.")}},G=async()=>{if(h)try{let e=await fetch("/api/buyer/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({buyerId:h.buyer.id,...z})}),t=await e.json();if(!t.success)throw Error(t.message);localStorage.setItem("userDisplayName",z.fullName),alert(t.message),await Q()}catch(e){alert(e instanceof Error?e.message:"ذخیره پروفایل ناموفق بود")}},X=async()=>{if(h&&D&&O.trim())try{let e=await U("/api/messages",{senderId:h.buyer.id,receiverId:D,content:O});R(""),alert(e.message),await Q()}catch(e){alert(e instanceof Error?e.message:"ارسال پیام ناموفق بود")}},Z=(0,a.useMemo)(()=>{let e=new Map;for(let t of h?.offers||[]){let s=e.get(t.requestId)||[];s.push(t),e.set(t.requestId,s)}return e},[h]),ee=(0,a.useMemo)(()=>{let e=new Map;for(let t of h?.offers||[])t.seller&&e.set(t.seller.id,{id:t.seller.id,name:t.seller.fullName});for(let t of h?.orders||[])e.set(t.sellerId,{id:t.sellerId,name:t.sellerName});return[...e.values()]},[h]),et=(h?.messages||[]).filter(e=>e.senderId===D||e.receiverId===D),es=(h?.orders||[]).filter(e=>"pending_payment"===e.status),ea=(h?.orders||[]).filter(e=>"shipped"===e.status),er=(h?.orders||[]).filter(e=>e.buyerArchived||["completed","cancelled","returned"].includes(e.status)),el=(h?.orders||[]).filter(e=>["paid","shipped","completed"].includes(e.status)),ed=new Set((h?.reviews||[]).filter(e=>e.reviewerId===h?.buyer.id).map(e=>e.orderId)),ei=(h?.orders||[]).filter(e=>"completed"===e.status&&!ed.has(e.id)),en=new Map((h?.orders||[]).map(e=>[e.id,e])),ec=(h?.reviews||[]).filter(e=>e.revieweeId===h?.buyer.id);return g?(0,t.jsx)("div",{dir:"rtl",className:"grid min-h-[60vh] place-items-center bg-gray-50 text-[#003b5c]",children:"در حال بارگذاری داشبورد واقعی..."}):y||!h?(0,t.jsxs)("div",{dir:"rtl",className:"mx-auto mt-12 max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center",children:[(0,t.jsx)("h1",{className:"text-xl font-bold text-amber-900",children:"داشبورد خریدار آماده نیست"}),(0,t.jsx)("p",{className:"mt-3 text-sm leading-7 text-amber-800",children:y}),(0,t.jsx)(s.default,{href:"/register",className:"mt-6 inline-block rounded-xl bg-[#003b5c] px-6 py-3 font-bold text-white",children:"ثبت‌نام خریدار"})]}):(0,t.jsxs)("div",{dir:"rtl",className:"min-h-screen bg-[#f4f7f9] pb-16",children:[(0,t.jsx)("div",{className:"border-b bg-white px-4 py-3 shadow-sm",children:(0,t.jsxs)("div",{className:"mx-auto flex max-w-6xl justify-between text-sm text-gray-500",children:[(0,t.jsx)("span",{children:"OptiBid / داشبورد خریدار"}),(0,t.jsx)("span",{children:h.buyer.fullName})]})}),(0,t.jsxs)("div",{className:"mx-auto max-w-6xl px-4 py-8",children:[(0,t.jsxs)("section",{className:"mb-6 grid grid-cols-2 gap-4 md:grid-cols-4",children:[(0,t.jsxs)("div",{className:"rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm",children:[(0,t.jsx)("p",{className:"text-3xl font-bold text-[#003b5c]",children:h.requests.length}),(0,t.jsx)("p",{className:"mt-1 text-sm text-gray-500",children:"درخواست‌های من"})]}),(0,t.jsxs)("div",{className:"rounded-2xl border-b-4 border-red-500 bg-white p-5 text-center shadow-sm",children:[(0,t.jsx)("p",{className:"text-3xl font-bold text-red-600",children:es.length}),(0,t.jsx)("p",{className:"mt-1 text-sm text-gray-500",children:"آماده پرداخت"})]}),(0,t.jsxs)("div",{className:"rounded-2xl border-b-4 border-blue-500 bg-white p-5 text-center shadow-sm",children:[(0,t.jsx)("p",{className:"text-3xl font-bold text-[#003b5c]",children:ea.length}),(0,t.jsx)("p",{className:"mt-1 text-sm text-gray-500",children:"در انتظار دریافت"})]}),(0,t.jsxs)("div",{className:"rounded-2xl border-b-4 border-[#00a8e8] bg-white p-5 text-center shadow-sm",children:[(0,t.jsx)("p",{className:"text-xl font-bold text-[#00a8e8]",children:n(h.buyer.walletBalance)}),(0,t.jsx)("p",{className:"mt-1 text-sm text-gray-500",children:"موجودی کیف پول"})]})]}),es.length>0&&(0,t.jsxs)("div",{className:"mb-6 flex flex-col items-center justify-between gap-4 rounded-2xl bg-gradient-to-l from-[#003b5c] to-[#005e94] p-5 text-white sm:flex-row",children:[(0,t.jsxs)("div",{children:[(0,t.jsxs)("h2",{className:"font-bold",children:[es.length," سفارش آماده پرداخت دارید"]}),(0,t.jsx)("p",{className:"mt-1 text-sm text-blue-100",children:"پس از پرداخت، مبلغ نزد OptiBid امانت می‌ماند."})]}),(0,t.jsx)("button",{onClick:()=>p("orders"),className:"rounded-xl bg-[#00a8e8] px-5 py-2.5 text-sm font-bold",children:"مشاهده سفارش‌ها"})]}),(0,t.jsx)("div",{className:"mb-8 flex flex-wrap justify-center gap-2 rounded-[2rem] border border-gray-200 bg-white/70 p-4 shadow-sm",children:[["overview","پیشخوان","🏠"],["requests","درخواست‌ها","📝"],["offers","پیشنهادها","🎯"],["orders","سفارش‌ها","📦"],["receive","دریافت کالا","📥"],["wallet","کیف پول","💰"],["messages","پیام‌ها","💬"],["reviews","دیدگاه‌ها","🗣️"],["notifications","اعلان‌ها","🔔"],["survey","نظرسنجی","⭐"],["invoices","فاکتورها","🧾"],["archive","بایگانی","🗂️"],["profile","پروفایل","👤"],["settings","تنظیمات","⚙️"]].map(([s,a,r])=>(0,t.jsxs)("button",{onClick:()=>p(s),className:`rounded-full border px-4 py-2 text-sm font-bold transition ${e===s?"border-[#003b5c] bg-[#003b5c] text-white":"border-gray-200 bg-white text-gray-600 hover:bg-blue-50"}`,children:[r," ",a,"orders"===s&&es.length>0?` (${es.length})`:"","notifications"===s&&h.notifications.filter(e=>!e.readAt).length>0?` (${h.notifications.filter(e=>!e.readAt).length})`:"","survey"===s&&ei.length>0?` (${ei.length})`:""]},s))}),"overview"===e&&(0,t.jsxs)("section",{className:"grid gap-6 md:grid-cols-2",children:[(0,t.jsxs)("div",{className:"rounded-3xl bg-gradient-to-tr from-[#003b5c] to-[#005e94] p-8 text-center text-white shadow-lg",children:[(0,t.jsx)("p",{className:"text-blue-100",children:"موجودی کیف پول"}),(0,t.jsx)("p",{className:"mt-3 text-4xl font-bold",children:n(h.buyer.walletBalance)}),(0,t.jsx)("button",{onClick:()=>p("wallet"),className:"mt-6 rounded-xl bg-white px-5 py-2.5 font-bold text-[#003b5c]",children:"مدیریت کیف پول"})]}),(0,t.jsxs)("div",{className:"rounded-3xl border border-gray-200 bg-white p-6 shadow-sm",children:[(0,t.jsx)("h2",{className:"mb-4 font-bold",children:"آخرین اعلان‌ها"}),h.notifications.slice(0,4).map(e=>(0,t.jsxs)("div",{className:"mb-3 rounded-xl bg-gray-50 p-3",children:[(0,t.jsx)("p",{className:"font-bold text-[#003b5c]",children:e.title}),(0,t.jsx)("p",{className:"mt-1 text-xs text-gray-600",children:e.body})]},e.id)),0===h.notifications.length&&(0,t.jsx)("p",{className:"text-sm text-gray-500",children:"هنوز اعلانی ندارید."})]})]}),"requests"===e&&(0,t.jsxs)("section",{children:[(0,t.jsxs)("div",{className:"mb-6 flex justify-between",children:[(0,t.jsx)("h1",{className:"text-2xl font-bold text-[#003b5c]",children:"درخواست‌های من"}),(0,t.jsx)(s.default,{href:"/request-purchase",className:"rounded-xl bg-[#00a8e8] px-5 py-2.5 text-sm font-bold text-white",children:"+ درخواست جدید"})]}),(0,t.jsx)("div",{className:"space-y-5",children:0===h.requests.length?(0,t.jsx)(o,{text:"درخواستی ثبت نشده است."}):h.requests.map(e=>{let s=Z.get(e.id)||[];return(0,t.jsxs)("div",{className:"rounded-3xl border border-gray-200 bg-white p-6 shadow-sm",children:[(0,t.jsxs)("div",{className:"mb-4 flex flex-wrap items-start justify-between gap-3",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("h2",{className:"text-xl font-bold text-[#003b5c]",children:e.title}),(0,t.jsxs)("p",{className:"mt-2 text-sm text-gray-600",children:[e.category," · تعداد ",e.quantity," · بودجه ",n(e.budget)]}),(0,t.jsx)("p",{className:"mt-1 text-xs text-gray-500",children:e.description})]}),(0,t.jsx)("span",{className:"rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700",children:e.status})]}),(0,t.jsxs)("button",{onClick:()=>w(t=>({...t,[e.id]:!t[e.id]})),className:"rounded-xl border border-[#00a8e8]/30 bg-blue-50 px-4 py-2.5 text-sm font-bold text-[#00a8e8]",children:["مشاهده و انتخاب پیشنهادها (",s.length,")"]}),j[e.id]&&(0,t.jsx)("div",{className:"mt-4 space-y-3 rounded-2xl border border-blue-100 bg-[#f8fcfb] p-4",children:0===s.length?(0,t.jsx)("p",{className:"p-4 text-center text-sm text-gray-500",children:"هنوز پیشنهادی از فروشندگان دریافت نشده است."}):s.map(e=>(0,t.jsx)(b,{offer:e,onSelect:()=>{k(e),S(!1),$("")}},e.id))})]},e.id)})})]}),"offers"===e&&(0,t.jsxs)("section",{children:[(0,t.jsx)("h1",{className:"mb-6 text-2xl font-bold text-[#003b5c]",children:"پیشنهادهای دریافتی فروشندگان"}),(0,t.jsx)("div",{className:"space-y-4",children:0===h.offers.length?(0,t.jsx)(o,{text:"هنوز پیشنهادی دریافت نشده است."}):h.offers.map(e=>(0,t.jsx)(b,{offer:e,onSelect:()=>{k(e),S(!1),$("")}},e.id))})]}),N&&(0,t.jsx)("section",{className:"fixed inset-0 z-50 grid place-items-center bg-black/60 p-4",children:(0,t.jsxs)("div",{className:"max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl",children:[(0,t.jsxs)("div",{className:"mb-5 flex justify-between",children:[(0,t.jsx)("h2",{className:"text-xl font-bold text-[#003b5c]",children:"تایید انتخاب پیشنهاد"}),(0,t.jsx)("button",{onClick:()=>k(null),className:"text-gray-400",children:"✕"})]}),(0,t.jsxs)("p",{className:"rounded-xl bg-blue-50 p-3 text-sm text-blue-900",children:["فروشنده: ",N.sellerName," — مبلغ پیشنهادی: ",(0,t.jsx)("b",{children:n(N.amount)})]}),(0,t.jsxs)("div",{className:"mt-5",children:[(0,t.jsxs)("label",{className:"flex items-center gap-2 text-sm font-bold",children:[(0,t.jsx)("input",{type:"checkbox",checked:C,onChange:e=>S(e.target.checked)})," ارسال به آدرس جدید"]}),C?(0,t.jsx)("textarea",{value:I,onChange:e=>$(e.target.value),placeholder:"آدرس جدید تحویل را وارد کنید",className:"mt-3 min-h-24 w-full rounded-xl border p-3 outline-none focus:border-[#00a8e8]"}):(0,t.jsxs)("div",{className:"mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600",children:["آدرس پیش‌فرض: ",h.buyer.defaultAddress||"ثبت نشده — ابتدا پروفایل را تکمیل کنید."]})]}),(0,t.jsxs)("div",{className:"mt-6 flex gap-3",children:[(0,t.jsx)("button",{onClick:()=>k(null),className:"flex-1 rounded-xl bg-gray-100 py-3 font-bold",children:"بازگشت"}),(0,t.jsx)("button",{onClick:V,className:"flex-[2] rounded-xl bg-[#003b5c] py-3 font-bold text-white",children:"تایید و انتقال به سفارش"})]})]})}),"orders"===e&&(0,t.jsxs)("section",{children:[(0,t.jsx)("h1",{className:"mb-2 text-2xl font-bold text-[#003b5c]",children:"سفارش‌های آماده پرداخت"}),(0,t.jsx)("p",{className:"mb-6 text-sm text-gray-500",children:"پس از پرداخت، سفارش به فروشنده ارسال می‌شود تا کالا را به آدرس ثبت‌شده تحویل دهد."}),(0,t.jsx)("div",{className:"space-y-4",children:0===es.length?(0,t.jsx)(o,{text:"هیچ سفارش آماده پرداختی ندارید."}):es.map(e=>(0,t.jsx)(m,{order:e,children:(0,t.jsxs)("div",{className:"mt-4 flex flex-wrap gap-3",children:[(0,t.jsxs)("select",{value:A,onChange:e=>M(e.target.value),className:"rounded-xl border px-3 py-2 text-sm",children:[(0,t.jsx)("option",{value:"wallet",children:"پرداخت از کیف پول"}),(0,t.jsx)("option",{value:"gateway",children:"پرداخت اینترنتی (شبیه‌سازی درگاه)"})]}),(0,t.jsx)("button",{onClick:()=>H(e.id),className:"rounded-xl bg-red-500 px-5 py-2 font-bold text-white",children:"پرداخت امانی"}),(0,t.jsx)("button",{onClick:()=>_(e.id),className:"rounded-xl border border-red-200 px-4 py-2 font-bold text-red-600",children:"انصراف"})]})},e.id))})]}),"receive"===e&&(0,t.jsxs)("section",{children:[(0,t.jsx)("h1",{className:"mb-6 text-2xl font-bold text-[#003b5c]",children:"دریافت کالا"}),(0,t.jsx)("div",{className:"space-y-4",children:0===ea.length?(0,t.jsx)(o,{text:"هیچ کالای ارسالی برای تایید دریافت ندارید."}):ea.map(e=>(0,t.jsxs)(m,{order:e,children:[(0,t.jsxs)("div",{className:"mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800",children:["کد رهگیری فروشنده: ",(0,t.jsx)("b",{children:e.trackingCode})]}),(0,t.jsx)("button",{onClick:()=>W(e.id),className:"mt-4 rounded-xl bg-[#0b9c56] px-5 py-3 font-bold text-white",children:"✓ تایید دریافت کالا و آزادسازی وجه فروشنده"})]},e.id))})]}),"wallet"===e&&(0,t.jsxs)("section",{className:"space-y-6",children:[(0,t.jsxs)("div",{className:"grid gap-6 md:grid-cols-2",children:[(0,t.jsxs)("div",{className:"rounded-3xl bg-gradient-to-br from-[#003b5c] to-[#005e94] p-6 text-white shadow-lg",children:[(0,t.jsx)("p",{className:"text-blue-100",children:"موجودی قابل استفاده"}),(0,t.jsx)("p",{className:"mt-3 text-3xl font-bold",children:n(h.buyer.walletBalance)}),(0,t.jsxs)("div",{className:"mt-6",children:[(0,t.jsx)("input",{value:T,onChange:e=>E(e.target.value.replace(/\D/g,"").replace(/\B(?=(\d{3})+(?!\d))/g,",")),placeholder:"مبلغ شارژ",className:"w-full rounded-xl border border-white/30 bg-white/10 p-3 text-white placeholder:text-blue-100"}),(0,t.jsx)("button",{onClick:K,className:"mt-3 w-full rounded-xl bg-white py-3 font-bold text-[#003b5c]",children:"شارژ کیف پول"})]})]}),(0,t.jsxs)("div",{className:"rounded-3xl border border-blue-100 bg-white p-6 shadow-sm",children:[(0,t.jsx)("h2",{className:"font-bold text-[#003b5c]",children:"درخواست برداشت به حساب بانکی"}),(0,t.jsxs)("div",{className:"mt-4 rounded-xl bg-gray-50 p-4 text-sm leading-7 text-gray-600",children:[(0,t.jsxs)("p",{children:[(0,t.jsx)("b",{children:"صاحب حساب:"})," ",h.buyer.bankAccountHolder||"ثبت نشده"]}),(0,t.jsxs)("p",{children:[(0,t.jsx)("b",{children:"بانک:"})," ",h.buyer.bankName||"ثبت نشده"]}),(0,t.jsxs)("p",{dir:"ltr",className:"text-right",children:[(0,t.jsx)("b",{children:"کارت:"})," ",((e="")=>e?`${e.slice(0,4)}-****-****-${e.slice(-4)}`:"ثبت نشده")(h.buyer.bankCardNumber)]}),(0,t.jsxs)("p",{dir:"ltr",className:"text-right",children:[(0,t.jsx)("b",{children:"شبا:"})," ",((e="")=>e?`${e.slice(0,4)} **** **** **** **** ${e.slice(-4)}`:"ثبت نشده")(h.buyer.bankShebaNumber)]}),(0,t.jsx)("p",{className:`mt-2 text-xs font-bold ${h.buyer.bankDetailsVerified?"text-green-600":"text-amber-600"}`,children:h.buyer.bankDetailsVerified?"✓ اطلاعات بانکی تایید شده":"درخواست برداشت توسط ادمین و اطلاعات حساب بررسی می‌شود"})]}),(0,t.jsx)("input",{value:L,onChange:e=>B(e.target.value.replace(/\D/g,"").replace(/\B(?=(\d{3})+(?!\d))/g,",")),placeholder:"مبلغ برداشت (تومان)",className:"mt-4 w-full rounded-xl border p-3 outline-none focus:border-[#00a8e8]"}),(0,t.jsx)("button",{onClick:Y,className:"mt-3 w-full rounded-xl bg-[#0b9c56] py-3 font-bold text-white",children:"ثبت درخواست برداشت"})]})]}),(0,t.jsxs)("div",{className:"grid gap-6 lg:grid-cols-2",children:[(0,t.jsxs)("div",{className:"rounded-3xl border border-gray-200 bg-white p-6 shadow-sm",children:[(0,t.jsx)("h2",{className:"mb-4 font-bold",children:"تراکنش‌های واقعی کیف پول"}),0===h.transactions.length?(0,t.jsx)(o,{text:"هنوز تراکنشی وجود ندارد."}):h.transactions.map(e=>(0,t.jsxs)("div",{className:"flex justify-between border-b py-3 text-sm",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("p",{className:"font-bold",children:e.description}),(0,t.jsx)("p",{className:"text-xs text-gray-500",children:c(e.createdAt)})]}),(0,t.jsxs)("b",{className:e.amount>=0?"text-green-600":"text-red-600",children:[e.amount>=0?"+":"",n(Math.abs(e.amount))]})]},e.id))]}),(0,t.jsxs)("div",{className:"rounded-3xl border border-gray-200 bg-white p-6 shadow-sm",children:[(0,t.jsx)("h2",{className:"mb-4 font-bold",children:"درخواست‌های برداشت"}),0===h.withdrawals.length?(0,t.jsx)(o,{text:"هنوز درخواست برداشتی ثبت نشده است."}):h.withdrawals.map(e=>(0,t.jsxs)("div",{className:"border-b py-3 text-sm",children:[(0,t.jsxs)("div",{className:"flex justify-between",children:[(0,t.jsx)("b",{children:n(e.amount)}),(0,t.jsx)("span",{className:`rounded-full px-2 py-1 text-xs font-bold ${"approved"===e.status?"bg-green-100 text-green-700":"rejected"===e.status?"bg-red-100 text-red-700":"bg-amber-100 text-amber-700"}`,children:"approved"===e.status?"تسویه شد":"rejected"===e.status?"رد شد":"در انتظار بررسی"})]}),(0,t.jsxs)("p",{className:"mt-1 text-xs text-gray-500",children:[e.id," · ",c(e.createdAt)]}),e.adminNote&&(0,t.jsxs)("p",{className:"mt-1 text-xs text-gray-600",children:["یادداشت ادمین: ",e.adminNote]})]},e.id))]})]})]}),"survey"===e&&(0,t.jsxs)("section",{children:[(0,t.jsx)("h1",{className:"mb-2 text-2xl font-bold text-[#003b5c]",children:"نظرسنجی معاملات تکمیل‌شده"}),(0,t.jsx)("p",{className:"mb-6 text-sm text-gray-500",children:"امتیاز شما مستقیماً در رتبه‌بندی فروشندگان برتر اثر دارد."}),(0,t.jsx)("div",{className:"space-y-5",children:0===ei.length?(0,t.jsx)(o,{text:"نظرسنجی تکمیل‌نشده‌ای ندارید."}):ei.map(e=>(0,t.jsx)(r.default,{role:"buyer",reviewerId:h.buyer.id,order:e,onSaved:Q},e.id))})]}),"reviews"===e&&(0,t.jsxs)("section",{children:[(0,t.jsx)("h1",{className:"mb-2 text-2xl font-bold text-[#003b5c]",children:"دیدگاه‌ها"}),(0,t.jsx)("p",{className:"mb-6 text-sm text-gray-500",children:"توضیحاتی که فروشندگان در فرم نظرسنجی درباره شما نوشته‌اند، اینجا نمایش داده می‌شود."}),(0,t.jsx)("div",{className:"space-y-4",children:0===ec.length?(0,t.jsx)(o,{text:"هنوز دیدگاهی برای شما ثبت نشده است."}):ec.map(e=>{let s=en.get(e.orderId);return(0,t.jsxs)("article",{className:"rounded-3xl border border-gray-200 bg-white p-5 shadow-sm",children:[(0,t.jsxs)("div",{className:"flex flex-wrap items-center justify-between gap-3",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("p",{className:"font-bold text-[#003b5c]",children:s?.sellerName||"فروشنده"}),(0,t.jsxs)("p",{className:"mt-1 text-xs text-gray-500",children:["سفارش ",e.orderId]})]}),(0,t.jsx)(l.default,{score:20*e.overall,size:"sm"})]}),(0,t.jsx)("p",{className:"mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-600",children:e.comment||"بدون توضیح"})]},e.id)})})]}),"invoices"===e&&(0,t.jsxs)("section",{children:[(0,t.jsx)("h1",{className:"mb-6 text-2xl font-bold text-[#003b5c]",children:"فاکتورهای معامله"}),(0,t.jsx)("div",{className:"overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm",children:0===el.length?(0,t.jsx)(o,{text:"پس از پرداخت سفارش، فاکتور در این بخش ایجاد می‌شود."}):el.map(e=>(0,t.jsxs)("div",{className:"flex flex-col justify-between gap-4 border-b p-5 sm:flex-row sm:items-center",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("p",{className:"font-mono font-bold text-[#003b5c]",children:e.id}),(0,t.jsx)("p",{className:"mt-1 font-bold",children:e.title}),(0,t.jsxs)("p",{className:"mt-1 text-xs text-gray-500",children:["فروشنده: ",e.sellerName," · وضعیت: ",e.status]})]}),(0,t.jsx)("button",{onClick:()=>{let t=(0,d.generateInvoiceHTML)({id:e.id,date:c(e.paymentAt||e.createdAt),amount:n(e.totalAmount),seller:e.sellerName,product:e.title,status:e.status});window.open(URL.createObjectURL(new Blob([t],{type:"text/html;charset=utf-8"})),"_blank")},className:"rounded-xl bg-blue-50 px-4 py-2 font-bold text-[#00a8e8]",children:"چاپ فاکتور"})]},e.id))})]}),"archive"===e&&(0,t.jsxs)("section",{children:[(0,t.jsx)("h1",{className:"mb-6 text-2xl font-bold text-[#003b5c]",children:"بایگانی سفارش‌ها"}),(0,t.jsx)("div",{className:"space-y-4",children:0===er.length?(0,t.jsx)(o,{text:"هنوز سفارشی برای بایگانی ندارید."}):er.map(e=>(0,t.jsx)(m,{order:e,children:(0,t.jsx)("button",{onClick:()=>J(e.id),className:"mt-4 rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-600",children:"انتقال به بایگانی"})},e.id))})]}),"messages"===e&&(0,t.jsxs)("section",{className:"grid min-h-[480px] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm md:grid-cols-3",children:[(0,t.jsxs)("div",{className:"border-l bg-gray-50 p-4",children:[(0,t.jsx)("h2",{className:"mb-4 font-bold",children:"گفتگو با فروشندگان"}),0===ee.length?(0,t.jsx)("p",{className:"text-sm text-gray-500",children:"پس از دریافت پیشنهاد یا سفارش، گفتگوها اینجا نمایش داده می‌شوند."}):ee.map(e=>(0,t.jsx)("button",{onClick:()=>q(e.id),className:`mb-2 w-full rounded-xl p-3 text-right text-sm font-bold ${D===e.id?"bg-blue-100 text-[#003b5c]":"bg-white text-gray-600"}`,children:e.name},e.id))]}),(0,t.jsxs)("div",{className:"flex flex-col p-5 md:col-span-2",children:[(0,t.jsx)("div",{className:"flex-1 space-y-3 overflow-y-auto",children:0===et.length?(0,t.jsx)("p",{className:"text-center text-sm text-gray-500",children:"پیامی در این گفتگو وجود ندارد."}):et.map(e=>(0,t.jsxs)("div",{className:`max-w-[75%] rounded-2xl p-3 text-sm ${e.senderId===h.buyer.id?"mr-auto bg-[#003b5c] text-white":"bg-gray-100 text-gray-800"}`,children:[e.content,(0,t.jsx)("p",{className:"mt-1 text-[10px] opacity-70",children:c(e.createdAt)})]},e.id))}),(0,t.jsxs)("div",{className:"mt-4 flex gap-2",children:[(0,t.jsx)("input",{value:O,onChange:e=>R(e.target.value),placeholder:"پیام خود را بنویسید...",className:"flex-1 rounded-xl border p-3 outline-none focus:border-[#00a8e8]"}),(0,t.jsx)("button",{onClick:X,className:"rounded-xl bg-[#00a8e8] px-5 font-bold text-white",children:"ارسال"})]})]})]}),"notifications"===e&&(0,t.jsxs)("section",{children:[(0,t.jsx)("h1",{className:"mb-6 text-2xl font-bold text-[#003b5c]",children:"اعلان‌های واقعی"}),(0,t.jsx)("div",{className:"overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm",children:0===h.notifications.length?(0,t.jsx)(o,{text:"هنوز اعلانی ندارید."}):h.notifications.map(e=>(0,t.jsx)("div",{className:`border-b p-5 ${e.readAt?"bg-gray-50":"bg-white"}`,children:(0,t.jsxs)("div",{className:"flex justify-between gap-4",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("p",{className:"font-bold text-[#003b5c]",children:e.title}),(0,t.jsx)("p",{className:"mt-1 text-sm text-gray-600",children:e.body})]}),(0,t.jsx)("p",{className:"text-xs text-gray-400",children:c(e.createdAt)})]})},e.id))})]}),"profile"===e&&(0,t.jsxs)("section",{className:"mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm",children:[(0,t.jsx)("h1",{className:"mb-6 text-2xl font-bold text-[#003b5c]",children:"پروفایل خریدار"}),(0,t.jsxs)("div",{className:"grid gap-4 md:grid-cols-2",children:[(0,t.jsx)(x,{label:"نام یا نام شرکت",value:z.fullName,onChange:e=>P({...z,fullName:e})}),(0,t.jsx)(x,{label:"آدرس پیش‌فرض ارسال",value:z.defaultAddress,onChange:e=>P({...z,defaultAddress:e})})]}),(0,t.jsx)("label",{className:"mt-4 block text-sm font-bold text-gray-700",children:"درباره خریدار"}),(0,t.jsx)("textarea",{value:z.bio,onChange:e=>P({...z,bio:e.target.value}),className:"mt-2 min-h-28 w-full rounded-xl border p-3 outline-none focus:border-[#00a8e8]"}),(0,t.jsx)("button",{onClick:G,className:"mt-5 rounded-xl bg-[#003b5c] px-7 py-3 font-bold text-white",children:"ذخیره پروفایل"})]}),"settings"===e&&(0,t.jsxs)("section",{className:"mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm",children:[(0,t.jsx)("h1",{className:"mb-6 text-2xl font-bold text-[#003b5c]",children:"تنظیمات خریدار"}),(0,t.jsx)("h2",{className:"border-b pb-3 text-sm font-bold",children:"حوزه‌های خرید مورد علاقه"}),(0,t.jsx)("div",{className:"mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3",children:i.map(e=>(0,t.jsxs)("label",{className:`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-bold ${z.categories.includes(e)?"border-[#00a8e8] bg-blue-50":"bg-gray-50"}`,children:[(0,t.jsx)("input",{type:"checkbox",checked:z.categories.includes(e),onChange:()=>P({...z,categories:z.categories.includes(e)?z.categories.filter(t=>t!==e):[...z.categories,e]})}),e]},e))}),(0,t.jsxs)("div",{className:"mt-8 border-t pt-5",children:[(0,t.jsx)("h2",{className:"mb-3 text-sm font-bold",children:"تنظیمات اعلان و پرداخت"}),(0,t.jsxs)("label",{className:"mb-2 flex items-center gap-2 text-sm",children:[(0,t.jsx)("input",{type:"checkbox",defaultChecked:!0})," اعلان پیشنهاد جدید از فروشنده"]}),(0,t.jsxs)("label",{className:"mb-2 flex items-center gap-2 text-sm",children:[(0,t.jsx)("input",{type:"checkbox",defaultChecked:!0})," اعلان ارسال کالا و کد رهگیری"]}),(0,t.jsxs)("label",{className:"flex items-center gap-2 text-sm",children:[(0,t.jsx)("input",{type:"checkbox",defaultChecked:!0})," انتقال مستقیم به پرداخت پس از انتخاب پیشنهاد"]})]}),(0,t.jsx)("button",{onClick:G,className:"mt-6 rounded-xl bg-[#003b5c] px-7 py-3 font-bold text-white",children:"ذخیره تنظیمات"})]})]})]})}])}]);