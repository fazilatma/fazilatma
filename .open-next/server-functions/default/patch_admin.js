const fs = require('fs');
let code = fs.readFileSync('src/app/admin/dashboard/page.tsx', 'utf8');
code = code.replace(/const escrowTransactions = \[[\s\S]*?\];/, 'const escrowTransactions: any[] = [];');
code = code.replace(/const pendingVerifications = \[[\s\S]*?\];/, 'const pendingVerifications: any[] = [];');
fs.writeFileSync('src/app/admin/dashboard/page.tsx', code);
