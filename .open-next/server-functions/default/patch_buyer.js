const fs = require('fs');
let code = fs.readFileSync('src/app/buyer/dashboard/page.tsx', 'utf8');
code = code.replace(/const \[buyerRequests, setBuyerRequests\] = useState\(\[[\s\S]*?\]\);/, 'const [buyerRequests, setBuyerRequests] = useState<any[]>([]);');
code = code.replace(/const \[buyerOrders, setBuyerOrders\] = useState\(\[[\s\S]*?\]\);/, 'const [buyerOrders, setBuyerOrders] = useState<any[]>([]);');
code = code.replace(/const buyerNotifications = \[[\s\S]*?\];/, 'const buyerNotifications: any[] = [];');
code = code.replace(/const invoices = \[[\s\S]*?\];/, 'const invoices: any[] = [];');
code = code.replace(/const chats = \[[\s\S]*?\];/, 'const chats: any[] = [];');
code = code.replace(/const transactions = \[[\s\S]*?\];/, 'const transactions: any[] = [];');
fs.writeFileSync('src/app/buyer/dashboard/page.tsx', code);
