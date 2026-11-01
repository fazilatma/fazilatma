const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');
code = code.replace(/const dummyRequests = \[[\s\S]*?\];/, 'const dummyRequests: any[] = [];');
code = code.replace(/const sampleSellers = \[[\s\S]*?\];/, 'const sampleSellers: any[] = [];');
code = code.replace(/const sampleBuyers = \[[\s\S]*?\];/, 'const sampleBuyers: any[] = [];');
fs.writeFileSync('src/app/page.tsx', code);
