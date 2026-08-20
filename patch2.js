const fs = require('fs');
let code = fs.readFileSync('src/app/requests/page.tsx', 'utf8');
code = code.replace('return (', 'const allRequests = [...realRequests, ...dummyRequests];\n\n  return (');
fs.writeFileSync('src/app/requests/page.tsx', code);
