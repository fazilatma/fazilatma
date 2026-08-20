const fs = require('fs');

let reqCode = fs.readFileSync('src/app/requests/page.tsx', 'utf8');
reqCode = reqCode.replace(/const dummyRequests = \[[\s\S]*?\];/, 'const dummyRequests: any[] = [];');
fs.writeFileSync('src/app/requests/page.tsx', reqCode);

let buyCode = fs.readFileSync('src/app/buyers/page.tsx', 'utf8');
buyCode = buyCode.replace(/const buyers = \[[\s\S]*?\];/, 'const buyers: any[] = [];');
fs.writeFileSync('src/app/buyers/page.tsx', buyCode);

let sellCode = fs.readFileSync('src/app/sellers/page.tsx', 'utf8');
sellCode = sellCode.replace(/const sellers = \[[\s\S]*?\];/, 'const sellers: any[] = [];');
fs.writeFileSync('src/app/sellers/page.tsx', sellCode);

