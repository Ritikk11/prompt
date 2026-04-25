const fs = require('fs');
let code = fs.readFileSync('app/admin/page.tsx', 'utf8');
code = code.replace(/<Image /g, '<ImageIcon ');
fs.writeFileSync('app/admin/page.tsx', code);
