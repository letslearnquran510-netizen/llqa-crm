const fs = require('fs');
let code = fs.readFileSync('src/components/DashMod.js', 'utf8');

code = code.replace(/label: "Subject Teachers",\s*value: 8,/g, 'label: "Subject Teachers",\n    value: 0,');

fs.writeFileSync('src/components/DashMod.js', code);
console.log('DashMod Subject Teachers value wiped');
