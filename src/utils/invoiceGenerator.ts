import { getCachedLiveContent } from "@/hooks/useLiveContent";

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

function numericMoney(value: unknown) {
  if (typeof value === "number") return Math.max(0, Math.round(value));
  const normalized = normalizeDigits(String(value || ""));
  return Math.max(0, Number(normalized.replace(/\D/g, "")) || 0);
}

function formatMoney(value: unknown) {
  const amount = numericMoney(value);
  return amount ? `${amount.toLocaleString("fa-IR")} تومان` : "۰ تومان";
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function statusLabel(status?: string) {
  const labels: Record<string, string> = {
    pending_payment: "در انتظار پرداخت",
    paid: "پرداخت‌شده و آماده ارسال",
    shipped: "ارسال‌شده",
    completed: "تکمیل‌شده",
    cancelled: "لغوشده",
    returned: "مرجوع‌شده",
  };
  return labels[status || ""] || status || "ثبت‌شده";
}

function specRow(label: string, value: unknown) {
  if (!value) return "";
  return `<div class="spec-row"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`;
}

export const generateInvoiceHTML = (invoiceData: any) => {
  const liveContent = getCachedLiveContent();
  const documentId =
    invoiceData.id || invoiceData.orderId || `INV-${Date.now()}`;
  const date = invoiceData.date || new Date().toLocaleDateString("fa-IR");
  const sellerName =
    invoiceData.sellerName || invoiceData.seller || "فروشنده OptiBid";
  const buyerName =
    invoiceData.buyerName || invoiceData.buyer || "خریدار OptiBid";
  const productTitle =
    invoiceData.product || invoiceData.title || "کالای مورد معامله";
  const description =
    invoiceData.description || invoiceData.productDescription || "";
  const category = invoiceData.category || "کالا / خدمات";
  const quantity = Math.max(1, Number(invoiceData.quantity || 1) || 1);
  const totalAmount = numericMoney(
    invoiceData.totalAmount ?? invoiceData.amount,
  );
  const unitAmount =
    numericMoney(invoiceData.unitAmount) || Math.round(totalAmount / quantity);
  const platformFee = numericMoney(invoiceData.platformFee);
  const sellerAmount =
    numericMoney(invoiceData.sellerAmount) ||
    Math.max(0, totalAmount - platformFee);
  const taxAmount = numericMoney(invoiceData.taxAmount);
  const shippingAmount = numericMoney(invoiceData.shippingAmount);
  const payableAmount = totalAmount + taxAmount + shippingAmount;
  const specs = invoiceData.productSpecs || {};
  const verificationUrl = `https://optibid.fazilat-ma.workers.dev/verify/${encodeURIComponent(documentId)}`;

  const brand = specs.brand || invoiceData.brand || "—";
  const itemSubtitle = [specs.exactModel, specs.cpu, specs.ram, specs.storage]
    .filter(Boolean)
    .join(" · ");

  const specsHtml = [
    specRow("برند", specs.brand),
    specRow("مدل دقیق", specs.exactModel),
    specRow("کد مدل / کانفیگ", specs.serialOrConfig),
    specRow("پردازنده", specs.cpu),
    specRow("رم", specs.ram),
    specRow("حافظه", specs.storage),
    specRow("گرافیک", specs.gpu),
    specRow("نمایشگر", specs.display),
    specRow("سال ساخت", specs.manufactureYear),
    specRow("وضعیت کالا", specs.productCondition),
    specRow("گارانتی", specs.warrantyStatus),
    specRow("سلامت کلی قطعات", specs.partsHealth),
    specRow(
      "سلامت باتری",
      specs.batteryHealthPercent ? `${specs.batteryHealthPercent}%` : "",
    ),
    specRow("گرید ظاهری", specs.appearanceGrade),
    specRow("سابقه تعمیر", specs.repairHistory),
    specRow(
      "مهلت تست",
      specs.testDeadlineDays ? `${specs.testDeadlineDays} روز` : "",
    ),
  ]
    .filter(Boolean)
    .join("");

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>فاکتور رسمی معامله - ${escapeHtml(documentId)}</title>
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v32.103/Vazirmatn-font-face.css" rel="stylesheet" />
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: #eaf1f8;
      color: #0f172a;
      font-family: Vazirmatn, Tahoma, Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 5;
      display: flex;
      justify-content: center;
      gap: 10px;
      padding: 14px;
      background: rgba(234, 241, 248, 0.9);
      backdrop-filter: blur(10px);
    }
    .toolbar button {
      border: 0;
      border-radius: 14px;
      padding: 10px 18px;
      background: #003b5c;
      color: white;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 10px 24px rgba(0, 59, 92, 0.22);
    }
    .toolbar button.secondary { background: white; color: #003b5c; border: 1px solid #cbd5e1; }
    .sheet {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      margin: 22px auto 40px;
      overflow: hidden;
      border-radius: 24px;
      background: white;
      box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
    }
    .content { position: relative; z-index: 2; padding: 16mm; }
    .watermark {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      opacity: 0.035;
      z-index: 1;
      pointer-events: none;
    }
    .watermark .mark { width: 75mm; height: 75mm; border: 18px solid #003b5c; border-radius: 28px; transform: rotate(45deg); }
    .header {
      display: grid;
      grid-template-columns: 1.2fr 1.1fr 1.2fr;
      gap: 18px;
      align-items: start;
      padding-bottom: 16px;
      border-bottom: 2px solid #dbe6ef;
    }
    .brandbox { display: flex; align-items: center; gap: 12px; }
    .logo {
      width: 54px;
      height: 54px;
      border-radius: 16px;
      background: linear-gradient(135deg, #003b5c, #00a8e8);
      display: grid;
      place-items: center;
      color: white;
      font-size: 30px;
      font-weight: 900;
    }
    .brand-title { font-size: 30px; font-weight: 950; letter-spacing: -1px; color: #0f172a; direction: ltr; text-align: left; }
    .brand-title span { color: #00a8e8; }
    .tagline-fa { margin-top: 6px; color: #0f2740; font-weight: 800; }
    .tagline-en { margin-top: 4px; color: #64748b; font-size: 11px; direction: ltr; text-align: left; }
    .title { text-align: center; padding-top: 8px; }
    .title h1 { margin: 0; font-size: 29px; font-weight: 950; color: #0f172a; }
    .title .line { width: 70px; height: 4px; margin: 13px auto; border-radius: 99px; background: linear-gradient(90deg, #003b5c, #00a8e8); }
    .title h2 { margin: 0; direction: ltr; color: #003b5c; font-size: 18px; }
    .meta { justify-self: end; width: 100%; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden; }
    .meta-row { display: grid; grid-template-columns: 1fr 1.1fr; border-bottom: 1px solid #e2e8f0; }
    .meta-row:last-child { border-bottom: 0; }
    .meta-row span { padding: 9px 12px; background: #f8fafc; color: #475569; font-size: 11px; }
    .meta-row b { padding: 9px 12px; color: #003b5c; direction: ltr; text-align: left; font-size: 12px; }
    .party-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 20px; }
    .party-card { border: 1px solid #e2e8f0; border-radius: 22px; padding: 16px; background: rgba(248, 250, 252, 0.7); }
    .section-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 13px; padding-bottom: 8px; border-bottom: 2px solid #00a8e8; color: #003b5c; font-weight: 950; }
    .section-title small { color: #64748b; direction: ltr; font-size: 11px; }
    .info-row { display: grid; grid-template-columns: 105px 1fr; gap: 10px; padding: 7px 0; font-size: 12px; line-height: 1.8; }
    .info-row span { color: #64748b; }
    .info-row b { color: #0f172a; font-weight: 800; }
    .items { margin-top: 20px; border: 1px solid #cbd5e1; border-radius: 18px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: linear-gradient(135deg, #003b5c, #004f86); color: white; }
    th { padding: 12px 8px; font-size: 11px; border-left: 1px solid rgba(255,255,255,.14); vertical-align: middle; }
    th small { display: block; margin-top: 4px; direction: ltr; color: #bfeaff; font-size: 9px; }
    td { padding: 14px 9px; border-left: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 12px; vertical-align: middle; }
    td.item { text-align: right; line-height: 1.9; }
    td.item b { display: block; color: #0f2740; font-size: 13px; }
    td.item small { display: block; color: #64748b; direction: ltr; text-align: left; }
    .status-pill { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 5px 10px; background: #e0f2fe; color: #0369a1; font-size: 10px; font-weight: 900; }
    .summary-grid { display: grid; grid-template-columns: 1fr 0.95fr; gap: 18px; margin-top: 20px; align-items: start; }
    .notes, .totals, .specs { border: 1px solid #e2e8f0; border-radius: 20px; background: rgba(255,255,255,.92); overflow: hidden; }
    .notes { padding: 16px; min-height: 145px; }
    .notes h3, .specs h3 { margin: 0 0 10px; color: #003b5c; font-size: 14px; }
    .notes ul { margin: 0; padding-right: 18px; color: #334155; font-size: 11px; line-height: 2.15; }
    .total-row { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #e2e8f0; }
    .total-row:last-child { border-bottom: 0; }
    .total-row span, .total-row b { padding: 12px 14px; font-size: 12px; }
    .total-row span { background: #f8fafc; color: #334155; }
    .total-row b { text-align: left; direction: ltr; }
    .total-row.highlight { background: #003b5c; color: white; }
    .total-row.highlight span { background: transparent; color: white; }
    .total-row.highlight b { font-size: 16px; color: white; }
    .total-row.payable { background: linear-gradient(135deg, #003b5c, #0b9c56); color: white; }
    .total-row.payable span { background: transparent; color: white; font-weight: 900; }
    .total-row.payable b { color: white; font-size: 18px; }
    .specs { margin-top: 18px; padding: 16px; }
    .spec-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .spec-row { border-radius: 12px; background: #f8fafc; padding: 8px 10px; min-height: 56px; }
    .spec-row span { display: block; color: #64748b; font-size: 10px; }
    .spec-row b { display: block; margin-top: 5px; color: #0f172a; font-size: 11px; line-height: 1.5; }
    .verification { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 20px; }
    .box { border: 1px solid #e2e8f0; border-radius: 22px; padding: 16px; background: #fff; min-height: 125px; }
    .signature-wrap { display: flex; align-items: center; justify-content: space-around; margin-top: 14px; }
    .signature { width: 140px; height: 48px; border-bottom: 2px solid #94a3b8; color: #003b5c; font-family: cursive; font-size: 34px; transform: rotate(-8deg); }
    .stamp { width: 96px; height: 96px; border: 4px solid #003b5c; border-radius: 999px; display: grid; place-items: center; color: #003b5c; font-weight: 950; text-align: center; transform: rotate(-10deg); opacity: .82; }
    .verify-inner { display: grid; grid-template-columns: 1fr 105px; gap: 14px; align-items: center; }
    .qr { width: 105px; height: 105px; border: 1px solid #94a3b8; border-radius: 12px; padding: 6px; background: white; }
    .qr img { width: 100%; height: 100%; display: block; }
    .footer { position: absolute; bottom: 0; right: 0; left: 0; display: flex; justify-content: space-between; align-items: center; padding: 14px 16mm; background: #082848; color: white; font-size: 12px; z-index: 3; }
    .footer b { font-size: 20px; direction: ltr; }
    .print-spacer { height: 58px; }
    @media print {
      body { background: white; }
      .toolbar { display: none; }
      .sheet { margin: 0; border-radius: 0; box-shadow: none; width: 210mm; min-height: 297mm; }
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <button onclick="window.print()">چاپ / ذخیره PDF</button>
    <button class="secondary" onclick="window.close()">بستن</button>
  </div>

  <main class="sheet">
    <div class="watermark"><div class="mark"></div></div>
    <section class="content">
      <header class="header">
        <div>
          <div class="brandbox">
            <div class="logo">◇</div>
            <div>
              <div class="brand-title">Opti<span>Bid</span></div>
              <div class="tagline-fa">تامین هوشمند، معامله امن</div>
              <div class="tagline-en">Smart Sourcing. Secure Escrow.</div>
            </div>
          </div>
        </div>
        <div class="title">
          <h1>فاکتور رسمی معامله</h1>
          <div class="line"></div>
          <h2>Official Transaction Invoice</h2>
        </div>
        <div class="meta">
          <div class="meta-row"><span>شماره سند / Document No.</span><b>${escapeHtml(documentId)}</b></div>
          <div class="meta-row"><span>تاریخ / Date</span><b>${escapeHtml(date)}</b></div>
          <div class="meta-row"><span>وضعیت / Status</span><b>${escapeHtml(statusLabel(invoiceData.status))}</b></div>
          <div class="meta-row"><span>اعتبار سند / Validity</span><b>15 Days</b></div>
        </div>
      </header>

      <section class="party-grid">
        <article class="party-card">
          <div class="section-title"><span>اطلاعات فروشنده</span><small>Seller Information</small></div>
          <div class="info-row"><span>نام فروشنده</span><b>${escapeHtml(sellerName)}</b></div>
          <div class="info-row"><span>آدرس</span><b>${escapeHtml(liveContent.invoiceCompanyAddressFa)}</b></div>
          <div class="info-row"><span>تلفن</span><b dir="ltr">021-12345678</b></div>
          <div class="info-row"><span>ایمیل</span><b dir="ltr">seller@optibid.ir</b></div>
          <div class="info-row"><span>شناسه مالیاتی</span><b dir="ltr">123456789012</b></div>
        </article>
        <article class="party-card">
          <div class="section-title"><span>اطلاعات خریدار</span><small>Customer Information</small></div>
          <div class="info-row"><span>نام خریدار</span><b>${escapeHtml(buyerName)}</b></div>
          <div class="info-row"><span>آدرس تحویل</span><b>${escapeHtml(invoiceData.shippingAddress || liveContent.invoiceShippingAddressFa)}</b></div>
          <div class="info-row"><span>شماره سفارش</span><b dir="ltr">${escapeHtml(documentId)}</b></div>
          <div class="info-row"><span>روش پرداخت</span><b>${escapeHtml(invoiceData.paymentMethod === "wallet" ? "کیف پول" : invoiceData.paymentMethod === "zarinpal" ? "زرین‌پال" : invoiceData.paymentMethod === "gateway" ? "درگاه پرداخت آزمایشی" : "پرداخت امانی OptiBid")}</b></div>
          <div class="info-row"><span>حساب امانی</span><b>وجه تا تایید دریافت نزد OptiBid امانت است</b></div>
        </article>
      </section>

      <section class="items">
        <table>
          <thead>
            <tr>
              <th style="width:46px">ردیف<small>No.</small></th>
              <th>نام کالا<small>Item Name</small></th>
              <th style="width:92px">دسته / برند<small>Brand</small></th>
              <th style="width:64px">تعداد<small>Qty</small></th>
              <th style="width:120px">قیمت واحد<small>Unit Price</small></th>
              <th style="width:84px">مالیات<small>Tax</small></th>
              <th style="width:130px">قیمت کل<small>Total</small></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td class="item">
                <b>${escapeHtml(productTitle)}</b>
                ${itemSubtitle ? `<small>${escapeHtml(itemSubtitle)}</small>` : ""}
                ${description ? `<div style="font-size:10px;color:#64748b;margin-top:5px">${escapeHtml(description).slice(0, 180)}</div>` : ""}
                <div style="margin-top:7px"><span class="status-pill">🔒 پرداخت امانی / Escrow</span></div>
              </td>
              <td>${escapeHtml(brand === "—" ? category : brand)}</td>
              <td><b>${quantity.toLocaleString("fa-IR")}</b></td>
              <td>${formatMoney(unitAmount)}</td>
              <td>${taxAmount ? formatMoney(taxAmount) : "۰٪"}</td>
              <td><b>${formatMoney(totalAmount)}</b></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="summary-grid">
        <article class="notes">
          <h3>توضیحات / Notes</h3>
          <ul>
            <li>این سند بر اساس سفارش واقعی ثبت‌شده در OptiBid صادر شده است.</li>
            <li>وجه معامله تا تایید دریافت کالا توسط خریدار در حساب امانی نگهداری می‌شود.</li>
            <li>فروشنده متعهد است کالا را مطابق مشخصات تاییدشده توسط خریدار ارسال کند.</li>
            <li>در صورت مغایرت مشخصات، فرآیند رسیدگی و مرجوعی مطابق قوانین پلتفرم انجام می‌شود.</li>
          </ul>
        </article>
        <article class="totals">
          <div class="total-row"><span>جمع مبلغ کالا</span><b>${formatMoney(totalAmount)}</b></div>
          <div class="total-row"><span>مالیات / عوارض</span><b>${taxAmount ? formatMoney(taxAmount) : "۰ تومان"}</b></div>
          <div class="total-row"><span>هزینه حمل</span><b>${shippingAmount ? formatMoney(shippingAmount) : "طبق توافق / رایگان"}</b></div>
          <div class="total-row highlight"><span>جمع کل قابل پرداخت</span><b>${formatMoney(payableAmount)}</b></div>
          <div class="total-row"><span>کمیسیون پلتفرم</span><b>${formatMoney(platformFee)}</b></div>
          <div class="total-row payable"><span>سهم خالص فروشنده پس از کمیسیون</span><b>${formatMoney(sellerAmount)}</b></div>
        </article>
      </section>

      ${specsHtml ? `<section class="specs"><h3>مشخصات کالای تاییدشده قبل از پرداخت</h3><div class="spec-grid">${specsHtml}</div>${specs.returnPolicy ? `<div style="margin-top:10px;border-radius:12px;background:#ecfdf5;padding:10px;font-size:11px;color:#166534"><b>شرایط مرجوعی:</b> ${escapeHtml(specs.returnPolicy)}</div>` : ""}</section>` : ""}

      <section class="verification">
        <article class="box">
          <div class="section-title"><span>امضا و مهر</span><small>Signature & Stamp</small></div>
          <div class="signature-wrap">
            <div>
              <div class="signature">OptiBid</div>
              <div style="margin-top:8px;font-size:11px;text-align:center;color:#334155">مدیر فروش / Sales Manager</div>
            </div>
            <div class="stamp">OptiBid<br/>Verified</div>
          </div>
        </article>
        <article class="box">
          <div class="section-title"><span>تایید و اعتبارسنجی</span><small>Verification</small></div>
          <div class="verify-inner">
            <div style="font-size:11px;line-height:2;color:#334155">
              برای بررسی اعتبار این فاکتور، کد QR را اسکن کنید یا شماره سند را در سامانه وارد کنید.
              <div dir="ltr" style="margin-top:8px;color:#003b5c;font-weight:800">${escapeHtml(documentId)}</div>
            </div>
            <div class="qr"><img alt="QR" src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(verificationUrl)}" /></div>
          </div>
        </article>
      </section>
      <div class="print-spacer"></div>
    </section>
    <footer class="footer">
      <span dir="ltr">☎ 021-12345678</span>
      <span dir="ltr">✉ info@optibid.ir</span>
      <span dir="ltr">🌐 optibid.fazilat-ma.workers.dev</span>
      <b>OptiBid</b>
    </footer>
  </main>
</body>
</html>`;
};
