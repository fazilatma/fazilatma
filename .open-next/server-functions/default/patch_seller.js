const fs = require('fs');
let code = fs.readFileSync('src/app/seller/dashboard/page.tsx', 'utf8');
code = code.replace(/const \[inventory, setInventory\] = useState\(\[[\s\S]*?\]\);/, 'const [inventory, setInventory] = useState<any[]>([]);');
code = code.replace(/const matchedRequests = \[[\s\S]*?\];/, 'const matchedRequests: any[] = [];');
code = code.replace(/const activeSales = \[[\s\S]*?\];/, 'const activeSales: any[] = [];');
fs.writeFileSync('src/app/seller/dashboard/page.tsx', code);
