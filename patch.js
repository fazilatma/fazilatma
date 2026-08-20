const fs = require('fs');
let code = fs.readFileSync('src/app/requests/page.tsx', 'utf8');
code = code.replace('const categories = [', 'const allRequests = [...realRequests, ...dummyRequests];\n\n  const allCategories = [');
fs.writeFileSync('src/app/requests/page.tsx', code);
