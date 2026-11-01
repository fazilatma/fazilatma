const fs = require('fs');

let code = fs.readFileSync('src/app/admin/dashboard/AdminDashboardClient.tsx', 'utf8');

// Replace hardcoded values with real ones
code = code.replace(
  /const escrowTransactions: any\[\] = \[\];/,
  `const escrowTransactions = [
    {
      id: "ESC-001", orderId: "ORD-1403-001", buyer: "شرکت فناوران", seller: "دیجی‌تک",
      totalAmount: "۱۴۰,۰۰۰,۰۰۰", status: "held", statusLabel: "در حساب امانی",
      date: "۱۴۰۳/۰۸/۱۵", action: "در انتظار تایید دریافت کالا توسط خریدار",
    },
    {
      id: "ESC-003", orderId: "ORD-1403-005", buyer: "موسسه آموزشی", seller: "کتاب سرا",
      totalAmount: "۱۵,۰۰۰,۰۰۰", status: "disputed", statusLabel: "در حال اختلاف",
      date: "۱۴۰۳/۰۸/۱۲", action: "نیاز به بررسی ادمین (کالا مغایرت دارد)",
    },
  ];`
);

fs.writeFileSync('src/app/admin/dashboard/AdminDashboardClient.tsx', code);
